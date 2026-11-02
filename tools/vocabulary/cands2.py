import json, re, collections, sys
from config import DATA_ROOT
D = DATA_ROOT
E=json.load(open(sys.argv[1],encoding='utf-8'))
deu={};[deu.__setitem__(*l.rstrip('\n').split('\t')[::2]) for l in open(f'{D}/raw/deu_sentences.tsv',encoding='utf-8')]
links=collections.defaultdict(list)
for l in open(f'{D}/raw/deu-eng_links.tsv'): a,b=l.split(); links[a].append(b)
need={b for v in links.values() for b in v}; eng={}
for l in open(f'{D}/raw/eng_sentences.tsv',encoding='utf-8'):
    i,_,t=l.rstrip('\n').split('\t',2)
    if i in need: eng[i]=t
tok=lambda s: re.findall(r"[A-Za-zÄÖÜäöüß]+",s)
freq=collections.Counter(w.lower() for t in deu.values() for w in tok(t)); rank={w:k for k,(w,_) in enumerate(freq.most_common())}
NAMES={'Tom','Maria','Mary','Toms','Marias','John','Boston','Ken','Mike','Jane','Bill','Jim','Emi','Taro','Tony'}
by=collections.defaultdict(list)
P=[(i,t,[eng[b] for b in links[i] if b in eng]) for i,t in deu.items() if i in links]
P=[p for p in P if p[2]]
for k,(i,t,en) in enumerate(P):
    for w in set(tok(t)): by[w].append(k)
for e in E:
    forms=set(e['_forms']); low={f.lower() for f in forms}; hits=set()
    for f in forms: hits|=set(by.get(f,[]))|(set(by.get(f.capitalize(),[])) if e['ps']!='n' else set())
    sc=[]
    for k in hits:
        i,t,en=P[k]; ws=tok(t)
        if not 5<=len(ws)<=10 or NAMES&set(ws) or any(n in ' '.join(en) for n in NAMES): continue
        if e['_sep'] and not (e['_sep'] in ws or any(w.startswith('einge') or w.startswith('einzu') for w in ws) or 'einladen' in ws): continue
        hard=max([rank.get(w.lower(),99999) for w in ws if w.lower() not in low] or [0])
        if hard>2500: continue
        sc.append((hard,i,t,min(en,key=len)))
    sc.sort(); print(f"\n### {e['ar']} {e['w']}")
    for h,i,t,en in sc[:22]: print(f"{i}\t{t}\t|\t{en}")
