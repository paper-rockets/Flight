# Project Handoff: KIKI FINAL 3

## Overview
This project is an advanced, WebGL/Three.js-based interactive flight and exploration experience. It features endless procedural terrain, dynamic lighting, real-time audio visualization, instanced rendering for massive amounts of environmental assets, and multiple interactive editors for real-time customization.

## Core Architecture & Stack
- **Engine**: Three.js (Vanilla JS + HTML)
- **Main Entry Point**: `index.html` (contains core game loop, UI logic, rendering setup)
- **Key Scripts**:
  - `TerrainEditor.js`: Handles drag-and-drop placement, snapping, and saving/loading of external GLB models.
  - `islandGenerator_v2.js` / `particleWhaleGenerator.js`: Procedural generation logic.
  - Background audio analyzers built into the main loop to drive terrain/cloud pulsing.

## Key Features & Systems
1. **Procedural Environment (Instanced Rendering)**:
   - Terrain is dynamically decorated using `THREE.InstancedMesh` for extremely high performance.
   - Handles thousands of instances: Rocks, Trees, Bushes, Flowers, Animals, Castles, Houses, Boats, High Clouds, and Low Clouds.
   - **Spawning Logic**: Instances dynamically reposition themselves ahead of the player as they fly (`updateInstances`), ensuring an endless world. Spawns are snapped to the outer perimeter to prevent visual "pop-in".

2. **Flight Mechanics & Player Controllers**:
   - Supports keyboard (WASD/Arrows + Shift for boost, Space for brake) and touch joysticks.
   - Allows switching between character models (e.g., Kiki on a broom, Princess).
   - Features procedural wind trails (`instTrails`) during boosting.

3. **Custom Shader Ecosystem**:
   - **Flying Crystals**: Uses `onBeforeCompile` to inject a dynamic, 6-color vertical gradient (`uCustomColors`) with adjustable Hue, Contrast, Base Glow, and Night Glow.
   - **Terrain / Audio Reactivity**: The terrain shader pulses to the beat of uploaded music via `analyser.getAverageFrequency()`.
   - **Lighting / Time of Day**: Real-time transition between Day, Dusk, and Twilight, affecting ambient light, directional shadows, and fog density.

4. **In-Game Editors**:
   - **Crystal & Env Editor**: A custom UI allowing the user to tweak the exact colors, opacity, and shaders of the Flying Crystals, as well as the instance colors of the Ground Rocks. State is automatically saved to `localStorage`.
   - **Terrain Editor**: Allows uploading `.glb` files, placing them manually into the world, and exporting the layout to a JSON file (`Save JSON`).

## Recent Fixes & Modifications
- **Crystal Editor Overhaul**: Disconnected the ground crystal color pickers from the flying crystal shaders. Added 6 dedicated color pickers for the Flying Crystals that feed directly into a custom GLSL vertical gradient shader, preserving the "neon sunset" look.
- **LocalStorage Persistence**: The Crystal Editor now perfectly preserves all sliders and colors across page refreshes.
- **Pop-in Prevention**: Refactored the `updateInstances` logic to ensure large objects (like High Clouds and Flying Crystals) spawn strictly at the *horizon boundary* (`dist * 0.95`), eliminating giant objects abruptly popping into the camera's view.

## Known Issues / Next Steps
- **Performance Tuning**: As more instanced meshes are added, draw calls are low but vertex counts are high. Keep an eye on Polycount, especially for uploaded GLBs in the Terrain Editor.
- **Collision Detection**: Currently, the player glides over the terrain heightmap (`getMeshHeight`), but does not have rigid body collisions with instanced objects (trees, castles).
- **Editor Expansions**: The Terrain Editor currently exports to JSON, but the loading of that JSON back into the environment (persisting user-built towns) may require further fleshing out in `index.html`.

## File Map
- `index.html`: The monolithic engine file.
- `TerrainEditor.js`: External model placement UI.
- `models/`: GLB assets (Kiki, Princess, etc.).
- `assets/`: Soundtracks and images.
- `package.json` / `vite.config.ts`: Used if running via Vite, though it functions as a static site.
