"""Assemble a Wortschatz topic: entries (Wiktionary) + curated translations/notes + hand-picked Tatoeba examples.
Usage: python3 build_topic.py a1_202  -> writes the data into the chapter template and the site file."""
import json, sys, collections, re
from config import RAW_DATA, write_chapter
D = RAW_DATA
key = sys.argv[1]; num = key.split('_')[1]
E = json.load(open(f'{key}.entries.json', encoding='utf-8'))
C = json.load(open(f'{key}_curated.json', encoding='utf-8'))
picks = {}
for l in open(f'{key}_picks.txt', encoding='utf-8'):
    w, r = l.split(':'); picks[w.strip()] = r.split()
ids = {i for v in picks.values() for i in v}
deu = {}
for l in open(f'{D}/deu_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2)
    if i in ids: deu[i] = t
links = collections.defaultdict(list)
for l in open(f'{D}/deu-eng_links.tsv'):
    a, b = l.split()
    if a in ids: links[a].append(b)
need = {b for v in links.values() for b in v}; eng = {}
for l in open(f'{D}/eng_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2)
    if i in need: eng[i] = t
out = []
for e in E:
    w = e['w']; x = {'w': w, 'ar': e['ar'], 'ps': e['ps'], 'g': e['grp'], 'en': C['en'][w]}
    if e['ps'] == 'n': x['pl'] = e.get('pl') or ''
    if e['ps'] == 'n-pl': x['ps'] = 'n'; x['pf'] = 1
    if e['ps'] == 'v':
        for k in ('pres', 'prt', 'pp', 'aux'): x[k] = e[k]
    if e['ps'] == 'adj' and e.get('comp'): x['comp'] = e['comp']; x['sup'] = e['sup']
    x.update(C['fix'].get(w, {}))
    x = {k: v for k, v in x.items() if v not in ('', None)}
    if e.get('ipa'): x['ipa'] = e['ipa']
    if e.get('audio'): x['au'] = e['audio']; x['af'] = e['afile']
    if w in C['note']: x['note'] = C['note'][w]
    ex = []
    for i in picks[w]:
        cands = [b for b in links[i] if b in eng]
        NM = {'Tom', 'Mary', 'Maria', 'John', 'Ken', 'Jack', 'Lucy', 'Mike', 'Boston'}
        en_id = C['eng'].get(i) if C['eng'].get(i) in eng else min(cands, key=lambda b: (bool(NM & set(eng[b].replace('.', ' ').split())), '(' in eng[b], abs(len(eng[b].split()) - 6), len(eng[b])))
        assert en_id in eng, (w, i, en_id)
        ex.append([deu[i], eng[en_id], int(i), int(en_id)])
    x['ex'] = ex
    out.append(x)
data = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
tpl = open(f'k{num}.tpl.js', encoding='utf-8').read()
assert tpl.count('/*DATA*/[]') == 1, 'Template must contain one data marker'
write_chapter(int(num), tpl.replace('/*DATA*/[]', data))
print('words', len(out), 'examples', sum(len(x['ex']) for x in out), 'data KB', round(len(data.encode()) / 1024, 1))
