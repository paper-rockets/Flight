# 3D Model Placement Editor

A standalone, reusable 3D model placement tool. Drop GLB files, position them with transform gizmos, save the layout, and push to git — all from the browser.

## Quick Start

```bash
cd editor
python server.py
```

Opens at **http://localhost:9100**. Pass a custom port: `python server.py 9200`

## How It Works

1. **Import models** — drag & drop `.glb`/`.gltf` files onto the viewport, or click "+ Add Model"
2. **Transform** — click a model to select it, then use the gizmo handles to move/rotate/scale
3. **Save** — hit "Save Scene" (or `Ctrl+S`) to write `scene.json` with all transforms
4. **Git Push** — hit "Git Push" to auto-commit models + scene.json and push to remote

## File Structure

```
editor/
├── index.html      ← the editor UI (single file, Three.js via CDN)
├── server.py       ← Python server (file saves + git integration)
├── scene.json      ← auto-generated scene layout (positions, rotations, scales)
├── models/         ← GLB files saved here when you drop them in
│   ├── castle.glb
│   └── tree.glb
└── HANDOFF.md      ← this file
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `G` | Move mode |
| `R` | Rotate mode |
| `S` | Scale mode |
| `Q` | Toggle Local/World space |
| `X` | Toggle snap (1 unit / 15° / 0.25 scale) |
| `D` | Duplicate selected |
| `Del` | Delete selected |
| `F` | Focus camera on selected |
| `Ctrl+S` | Save scene |
| `Ctrl+Z` | Undo |
| `H` | Toggle help panel |
| `Esc` | Deselect |

## Mouse Controls

- **Left click** — select object
- **Right drag** — orbit camera
- **Middle drag** — pan camera
- **Scroll** — zoom

## API Endpoints (server.py)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/save-model` | POST | Save a GLB file to `models/` (base64 body) |
| `/api/save-scene` | POST | Write `scene.json` |
| `/api/load-scene` | POST | Read `scene.json` |
| `/api/list-models` | POST | List files in `models/` |
| `/api/delete-model` | POST | Remove a model file |
| `/api/git-push` | POST | `git add` + `commit` + `push` |

## scene.json Format

```json
{
  "objects": [
    {
      "id": "uuid",
      "name": "castle",
      "filename": "castle.glb",
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 1.57, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 }
    }
  ]
}
```

Rotation values are in **radians**. The editor panel shows degrees.

## Reusing in Other Projects

Copy the entire `editor/` folder into any project. It's self-contained — no npm install, no build step. Just run `python server.py` from inside the folder. The server auto-detects the nearest parent `.git` repo for push operations.

## Architecture Notes for AI Editors

- **Single HTML file** — all editor logic is in `index.html` using ES module imports from CDN (Three.js r170)
- **No build step** — works with just a Python HTTP server
- **Transform controls** — Three.js `TransformControls` for gizmos, `OrbitControls` for camera
- **State** — `placedObjects` array holds all placed models with their Three.js objects and metadata
- **Undo** — snapshot-based (stores serialized transforms, max 50 deep)
- **Persistence** — `scene.json` stores transforms + filenames; GLB files live in `models/`; server handles file I/O
- **Git integration** — server runs `git add/commit/push` from the nearest parent git repo
