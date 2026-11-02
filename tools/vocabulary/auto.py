"""Prepare a Wortschatz topic: Wiktionary data, automatic example picks (3 varied, simple sentences per word),
draft English translations, and a review sheet. Hand-made choices in <key>_picks.txt / <key>_curated.json are kept.
Usage: python3 auto.py a1_201"""
import json, re, sys, collections, os, subprocess
from config import RAW_DATA, SCRIPTS
key = sys.argv[1]; D = RAW_DATA
subprocess.run([sys.executable, str(SCRIPTS / 'fetch_wikt.py'), f'{key}_words.txt'], check=True)
subprocess.run([sys.executable, str(SCRIPTS / 'extract.py'), f'{key}_words.txt'], check=True, stdout=subprocess.DEVNULL)
E = json.load(open(f'{key}.entries.json', encoding='utf-8'))
deu = {}
for l in open(f'{D}/deu_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2); deu[i] = t
links = collections.defaultdict(list)
for l in open(f'{D}/deu-eng_links.tsv'):
    a, b = l.split(); links[a].append(b)
need = {b for v in links.values() for b in v}; eng = {}
for l in open(f'{D}/eng_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2)
    if i in need: eng[i] = t
tok = lambda s: re.findall(r"[A-Za-zÄÖÜäöüß]+", s)
freq = collections.Counter(w.lower() for t in deu.values() for w in tok(t))
rank = {w: k for k, (w, _) in enumerate(freq.most_common())}
NAMES = {'Tom', 'Maria', 'Mary', 'Toms', 'Marias', 'John', 'Boston', 'Ken', 'Mike', 'Jane', 'Bill', 'Jim', 'Emi', 'Taro', 'Tony', 'Jack', 'Bob', 'Lucy', 'Mayuko', 'Tatoeba', 'Sami', 'Layla', 'Dan', 'Linda', 'Fadil', 'Dania', 'Yanni', 'Rima', 'Skura', 'Ziri', 'Boldi', 'Mennad', 'Baya', 'Yidir', 'Nuja', 'Taninna', 'Muiriel'}
BAD = re.compile(r'tot\b|töten|Mord|Krieg|Waffe|\bBlut\b|Sex|Gott|Bier|betrunken|Drogen|Selbstmord|hass|scheiß|Arsch|Teufel', re.I)
P = [(i, t, [b for b in links[i] if b in eng]) for i, t in deu.items() if i in links]
P = [p for p in P if p[2]]
by = collections.defaultdict(list)
for k, (i, t, en) in enumerate(P):
    for w in set(tok(t)): by[w].append(k)
def best_en(ids):
    c = [eng[b] for b in ids if not NAMES & set(tok(eng[b])) and '(' not in eng[b]] or [eng[b] for b in ids]
    return min(c, key=lambda e: (abs(len(e.split()) - 6), len(e))), ids[[eng[b] for b in ids].index(min(c, key=lambda e: (abs(len(e.split()) - 6), len(e))))]
picks_f, cur_f = f'{key}_picks.txt', f'{key}_curated.json'
old = {}
if os.path.exists(picks_f):
    for l in open(picks_f, encoding='utf-8'):
        if ':' in l: w, r = l.split(':', 1); old[w.strip()] = r.split()
C = json.load(open(cur_f, encoding='utf-8')) if os.path.exists(cur_f) else {'en': {}, 'note': {}, 'eng': {}, 'fix': {}}
out, rep = [], []
for e in E:
    w = e['w']
    if w in old: out.append(f'{w}: ' + ' '.join(old[w])); continue
    forms = set(e['_forms']); low = {f.lower() for f in forms}; hits = set()
    for f in forms: hits |= set(by.get(f, [])) | (set(by.get(f.capitalize(), [])) if e['ps'] not in ('n', 'n-pl') else set())
    cand = []
    for k in hits:
        i, t, en = P[k]; ws = tok(t)
        if not 3 <= len(ws) <= 11 or NAMES & set(ws) or BAD.search(t) or '"' in t or '…' in t or '...' in t: continue
        if e['_sep'] and not (e['_sep'] in ws or any(x.lower().startswith(e['_sep'] + 'ge') or x.lower().startswith(e['_sep'] + 'zu') or x.lower() == w.lower() for x in ws)): continue
        if e['_sep'] and not any(x.lower() in low and x.lower() != e['_sep'] for x in ws): continue
        if e['ps'] in ('n', 'n-pl') and ws[0] in forms and len(ws) > 1 and ws[1].lower() in ('auf', 'doch', 'mal', 'bitte', 'du', 'ihr'): continue
        hard = max([rank.get(x.lower(), 99999) for x in ws if x.lower() not in low] or [0])
        if hard > 2200: continue
        base = 1 if w in ws or w.lower() in [x.lower() for x in ws] else 0
        lw = [x.lower() for x in ws]
        score = hard / 500 + abs(len(ws) - 6) * .3 - base * .6
        score += .8 * sum(x in ('nicht', 'kein', 'keine', 'keinen', 'nie', 'niemand', 'nichts') for x in lw)
        score += .5 * sum(x in ('werde', 'wird', 'werden', 'würde', 'hätte', 'wäre', 'könnte', 'sollte', 'müsste', 'wurde', 'wollte') for x in lw)
        score += 1 if t.startswith(('Ich weiß nicht', 'Ich will', 'Ich kann nicht', 'Was, wenn')) else 0
        score += .4 if ',' in t else 0
        cand.append((score, i, t, en, set(x.lower() for x in ws)))
    cand.sort(key=lambda c: c[0]); chosen = []
    for c in cand:
        if any(len(c[4] & d[4]) / len(c[4] | d[4]) > .45 or c[2].split()[:2] == d[2].split()[:2] for d in chosen): continue
        chosen.append(c)
        if len(chosen) == 3: break
    out.append(f'{w}: ' + ' '.join(c[1] for c in chosen))
    for c in chosen:
        e_txt, e_id = best_en(c[3]); C['eng'].setdefault(c[1], e_id)
    if w not in C['en']:
        en = [x for x in e['en'] if len(x) <= 24 and not re.search(r'\b(used|form|any|sense|especially)\b', x)][:3]
        C['en'][w] = en or e['en'][:1]
open(picks_f, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
json.dump(C, open(cur_f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
# review sheet
rv = []
pk = {l.split(':')[0]: l.split(':')[1].split() for l in out}
for e in E:
    w = e['w']; rv.append(f"\n## {e['ar']} {w} [{e['ps']}] en={C['en'].get(w)} pl={e.get('pl')} pres={e.get('pres')} pp={e.get('pp')} comp={e.get('comp')}")
    for i in pk[w]:
        en_id = C['eng'].get(i) or next(b for b in links[i] if b in eng)
        rv.append(f'   {i}\t{deu[i]}\t|\t{eng.get(en_id)}')
    if len(pk[w]) < 2: rv.append('   !! few examples')
open(f'{key}.review.txt', 'w', encoding='utf-8').write('\n'.join(rv))
print('words', len(E), 'review', f'{key}.review.txt')
