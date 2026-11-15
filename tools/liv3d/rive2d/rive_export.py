# rive_export.py OUT.riv [ARTBOARD] : export the open Rive file for runtime (inline, since the editor is sandboxed).
# The editor exports the active artboard only, so ARTBOARD (a name) is made active first.
import json, base64, sys, urllib.request, re
URL = 'http://127.0.0.1:9791/mcp'; SID = None
def rpc(m, p):
    global SID
    r = urllib.request.Request(URL, data=json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': m, 'params': p}).encode(), headers={'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', **({'mcp-session-id': SID} if SID else {})})
    with urllib.request.urlopen(r, timeout=600) as x:
        SID = SID or x.headers.get('mcp-session-id'); b = x.read().decode()
    if b.startswith('event:') or b.startswith('data:'): b = [l[5:] for l in b.splitlines() if l.startswith('data:')][-1]
    return json.loads(b)
rpc('initialize', {'protocolVersion': '2025-11-25', 'capabilities': {}, 'clientInfo': {'name': 'x', 'version': '1'}})
if len(sys.argv) > 2:
    r = rpc('tools/call', {'name': 'open_file_editor', 'arguments': {'command': 'focusArtboard', 'data': {'focusArtboard': {'artboardName': sys.argv[2]}}}})['result']
    if r.get('isError') or '"success":false' in json.dumps(r).replace(' ', ''): raise SystemExit('focus failed: ' + json.dumps(r)[:400])
import time
for attempt in range(3):                      # the editor sometimes answers an export without the file: try again
    res = rpc('tools/call', {'name': 'export_file', 'arguments': {'format': 'riv', 'destination': '/', 'inline_base64': True}})['result']
    blob = next((c['resource'].get('blob') for c in res['content'] if c.get('type') == 'resource'), None)
    t = max((c.get('text', '') for c in res['content']), key=len, default='')
    if blob is None:
        try: blob = json.loads(t).get('data')
        except ValueError: m = re.search(r'[A-Za-z0-9+/]{1000,}={0,2}', t); blob = m.group(0) if m else None
    if blob: break
    print('export gave no file:', t[:300], file=sys.stderr); time.sleep(5)
else:
    raise SystemExit('export failed three times')
data = base64.b64decode(blob)
if data[:4] != b'RIVE': raise SystemExit('export is not a .riv file')
open(sys.argv[1], 'wb').write(data); print('wrote', len(data), data[:4])
