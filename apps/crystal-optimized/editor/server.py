#!/usr/bin/env python3
"""
3D Model Placement Editor — Local Server
Serves the editor, saves GLB models & scene JSON, auto-commits to git.
Usage: python server.py [port]   (default: 9100)
"""
import http.server, json, os, subprocess, sys, shutil, base64, urllib.parse, mimetypes

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 9100
ROOT = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ROOT, "models")
SCENE_FILE = os.path.join(ROOT, "scene.json")

os.makedirs(MODELS_DIR, exist_ok=True)

def git(*args):
    repo = ROOT
    while repo != os.path.dirname(repo):
        if os.path.isdir(os.path.join(repo, ".git")):
            break
        repo = os.path.dirname(repo)
    try:
        r = subprocess.run(["git"] + list(args), cwd=repo,
                           capture_output=True, text=True, timeout=30)
        return r.returncode == 0, r.stdout + r.stderr
    except Exception as e:
        return False, str(e)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        if self.path == "/api/save-model":
            data = json.loads(body)
            name = os.path.basename(data["filename"])
            raw = base64.b64decode(data["data"])
            path = os.path.join(MODELS_DIR, name)
            with open(path, "wb") as f:
                f.write(raw)
            self._json({"ok": True, "path": f"models/{name}", "size": len(raw)})

        elif self.path == "/api/save-scene":
            scene = json.loads(body)
            with open(SCENE_FILE, "w") as f:
                json.dump(scene, f, indent=2)
            self._json({"ok": True})

        elif self.path == "/api/git-push":
            ok1, m1 = git("add", "-A", os.path.relpath(MODELS_DIR, ROOT), "scene.json")
            ok2, m2 = git("commit", "-m", "editor: update models and scene layout")
            ok3, m3 = git("push")
            self._json({
                "ok": ok3,
                "details": {"add": m1, "commit": m2, "push": m3}
            })

        elif self.path == "/api/list-models":
            files = []
            if os.path.isdir(MODELS_DIR):
                files = [f for f in os.listdir(MODELS_DIR)
                         if f.lower().endswith(('.glb', '.gltf'))]
            self._json({"models": files})

        elif self.path == "/api/load-scene":
            if os.path.exists(SCENE_FILE):
                with open(SCENE_FILE) as f:
                    self._json(json.load(f))
            else:
                self._json({"objects": []})

        elif self.path == "/api/delete-model":
            data = json.loads(body)
            name = os.path.basename(data["filename"])
            path = os.path.join(MODELS_DIR, name)
            if os.path.exists(path):
                os.remove(path)
            self._json({"ok": True})

        else:
            self.send_error(404)

    def _json(self, obj):
        data = json.dumps(obj).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(data))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            super().log_message(fmt, *args)

print(f"Editor server running at http://localhost:{PORT}")
print(f"Models dir: {MODELS_DIR}")
print(f"Scene file: {SCENE_FILE}")
http.server.HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
