import collections, sys
from config import RAW_DATA
D = RAW_DATA
ids={}
for l in open(sys.argv[1],encoding='utf-8'):
    w,r=l.split(':'); ids.update({i:w for i in r.split()})
deu={}
for l in open(f'{D}/deu_sentences.tsv',encoding='utf-8'):
    i,_,t=l.rstrip('\n').split('\t',2)
    if i in ids: deu[i]=t
links=collections.defaultdict(list)
for l in open(f'{D}/deu-eng_links.tsv'):
    a,b=l.split()
    if a in ids: links[a].append(b)
need={b for v in links.values() for b in v}; eng={}
for l in open(f'{D}/eng_sentences.tsv',encoding='utf-8'):
    i,_,t=l.rstrip('\n').split('\t',2)
    if i in need: eng[i]=t
for i,w in ids.items():
    print(w,'|',i,'|',deu.get(i,'MISSING'),'|',' ## '.join(f'{b}:{eng[b]}' for b in links[i] if b in eng))
