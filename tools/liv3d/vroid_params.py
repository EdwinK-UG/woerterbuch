"""Read and set the shape parameters of a VRoid Studio project file (.vroid) without clicking through hundreds of sliders.

A .vroid file is a zip; v1model/data.bin is a protobuf. Its top-level field 4 entries are the model's parts ("transferables":
Head, Arm, Leg, Face ...); inside each, field 3 -> field 5 -> repeated field 2 are the shape parameters {1: name, 2: weight
(float32, left out when 0)}. This tool only re-encodes along that path; everything else is copied byte for byte.

    python3 tools/liv3d/vroid_params.py list  IN.vroid                 # every part and its parameters
    python3 tools/liv3d/vroid_params.py set   IN.vroid OUT.vroid name=value [name=value ...]
    python3 tools/liv3d/vroid_params.py png   IN.vroid DIR                     # write every embedded texture as DIR/NNN.png
    python3 tools/liv3d/vroid_params.py tex   IN.vroid OUT.vroid NNN=file.png [...]   # replace embedded textures (same size)
"""
import re, struct, sys, zipfile

SIG = b'\x89PNG\r\n\x1a\n'


def rv(b, i):
    r = 0; s = 0
    while True:
        c = b[i]; i += 1; r |= (c & 0x7f) << s; s += 7
        if c < 0x80: return r, i


def wv(n):
    out = bytearray()
    while True:
        c = n & 0x7f; n >>= 7
        if n: out.append(c | 0x80)
        else: out.append(c); return bytes(out)


def parse(b):
    """-> list of [field, wiretype, value]; value is int (varint), bytes (64-bit, length-delimited, 32-bit)."""
    i = 0; out = []
    while i < len(b):
        k, i = rv(b, i); f = k >> 3; w = k & 7
        if w == 0: v, i = rv(b, i)
        elif w == 1: v = b[i:i + 8]; i += 8
        elif w == 5: v = b[i:i + 4]; i += 4
        elif w == 2: l, i = rv(b, i); v = b[i:i + l]; i += l
        else: raise ValueError(f'wire type {w}')
        out.append([f, w, v])
    return out


def build(items):
    out = bytearray()
    for f, w, v in items:
        out += wv((f << 3) | w)
        if w == 0: out += wv(v)
        elif w == 2: out += wv(len(v)) + v
        else: out += v
    return bytes(out)


def walk(data, edit=None):
    """Yields (part name, parameter name, weight) and applies edit {name: value} (optionally 'Part.name')."""
    top = parse(data); found = []; done = set()
    for t in top:
        if t[0] != 4 or t[1] != 2: continue
        part = parse(t[2]); pname = ''
        for p in part:
            if p[0] == 2 and p[1] == 2: pname = p[2].decode('utf8', 'replace')
        for p in part:
            if p[0] != 3 or p[1] != 2: continue
            m3 = parse(p[2])
            for q in m3:
                if q[0] != 5 or q[1] != 2: continue
                m5 = parse(q[2])
                for r in m5:
                    if r[0] != 2 or r[1] != 2: continue
                    try: e = parse(r[2])
                    except Exception: continue
                    name = None; weight = 0.0
                    for x in e:
                        if x[0] == 1 and x[1] == 2: name = x[2].decode('utf8', 'replace')
                        if x[0] == 2 and x[1] == 5: weight = struct.unpack('<f', x[2])[0]
                    if name is None: continue
                    found.append((pname, name, weight))
                    if edit:
                        key = name if name in edit else (f'{pname.split(".")[-1]}.{name}' if f'{pname.split(".")[-1]}.{name}' in edit else None)
                        if key is not None:
                            val = float(edit[key]); e = [x for x in e if not (x[0] == 2 and x[1] == 5)]
                            if val != 0: e.insert(1, [2, 5, struct.pack('<f', val)])
                            r[2] = build(e); done.add(key)
                q[2] = build(m5)
            p[2] = build(m3)
        t[2] = build(part)
    return found, build(top), done


def png_spans(d):
    out = []
    for m in re.finditer(re.escape(SIG), d):
        i = m.start(); j = i + 8
        while True:
            l = struct.unpack('>I', d[j:j + 4])[0]; t = d[j + 4:j + 8]; j += 12 + l
            if t == b'IEND': break
        out.append((i, j))
    return out


def replace_span(buf, start, end, new):
    """Replace buf[start:end] (the whole value of some nested length-delimited field) by new, fixing every enclosing length."""
    items = parse(buf); i = 0
    for it in items:
        f, w, v = it
        k = len(wv((f << 3) | w))
        if w == 2:
            vs = i + k + len(wv(len(v))); ve = vs + len(v)
            if vs == start and ve == end: it[2] = new; return build(items)
            if vs <= start and end <= ve: it[2] = replace_span(v, start - vs, end - vs, new); return build(items)
            i = ve
        elif w == 0: i += k + len(wv(v))
        else: i += k + len(v)
    raise ValueError('span not found')


def write_out(z, dst, out):
    with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as o:
        for info in z.infolist():
            o.writestr(info, out if info.filename == 'v1model/data.bin' else z.read(info.filename))


def main():
    cmd, src = sys.argv[1], sys.argv[2]
    z = zipfile.ZipFile(src); data = z.read('v1model/data.bin')
    if cmd == 'png':
        import os
        os.makedirs(sys.argv[3], exist_ok=True)
        for n, (a, b) in enumerate(png_spans(data)): open(f'{sys.argv[3]}/{n:03d}.png', 'wb').write(data[a:b])
        print(len(png_spans(data)), 'textures'); return
    if cmd == 'tex':
        dst = sys.argv[3]; jobs = dict(a.split('=', 1) for a in sys.argv[4:])
        for n in sorted(jobs, key=int, reverse=True):          # from the back, so earlier offsets stay valid
            a, b = png_spans(data)[int(n)]
            data = replace_span(data, a, b, open(jobs[n], 'rb').read())
        write_out(z, dst, data); print(f'wrote {dst}: {len(jobs)} textures replaced'); return
    if cmd == 'list':
        found, _, _ = walk(data); last = None
        for part, name, w in found:
            if part != last: print(f'\n[{part}]'); last = part
            print(f'  {name} = {w:.3f}' if w else f'  {name}')
        return
    dst = sys.argv[3]; edit = dict(a.split('=', 1) for a in sys.argv[4:])
    found, out, done = walk(data, edit)
    missing = set(edit) - done
    if missing: print('NOT FOUND:', sorted(missing))
    write_out(z, dst, out)
    print(f'wrote {dst}: {len(done)} parameters set')


main()
