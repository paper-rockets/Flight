# Flight: Crystal - Project Handoff

## Overview
This is a handoff document for the current state of the Flight game (specifically the "Crystal" or "Kiki Final 3" branch). The project is a web-based, standalone 3D flying exploration game built entirely in Vanilla JS using Three.js and no build tools.

## Architecture
- **Single Monolith Architecture**: The game fundamentally runs from `index.html`. It dynamically loads Three.js via CDNs and directly manipulates the DOM.
- **Dependencies**: Three.js (r128), OrbitControls, GLTFLoader, Lensflare, and various compressed texture loaders (KTX2, Meshopt).
- **Core Systems**:
  - **Procedural Terrain**: A 4000x4000 `PlaneGeometry` terrain that alters its heights based on simplex noise.
  - **Shaders**: Extensive use of `onBeforeCompile` to inject custom shader logic into `MeshStandardMaterial` for water caustics, depth fading, and sparkling.
  - **Time of Day Engine**: A 3-phase state machine (Dusk, Twilight, Day) that smoothly lerps lighting, fog, ambient, and sun position (via `staticSun`) using `dt` in the render loop.
  - **Instancing**: Utilizes `InstancedMesh` heavily for trees, rocks, crystals, and flowers to maintain high FPS.

## Recent Features Implemented
- **UI Restructuring**:
  - The UI has been heavily reorganized to group complex options into neat submenus (Music, Editor).
  - The "Time of Day" button dynamically updates with the current lighting state.
  - Fullscreen and FPS counters remain persistently visible even when the rest of the UI is hidden.
- **Mobile Optimizations**:
  - PC control hints are dynamically suppressed on mobile devices.
  - The Joystick and Boost/Brake buttons remain visible when the main UI is hidden.
  - Changing the Quality setting to Low/Med automatically toggles shadows off to save battery and boost performance.
- **Fog and Lighting**:
  - Distance fog has been strictly clamped between `1500` and `2000` units to perfectly align with the absolute edge of the procedural terrain, fixing issues where the terrain sharply ended before fading into the sky.
  - Sun tracking was re-enabled! The physical sun mesh was brought securely inside the camera frustum (`2800` distance) and mathematically constrained to stay in front of the player and shift correctly as the time of day cycles.
- **Defaults**:
  - The `Princess.glb` character model is now loaded and selected by default on startup.

## Next Steps / Outstanding Tasks
- **Localized Rain**: The implementation of localized rain clouds was shelved/paused by request. The logic can be picked back up by adding a new instanced particle system attached to the clouds or player.
- **General Expansion**: The `Crystals` subdirectory and logic inside `TerrainEditor.js` is set up for further environmental editing.

## Known Quirks
- The game uses a `logarithmicDepthBuffer`, which has caused occasional headaches with standard Three.js fog. Keep this in mind when implementing custom shaders (ensure `#include <logdepthbuf_fragment>` is present).
- `staticSun` is technically not static; it dynamically calculates an offset from `playerGrp.position` in the render loop so it doesn't drift away when exploring the terrain boundaries.
