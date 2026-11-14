"""Serves the repo for ref.html and saves the PNGs its batch mode POSTs (to park/preview/).

    python3 tools/liv/rive/park/ref_server.py          # then open http://localhost:8794/tools/liv/rive/park/ref.html?batch=1
"""
import http.server, os, sys, urllib.parse
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[4]); OUT = str(Path(__file__).resolve().parent / 'preview')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def do_POST(s):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(s.path).query); name = os.path.basename(q['name'][0])
        n = int(s.headers['Content-Length']); open(os.path.join(OUT, name), 'wb').write(s.rfile.read(n))
        s.send_response(200); s.send_header('Access-Control-Allow-Origin', '*'); s.end_headers(); s.wfile.write(b'ok')
    def log_message(s, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8794), H).serve_forever()
