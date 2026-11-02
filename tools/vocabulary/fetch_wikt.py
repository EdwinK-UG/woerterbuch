"""Fetch each word's Wiktionary data (via kaikki.org, CC BY-SA) into vokabel-daten/wikt/<word>.jsonl."""
import sys, os, time, urllib.parse, urllib.request
from config import WIKTIONARY
out = WIKTIONARY; os.makedirs(out, exist_ok=True)
for line in open(sys.argv[1], encoding='utf-8'):
    if not line.strip() or line.startswith('#'): continue
    w = line.split('|')[0].strip().split(' ')[-1]
    f = os.path.join(out, ('lc_' if w[0].islower() else '') + w + '.jsonl')
    if os.path.exists(f): continue
    p = w[0] + '/' + w[:2]
    url = 'https://kaikki.org/dictionary/German/meaning/' + urllib.parse.quote(p) + '/' + urllib.parse.quote(w) + '.jsonl'
    try:
        data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'woerterbuch-vokabel/1.0'}), timeout=30).read()
        open(f, 'wb').write(data); print('ok', w, len(data))
    except Exception as e: print('FAIL', w, e)
    time.sleep(0.4)
