"""Static server for the demo that can also save pictures the page sends (for checking frames and making contact sheets).

    python3 tools/liv3d/demo/shot_server.py [port] [out_dir]     # serves the repository root; POST /save?name=x.png writes out_dir/x.png
"""
import sys, os, re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8795
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/liv3d-shots'
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
os.makedirs(OUT, exist_ok=True)


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def do_POST(self):
        u = urlparse(self.path)
        if u.path != '/save': self.send_error(404); return
        name = re.sub(r'[^A-Za-z0-9_.-]', '_', parse_qs(u.query).get('name', ['shot.png'])[0])
        n = int(self.headers.get('Content-Length', 0)); data = self.rfile.read(n)
        open(os.path.join(OUT, name), 'wb').write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass


ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
