import re, sys, collections
from config import RAW_DATA
D = RAW_DATA
pats=[re.compile(p) for p in sys.argv[1:]]
deu={}
for l in open(f'{D}/deu_sentences.tsv',encoding='utf-8'):
    i,_,t=l.rstrip('\n').split('\t',2)
    if any(p.search(t) for p in pats): deu[i]=t
links=collections.defaultdict(list)
for l in open(f'{D}/deu-eng_links.tsv'):
    a,b=l.split()
    if a in deu: links[a].append(b)
need={b for v in links.values() for b in v}; eng={}
for l in open(f'{D}/eng_sentences.tsv',encoding='utf-8'):
    i,_,t=l.rstrip('\n').split('\t',2)
    if i in need: eng[i]=t
for p in pats:
    print('##',p.pattern)
    rows=[(len(t),i,t) for i,t in deu.items() if p.search(t) and links[i] and not re.search(r'\b(Tom|Maria|Mary|Toms)\b',t)]
    for n,i,t in sorted(rows)[:12]: print(i,'\t',t,'\t|\t',' / '.join(eng[b] for b in links[i] if b in eng)[:150])
