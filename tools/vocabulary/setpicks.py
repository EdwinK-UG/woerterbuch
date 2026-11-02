"""Change hand picks / curated data of a topic. Usage: python3 setpicks.py a2_221 spec.json
spec: {"picks": {word: "id id id"}, "en": {word: [..]}, "note": {word: text}, "fix": {word: {...}}, "refl": [words]}"""
import json, sys
key, spec = sys.argv[1], json.load(open(sys.argv[2], encoding='utf-8'))
pf = f'{key}_picks.txt'; L = open(pf, encoding='utf-8').read().splitlines()
P = {l.split(':')[0].strip(): l for l in L if ':' in l}
for w, ids in spec.get('picks', {}).items():
    assert w in P, w; P[w] = f'{w}: {ids}'
open(pf, 'w', encoding='utf-8').write('\n'.join(P[l.split(':')[0].strip()] for l in L if ':' in l) + '\n')
cf = f'{key}_curated.json'; C = json.load(open(cf, encoding='utf-8'))
for k in ('en', 'note'): C.setdefault(k, {}).update(spec.get(k, {}))
for w, f in spec.get('fix', {}).items(): C.setdefault('fix', {}).setdefault(w, {}).update(f)
for w in spec.get('refl', []): C.setdefault('fix', {}).setdefault(w, {})['refl'] = 1
json.dump(C, open(cf, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', key)
