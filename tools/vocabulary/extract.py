"""Build learner-dictionary data for a word list from Wiktionary (kaikki.org) and Tatoeba.
Writes <list>.entries.json and <list>.candidates.txt (example sentence candidates to review by hand)."""
import json, re, sys, collections, os
from config import DATA_ROOT
D = DATA_ROOT
listf = sys.argv[1]
POSMAP = {'n': 'noun', 'n-pl': 'noun', 'v': 'verb', 'adj': 'adj', 'adv': 'adv', 'w': ('adv', 'pron'), 'intj': 'intj', 'num': 'num', 'prep': 'prep', 'conj': 'conj', 'pron': 'pron'}
words = []
for line in open(listf, encoding='utf-8'):
    if not line.strip() or line.startswith('#'): continue
    a, p, g = [x.strip() for x in line.split('|')]
    parts = a.split(' '); ar = parts[0] if len(parts) > 1 else ''; w = parts[-1]
    words.append({'w': w, 'ar': ar, 'ps': p, 'grp': g})

def clean(gl):
    gl = re.sub(r'\s*\([^)]*\)', '', gl).strip()
    return [x.strip() for x in re.split(r'[;,]', gl) if x.strip()]

def tags(f): return set(f.get('tags') or [])
entries = []
for x in words:
    recs = [json.loads(l) for l in open(f"{D}/wikt/{'lc_' if x['w'][0].islower() else ''}{x['w']}.jsonl", encoding='utf-8')]
    want = POSMAP[x['ps']]; want = want if isinstance(want, tuple) else (want,)
    recs = [r for r in recs if r.get('pos') in want and r.get('lang_code') == 'de'] or recs
    r = recs[0]
    en = []
    for s in r.get('senses', []):
        if any(t in (s.get('tags') or []) for t in ('archaic', 'obsolete', 'dialectal', 'rare', 'regional', 'form-of')): continue
        for gl in s.get('glosses', [])[:1]:
            for e in clean(gl):
                if e not in en and len(e) < 40: en.append(e)
    forms = r.get('forms', [])
    ff = lambda *t: next((f['form'] for f in forms if set(t) <= tags(f) and f['form'] not in ('no-table-tags', 'de-ndecl', 'de-conj')), '')
    e = dict(x); e['en'] = en[:6]
    snd = r.get('sounds', [])
    e['ipa'] = next((s['ipa'] for s in snd if s.get('ipa', '').startswith('/')), '')
    au = next((s for s in snd if s.get('mp3_url')), None)
    e['audio'] = au['mp3_url'] if au else ''; e['afile'] = au.get('audio', '') if au else ''
    allf = {x['w']}
    if x['ps'] == 'n':
        e['pl'] = ff('plural') if not ff('no-plural') else ''
        e['gen'] = ff('genitive', 'singular') or ff('genitive')
        allf |= {e['pl'], ff('dative', 'plural')}
    elif x['ps'] == 'v':
        P = [ff('first-person', 'singular', 'present', 'indicative'), ff('second-person', 'singular', 'present', 'indicative'),
             ff('third-person', 'singular', 'present', 'indicative'), ff('first-person', 'plural', 'present', 'indicative'),
             ff('second-person', 'plural', 'present', 'indicative'), ff('third-person', 'plural', 'present', 'indicative')]
        e['pres'] = P; e['prt'] = ff('third-person', 'singular', 'past', 'indicative') or ff('past')
        e['pp'] = ff('participle', 'past'); e['aux'] = ff('auxiliary') or 'haben'
        e['imp'] = [ff('imperative', 'singular'), ff('imperative', 'plural')]
        for f in forms:
            t = tags(f)
            if ('indicative' in t or 'participle' in t or 'imperative' in t) and 'subjunctive' not in t: allf.add(f['form'])
    elif x['ps'] == 'adj':
        e['comp'] = ff('comparative'); e['sup'] = ff('superlative')
        for f in forms:
            if 'strong' in tags(f) or 'weak' in tags(f) or 'mixed' in tags(f) or 'predicative' in tags(f): allf.add(f['form'])
    AUX = {'bin','bist','ist','sind','seid','war','waren','warst','wart','werde','werden','werdet','wird','wirst','habe','hast','hat','haben','habt','hatte','hatten','hattest','hattet','sei','seien','wäre','würde','hätte'}
    if x['w'] not in ('sein', 'haben', 'werden'): allf = {f for f in allf if f not in AUX}
    e['_forms'] = sorted(f for f in allf if f and ' ' not in f)
    # separable verbs: "lädt ... ein"
    e['_sep'] = ''
    if x['ps'] == 'v' and P[2] and ' ' in P[2]: e['_sep'] = P[2].split(' ')[-1]; e['_forms'] = sorted(({f.split(' ')[0] for f in allf if f} | {f for f in allf if f and ' ' not in f}) - AUX)
    entries.append(e)

# ---- Tatoeba: German sentences with an English translation
deu = {}
for l in open(f'{D}/raw/deu_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2); deu[i] = t
links = collections.defaultdict(list)
for l in open(f'{D}/raw/deu-eng_links.tsv', encoding='utf-8'):
    a, b = l.split(); links[a].append(b)
need = {b for a in links for b in links[a]}
eng = {}
for l in open(f'{D}/raw/eng_sentences.tsv', encoding='utf-8'):
    i, _, t = l.rstrip('\n').split('\t', 2)
    if i in need: eng[i] = t
tok = lambda s: re.findall(r"[A-Za-zÄÖÜäöüß]+", s)
freq = collections.Counter(w.lower() for t in deu.values() for w in tok(t))
rank = {w: k for k, (w, _) in enumerate(freq.most_common())}
pairs = [(i, t, [eng[b] for b in links[i] if b in eng]) for i, t in deu.items() if i in links]
pairs = [p for p in pairs if p[2]]
print('sentence pairs', len(pairs))
by_tok = collections.defaultdict(list)
for k, (i, t, en) in enumerate(pairs):
    for w in set(tok(t)): by_tok[w].append(k)

out = open(listf.replace('_words.txt', '.candidates.txt'), 'w', encoding='utf-8')
for e in entries:
    forms = set(e['_forms'])
    hits = set()
    for f in forms:
        hits |= set(by_tok.get(f, [])) | (set(by_tok.get(f.capitalize(), [])) if e['ps'] != 'n' else set())
    sc = []
    for k in hits:
        i, t, en = pairs[k]
        ws = tok(t)
        if not 3 <= len(ws) <= 10 or '"' in t or t.count(',') > 1: continue
        if e['_sep'] and e['_sep'] not in ws and 'einzuladen' not in t and not any(w.startswith('einge') for w in ws) and 'einladen' not in ws: continue
        others = [rank.get(w.lower(), 99999) for w in ws if w not in forms and w.lower() not in {f.lower() for f in forms}]
        hard = max(others) if others else 0
        sc.append((hard, len(ws), i, t, min(en, key=len)))
    sc.sort()
    out.write(f"\n### {e['ar']} {e['w']} ({e['ps']}) – {', '.join(e['en'])}\n")
    for hard, n, i, t, en in sc[:14]: out.write(f"{i}\t{hard}\t{t}\t|\t{en}\n")
json.dump(entries, open(listf.replace('_words.txt', '.entries.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('done', len(entries))
