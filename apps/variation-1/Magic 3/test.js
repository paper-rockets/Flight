
    import * as THREE from 'three';
    import { createParticleWhale } from './particleWhaleGenerator.js';
    import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
    import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
    import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
    import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
    import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
    import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';


    let isWindOn = false;
    let isWindTrailsOn = true;
    let isPhotoMode = false;
    let isFlightPaused = false;
    let photoControls = null;
    let cameraZoomDist = 12.0;
    let currentFrame = 0;
    let logicTimer = 0;

    document.getElementById('fullscreen-toggle').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
    

    
    document.getElementById('pause-toggle').addEventListener('click', () => {
        isFlightPaused = !isFlightPaused;
        document.getElementById('pause-toggle').innerText = isFlightPaused ? 'Resume Flight' : 'Pause Flight';
    });

    document.getElementById('wind-toggle').addEventListener('click', () => {
        isWindOn = !isWindOn;
        document.getElementById('wind-toggle').innerText = `Wind: ${isWindOn ? 'ON' : 'OFF'}`;
    });

    const clickRaycaster = new THREE.Raycaster();
    const clickMouse = new THREE.Vector2();



    document.getElementById('trails-toggle').addEventListener('click', () => {
        isWindTrailsOn = !isWindTrailsOn;
        document.getElementById('trails-toggle').innerText = `Wind Trails: ${isWindTrailsOn ? 'ON' : 'OFF'}`;
    });
    
    document.getElementById('photo-toggle').addEventListener('click', () => {
        isPhotoMode = true;
        document.getElementById('settings-controls').style.display = 'none';
        document.getElementById('touch-controls').style.display = 'none';
        document.getElementById('time-toggle').style.display = 'none';
        document.getElementById('audio-controls').style.display = 'none';
        document.getElementById('photo-mode-ui').style.display = 'flex';
        
        if (!photoControls) {
            photoControls = new OrbitControls(camera, renderer.domElement);
        }
        photoControls.enabled = true;
        // set target to player position
        photoControls.target.copy(playerGrp.position);
        photoControls.update();
    });

    document.getElementById('zoom-toggle').addEventListener('click', () => {
        if (cameraZoomDist < 30.0) {
            cameraZoomDist = 45.0;
            document.getElementById('zoom-toggle').innerText = 'Zoom In';
        } else {
            cameraZoomDist = 12.0;
            document.getElementById('zoom-toggle').innerText = 'Zoom Out';
        }
    });

    window.addEventListener('wheel', (e) => {
        cameraZoomDist += Math.sign(e.deltaY) * 4.0;
        cameraZoomDist = Math.max(5.0, Math.min(100.0, cameraZoomDist)); // clamp between 5 and 100 units
        
        // Auto-update button text if using wheel
        if (cameraZoomDist > 25.0) document.getElementById('zoom-toggle').innerText = 'Zoom In';
        else document.getElementById('zoom-toggle').innerText = 'Zoom Out';
    }, { passive: true });
    
    document.getElementById('photo-exit').addEventListener('click', () => {
        isPhotoMode = false;
        document.getElementById('settings-controls').style.display = 'flex';
        document.getElementById('touch-controls').style.display = '';
        document.getElementById('time-toggle').style.display = 'block';
        document.getElementById('audio-controls').style.display = 'flex';
        document.getElementById('photo-mode-ui').style.display = 'none';
        camera.fov = 60;
        camera.position.set(0, 4, 14);
        camera.up.set(0, 1, 0);
        camera.rotation.set(0, 0, 0);
        camera.updateProjectionMatrix();
        if (photoControls) {
            photoControls.enabled = false;
        }
    });
    
    document.getElementById('photo-capture').addEventListener('click', () => {
        document.getElementById('photo-mode-ui').style.display = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                composer.render();
                const dataURL = renderer.domElement.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'GhibliFlight_Screenshot.png';
                link.href = dataURL;
                link.click();
                document.getElementById('photo-mode-ui').style.display = 'flex';
            });
        });
    });

    // ==========================================
    // 1. CORE SETUP & TOON RENDERER
    // ==========================================
    const container = document.getElementById('app');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8cbce6);
    scene.fog = new THREE.Fog(0x8cbce6, 100, 1800); // Fog hides terrain edges (terrain is ±2000)



    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 2.0, 3000);
    camera.position.set(0, 9, 26);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.15, 0.6, 0.9);
    composer.addPass(bloomPass); // Disabled bloom

    // ==========================================
    // 2. LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    loadAssets();

    const dirLight = new THREE.DirectionalLight(0xfffaeb, 1.4); // warm bright sunlight
    dirLight.position.set(150, 200, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    dirLight.shadow.camera.top = 120;
    dirLight.shadow.camera.bottom = -120;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.002;
    scene.add(dirLight);

    // Sun Glare (Lensflare)
    const flareTextureLoader = new THREE.TextureLoader();
    const textureFlare0 = flareTextureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png');
    const textureFlare3 = flareTextureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare3.png');
    
    const staticSun = new THREE.Group();
    staticSun.position.set(0, 1500, -20000); // Massive distance so Kiki can fly towards it
    scene.add(staticSun);

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 1600, 0, dirLight.color)); // Massive permanent horizon glare
    lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
    lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 1.0));
    staticSun.add(lensflare);

    // Physical Sun Sphere
    const sunGeo = new THREE.SphereGeometry(600, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }); // fog: false makes it glow through atmosphere
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    staticSun.add(sunMesh);

    // ==========================================
    // 3. TOON MATERIALS
    // ==========================================
    const gradientColors = new Uint8Array([
        160, 160, 160, 255, // Shadows
        255, 255, 255, 255  // Light
    ]);
    const gradientMap = new THREE.DataTexture(gradientColors, 2, 1, THREE.RGBAFormat);
    gradientMap.needsUpdate = true;
    gradientMap.minFilter = THREE.NearestFilter;
    gradientMap.magFilter = THREE.NearestFilter;
    gradientMap.generateMipmaps = false;

    const matRock = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap, dithering: true });
    const matBush = new THREE.MeshToonMaterial({ color: 0x48a868, gradientMap, dithering: true });
    const matAnimal = new THREE.MeshToonMaterial({ color: 0xf4d03f, gradientMap, dithering: true });
    const matCloud = new THREE.MeshToonMaterial({ color: 0xfffaec, gradientMap, dithering: true });
    const matFlower = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap, dithering: true }); 
    const terrainMat = new THREE.MeshToonMaterial({ 
        vertexColors: true, 
        gradientMap,
        dithering: true
    });
    
    // Shader injection for perfect pixel-smooth shorelines
    terrainMat.onBeforeCompile = (shader) => {
        shader.vertexShader = `
            varying vec3 vWorldPos;
        ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            `#include <worldpos_vertex>`,
            `#include <worldpos_vertex>
             vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
        );
    };

    
    const matTree = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, dithering: true });
    const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
    const treeMaterials = [matTree, matGlow];




    // ==========================================
    // 4. PROCEDURAL NOISE
    // ==========================================
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = Math.floor(Math.random() * 255);
    
    function snoise(x, z) {
        let n0, n1, n2;
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        let s = (x + z) * F2;
        let i = Math.floor(x + s), j = Math.floor(z + s);
        let t = (i + j) * G2;
        let X0 = i - t, Z0 = j - t;
        let x0 = x - X0, z0 = z - Z0;
        let i1, j1;
        if (x0 > z0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        let x1 = x0 - i1 + G2, z1 = z0 - j1 + G2;
        let x2 = x0 - 1.0 + 2.0 * G2, z2 = z0 - 1.0 + 2.0 * G2;
        let ii = i & 255, jj = j & 255;
        let gi0 = perm[ii + perm[jj]] % 12;
        let gi1 = perm[ii + i1 + perm[jj + j1]] % 12;
        let gi2 = perm[ii + 1 + perm[jj + 1]] % 12;
        let t0 = 0.5 - x0 * x0 - z0 * z0; if (t0 < 0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * (x0 * (gi0 > 5 ? 1 : -1) + z0 * (gi0 % 2 === 0 ? 1 : -1)); }
        let t1 = 0.5 - x1 * x1 - z1 * z1; if (t1 < 0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * (x1 * (gi1 > 5 ? 1 : -1) + z1 * (gi1 % 2 === 0 ? 1 : -1)); }
        let t2 = 0.5 - x2 * x2 - z2 * z2; if (t2 < 0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * (x2 * (gi2 > 5 ? 1 : -1) + z2 * (gi2 % 2 === 0 ? 1 : -1)); }
        return 70.0 * (n0 + n1 + n2);
    }

    function terrainHeightJS(x, z) {
        let y = snoise(x * 0.002, z * 0.002) * 5.0 + 3.0; 
        y += snoise(x * 0.01, z * 0.01) * 3.0; 
        y += Math.abs(snoise(x * 0.05, z * 0.05)) * 1.5;
        let hillNoise = snoise(x * 0.001, z * 0.001);
        if (hillNoise > 0.5) {
            y += (hillNoise - 0.5) * 20.0;
        }
        return y;
    }

    // ==========================================
    // 5. TERRAIN MESH WITH VERTEX COLORS
    // ==========================================
    const terrainGeo = new THREE.PlaneGeometry(4000, 4000, 256, 256); 
    terrainGeo.rotateX(-Math.PI / 2);
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    let lastTerrainGridX = -9999;
    let lastTerrainGridZ = -9999;

    const colorDeepWater = new THREE.Color(0x2d0a42);
    const colorShallowWater = new THREE.Color(0xff66b2); // Matches the waterMesh exactly
    const colorSand = new THREE.Color(0xd8bfd8);
    const colorIslandGrass = new THREE.Color(0x008080);
    const colorHigh = new THREE.Color(0x00ffff); // Grass High
    const colorIslandRock = new THREE.Color(0x2a2a4a);
    const colorDirt = new THREE.Color(0x501b45); 
    const colorPath = new THREE.Color(0x733d6b); // dirt path color
    const tempColor = new THREE.Color();

    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    function distToSegment(px, pz, ax, az, bx, bz) {
        const l2 = (ax - bx)**2 + (az - bz)**2;
        if (l2 === 0) return Math.hypot(px - ax, pz - az);
        let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az)));
    }

    function getPathStrength(x, z) {
        const scale = 0.002;
        const n1 = snoise(x * scale, z * scale);
        const n2 = snoise(x * scale * 2 + 1000, z * scale * 2 + 1000) * 0.3;
        let path = Math.abs(n1 + n2);
        let mask = smoothstep(0.15, 0.0, path); // wider, softer path
        return mask;
    }


    function getMeshHeight(x, z) {
        const vertexSpacing = 4000 / 256;
        const gridX = Math.floor(x / vertexSpacing) * vertexSpacing;
        const gridZ = Math.floor(z / vertexSpacing) * vertexSpacing;
        
        const h00 = terrainHeightJS(gridX, gridZ);
        const h10 = terrainHeightJS(gridX + vertexSpacing, gridZ);
        const h01 = terrainHeightJS(gridX, gridZ + vertexSpacing);
        const h11 = terrainHeightJS(gridX + vertexSpacing, gridZ + vertexSpacing);
        
        const tx = (x - gridX) / vertexSpacing;
        const tz = (z - gridZ) / vertexSpacing;
        
        const h0 = h00 * (1 - tx) + h10 * tx;
        const h1 = h01 * (1 - tx) + h11 * tx;
        return h0 * (1 - tz) + h1 * tz;
    }
    function updateTerrainGeometry(playerX, playerZ) {
        const vertexSpacing = 4000 / 256; // 15.625
        const gridX = Math.floor(playerX / vertexSpacing) * vertexSpacing;
        const gridZ = Math.floor(playerZ / vertexSpacing) * vertexSpacing;
        
        if (gridX === lastTerrainGridX && gridZ === lastTerrainGridZ) return;
        
        terrain.position.set(gridX, 0, gridZ);
        
        const pos = terrainGeo.attributes.position;
        if (!terrainGeo.attributes.color) {
            terrainGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
        }
        const colors = terrainGeo.attributes.color;

        for (let i = 0; i < pos.count; i++) {
            const worldX = pos.getX(i) + gridX;
            const worldZ = pos.getZ(i) + gridZ;
            const h = terrainHeightJS(worldX, worldZ);
            pos.setY(i, h);

            let blend = Math.min(Math.max(h / 35.0, 0), 1);
            const patchNoise = (Math.sin(worldX * 0.1) + Math.cos(worldZ * 0.1)) * 0.15;
            blend = Math.min(Math.max(blend + patchNoise, 0), 1);

            if (h < 1.0) {
                tempColor.copy(colorDeepWater);
            } else if (h < 2.5) {
                tempColor.lerpColors(colorDeepWater, colorShallowWater, smoothstep(1.0, 2.5, h));
            } else if (h < 4.0) {
                // At exactly h=2.5, it is pure colorShallowWater (matches waterMesh).
                // Smoothly transition to sand from 2.5 to 4.0 above water level.
                tempColor.lerpColors(colorShallowWater, colorSand, smoothstep(2.5, 4.0, h));
            } else if (h < 6.0) {
                tempColor.lerpColors(colorSand, colorIslandGrass, smoothstep(4.0, 6.0, h));
            } else if (h < 25) {
                tempColor.lerpColors(colorIslandGrass, colorHigh, smoothstep(6.0, 25, h));
            } else if (h < 35) {
                tempColor.lerpColors(colorHigh, colorIslandRock, smoothstep(25, 35, h));
            } else {
                tempColor.lerpColors(colorIslandRock, colorDirt, smoothstep(35, 50, h));
            }

            colors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
        
        terrainGeo.computeVertexNormals(); 
        pos.needsUpdate = true;
        colors.needsUpdate = true;
        
        lastTerrainGridX = gridX;
        lastTerrainGridZ = gridZ;
    }

    // ==========================================
    // 6. INSTANCED DIORAMA PROPS
    // ==========================================
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const ROCK_COUNT = isMobile ? 60 : 180;
    const BUSH_COUNT = isMobile ? 72 : 216;
    const ANIMAL_COUNT = isMobile ? 25 : 50;
    const CLOUD_COUNT = 50;
    const FLOWER_COUNT = isMobile ? 100 : 300; // Removed flowers
    const TREE_MULT = isMobile ? 0.3 : 1.0;
    
    function applyColor(geometry, colorHex) {
        const color = new THREE.Color(colorHex);
        const colors = [];
        const count = geometry.attributes.position.count;
        for (let i = 0; i < count; i++) {
            colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    
    
    const createMushroom = (stemColor, capColor, size, height) => {
        const geos = [];
        const stem = new THREE.CylinderGeometry(0.3 * size, 0.5 * size, height, 5); // low poly stem
        stem.translate(0, height / 2, 0);
        applyColor(stem, stemColor);
        geos.push(stem);
        // Low poly cap! (5 radial segments, 3 height segments)
        const cap = new THREE.SphereGeometry(2.5 * size, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        cap.translate(0, height - 0.2, 0);
        // add some random rotation to cap vertices for a jagged natural look
        const pos = cap.attributes.position;
        for(let i=0; i<pos.count; i++) {
            if (pos.getY(i) > height) {
               pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.5 * size);
            }
        }
        applyColor(cap, capColor);
        geos.push(cap);
        const merged = BufferGeometryUtils.mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g), false);
        merged.scale(2.5, 2.5, 2.5);
        return merged;
    };
    // Softer bioluminescent colors
    const geoTree1 = createMushroom(0x4a235a, 0x87cefa, 1.0, 3.0); // Light Sky Blue
    const geoTree2 = createMushroom(0x2e1114, 0xffb6c1, 1.5, 4.5); // Pastel Pink

    
    
    const t3Geos = [];
    const t3Trunk = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 5);
    t3Trunk.translate(0, 1.75, 0);
    applyColor(t3Trunk, 0x111122);
    t3Geos.push(t3Trunk);
    const cone31 = new THREE.ConeGeometry(2.0, 3, 5);
    cone31.translate(0, 3, 0); applyColor(cone31, 0x7fffd4); t3Geos.push(cone31);
    const geoTree3 = BufferGeometryUtils.mergeGeometries(t3Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree3.scale(2.5, 2.5, 2.5);

    const t4Geos = [];
    const t4Trunk = new THREE.CylinderGeometry(0.3, 0.6, 3.0, 5);
    t4Trunk.translate(0, 1.5, 0);
    applyColor(t4Trunk, 0x221133);
    t4Geos.push(t4Trunk);
    const cone41 = new THREE.ConeGeometry(1.8, 2.5, 5);
    cone41.translate(0, 2.8, 0); applyColor(cone41, 0xdda0dd); t4Geos.push(cone41);
    const cone42 = new THREE.ConeGeometry(1.5, 2.5, 5);
    cone42.translate(0, 4.0, 0); applyColor(cone42, 0xdda0dd); t4Geos.push(cone42);
    const geoTree4 = BufferGeometryUtils.mergeGeometries(t4Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree4.scale(2.5, 2.5, 2.5);

// Tree 5: Complex Bonsai
    const t5Geos = [];
    const t5Trunk = new THREE.CylinderGeometry(0.6, 1.2, 3.5, 6);
    t5Trunk.translate(0, 1.75, 0);
    applyColor(t5Trunk, 0x7a6f5e);
    t5Geos.push(t5Trunk);
    
    const leavesPos = [
        {x: 0, y: 5.0, z: 0, s: 1.2},
        {x: 2.2, y: 3.8, z: 0, s: 1.0},
        {x: -1.8, y: 3.2, z: 0.5, s: 0.9},
        {x: 1.0, y: 4.2, z: -1.2, s: 0.8}
    ];
    leavesPos.forEach(pos => {
        const leaf = new THREE.CylinderGeometry(1.5*pos.s, 2.8*pos.s, 0.8*pos.s, 6);
        leaf.translate(pos.x, pos.y, pos.z);
        applyColor(leaf, 0x5dcf66);
        t5Geos.push(leaf);
    });
    const geoTree5 = BufferGeometryUtils.mergeGeometries(t5Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree5.scale(2.5, 2.5, 2.5);

    // Tree 6: Pink Cherry Blossom
    const t6Geos = [];
    const t6Trunk = new THREE.CylinderGeometry(0.3, 0.6, 3, 3);
    t6Trunk.translate(0, 1.5, 0);
    applyColor(t6Trunk, 0xa87f5e);
    t6Geos.push(t6Trunk);

    const blossomPos = [
        {x: 0, y: 4.5, z: 0, s: 1.6},
        {x: -1.2, y: 3.5, z: 0.8, s: 1.3},
        {x: 1.2, y: 3.8, z: -0.6, s: 1.4}
    ];
    blossomPos.forEach(pos => {
        const leaf = new THREE.OctahedronGeometry(1.5 * pos.s, 0);
        leaf.scale(1, 0.7, 1);
        leaf.translate(pos.x, pos.y, pos.z);
        applyColor(leaf, 0xffa6c9);
        t6Geos.push(leaf);
    });
    const geoTree6 = BufferGeometryUtils.mergeGeometries(t6Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree6.scale(2.5, 2.5, 2.5);

    
    const wallColors = [0xfef0c8, 0xebaf9b, 0x82bfa8, 0x6e9ca8, 0xe1d9c1, 0xffffff, 0xcbe3d6]; 
    const roofColors = [0xd95a53, 0x4a7c8c, 0x5a6351, 0x8a7b6b, 0x8a4538, 0x566d8f];
    const woodColor = 0x5c4033;
    const windowColor = 0x223344;
     
    const matWalls = wallColors.map(c => new THREE.MeshToonMaterial({ color: c, gradientMap: gradientMap }));
    const matRoofs = roofColors.map(c => new THREE.MeshToonMaterial({ color: c, gradientMap: gradientMap }));
    const matWoodDark = new THREE.MeshToonMaterial({ color: woodColor, gradientMap: gradientMap });
    const matWindowDark = new THREE.MeshToonMaterial({ color: windowColor, gradientMap: gradientMap });
    const matBushDark = new THREE.MeshToonMaterial({ color: 0x3a6b4a, gradientMap: gradientMap });
    const matStone = new THREE.MeshToonMaterial({ color: 0x9e9e9e, gradientMap: gradientMap });
    const matMetal = new THREE.MeshToonMaterial({ color: 0x5a5a6a, gradientMap: gradientMap });
    const matShutter = new THREE.MeshToonMaterial({ color: 0x418a7a, gradientMap: gradientMap });

    const matClothes = [
        new THREE.MeshToonMaterial({ color: 0xdd4444, gradientMap: gradientMap }),
        new THREE.MeshToonMaterial({ color: 0x4488dd, gradientMap: gradientMap }),
        new THREE.MeshToonMaterial({ color: 0xdddd44, gradientMap: gradientMap }),
        new THREE.MeshToonMaterial({ color: 0xeeeeee, gradientMap: gradientMap })
    ];

    function createAntenna() {
        const grp = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), matMetal);
        pole.position.y = 1.5;
        grp.add(pole);
        const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2), matMetal);
        cross.rotation.z = Math.PI/2;
        cross.position.y = 2.5;
        grp.add(cross);
        const cross2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5), matMetal);
        cross2.rotation.z = Math.PI/2;
        cross2.position.y = 2.0;
        grp.add(cross2);
        return grp;
    }

    function createBalcony(w, d, matBase, matRail) {
        const balc = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(w, 0.4, d);
        const base = new THREE.Mesh(baseGeo, matBase);
        base.castShadow = true;
        balc.add(base);
                 
        const railGeo = new THREE.BoxGeometry(0.2, 1.2, d);
        const railL = new THREE.Mesh(railGeo, matRail);
        railL.position.set(-w/2 + 0.1, 0.6, 0);
        railL.castShadow = true;
        balc.add(railL);
                 
        const railR = new THREE.Mesh(railGeo, matRail);
        railR.position.set(w/2 - 0.1, 0.6, 0);
        railR.castShadow = true;
        balc.add(railR);
                 
        const railFGeo = new THREE.BoxGeometry(w, 1.2, 0.2);
        const railF = new THREE.Mesh(railFGeo, matRail);
        railF.position.set(0, 0.6, d/2 - 0.1);
        railF.castShadow = true;
        balc.add(railF);
        return balc;
    }

    function createWindow(w, h) {
        const winGeo = new THREE.BoxGeometry(w, h, 0.2);
        const win = new THREE.Mesh(winGeo, matWindowDark);
        
        const frameGeoL = new THREE.BoxGeometry(0.3, h + 0.6, 0.4);
        const frameL = new THREE.Mesh(frameGeoL, matWoodDark);
        frameL.position.set(-w/2 - 0.15, 0, 0);
        win.add(frameL);
        const frameR = new THREE.Mesh(frameGeoL, matWoodDark);
        frameR.position.set(w/2 + 0.15, 0, 0);
        win.add(frameR);
        const frameTGeo = new THREE.BoxGeometry(w + 0.9, 0.3, 0.4);
        const frameT = new THREE.Mesh(frameTGeo, matWoodDark);
        frameT.position.set(0, h/2 + 0.15, 0);
        win.add(frameT);
        const frameB = new THREE.Mesh(frameTGeo, matWoodDark);
        frameB.position.set(0, -h/2 - 0.15, 0);
        win.add(frameB);
        return win;
    }

    function createWindowWithShutters(w, h, sMat) {
        const win = createWindow(w, h);
        if (Math.random() > 0.3) {
            const shutterGeo = new THREE.BoxGeometry(w/2 * 0.9, h, 0.15);
            const shutterL = new THREE.Mesh(shutterGeo, sMat);
            shutterL.position.set(-w/2 - w/4, 0, 0.1);
            win.add(shutterL);
            const shutterR = new THREE.Mesh(shutterGeo, sMat);
            shutterR.position.set(w/2 + w/4, 0, 0.1);
            win.add(shutterR);
        }
        if (Math.random() > 0.5) {
            const planterGeo = new THREE.BoxGeometry(w + 0.4, 0.4, 0.6);
            const planter = new THREE.Mesh(planterGeo, matWoodDark);
            planter.position.set(0, -h/2 - 0.2, 0.3);
            win.add(planter);
            const bushGeo = new THREE.DodecahedronGeometry(0.3, 0);
            for(let i=0; i<3; i++) {
                const b = new THREE.Mesh(bushGeo, matBushDark);
                b.position.set(-w/2 + i*(w/2), -h/2 + 0.1, 0.4);
                win.add(b);
            }
        }
        return win;
    }

    // Other Geometries
    const geoRock = new THREE.DodecahedronGeometry(2.5, 0); // 36-triangle low poly boulders
    
    
    const geoAnimal = new THREE.BoxGeometry(1.2, 1.2, 1.8);
    geoAnimal.translate(0, 0.6, 0);
    
    const geoFlowerStem = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 3);
    geoFlowerStem.translate(0, 0.2, 0);
    const geoFlowerHead = new THREE.OctahedronGeometry(0.35, 0); // Ultra low poly 8-triangle gem head
    geoFlowerHead.translate(0, 0.5, 0);
    geoFlowerHead.scale(1, 0.5, 1);
    const geoFlower = BufferGeometryUtils.mergeGeometries([geoFlowerStem.toNonIndexed(), geoFlowerHead.toNonIndexed()]);

    const b3 = new THREE.ConeGeometry(0.15, 0.6, 3);
    b3.translate(0, 0.3, 0);
    b3.rotateX(-0.2);

    const geoCloud = new THREE.OctahedronGeometry(5, 0);
    geoCloud.scale(1.0, 3.0, 1.0); 
    const ccolors = [];
    for (let i = 0; i < geoCloud.attributes.position.count; i++) {
        const color = new THREE.Color();
        color.setHSL(Math.random(), 1.0, 0.5); // Random vibrant colors
        ccolors.push(color.r, color.g, color.b);
    }
    geoCloud.setAttribute('color', new THREE.Float32BufferAttribute(ccolors, 3));
    geoCloud.computeVertexNormals();

    // Meshes
    const instTree1 = new THREE.InstancedMesh(geoTree1, treeMaterials, Math.floor(3600 * TREE_MULT));
    const instTree2 = new THREE.InstancedMesh(geoTree2, treeMaterials, Math.floor(3600 * TREE_MULT));
    const instTree3 = new THREE.InstancedMesh(geoTree3, treeMaterials, Math.floor(3600 * TREE_MULT));
    const instTree4 = new THREE.InstancedMesh(geoTree4, treeMaterials, Math.floor(2400 * TREE_MULT));
    const instTree5 = new THREE.InstancedMesh(geoTree5, treeMaterials, 0); // Removed trees with cut off tops
    const instTree6 = new THREE.InstancedMesh(geoTree6, treeMaterials, 0); // Removed pink trees
    
    
    const treeMeshes = [instTree1, instTree2, instTree3, instTree4, instTree5, instTree6];
    treeMeshes.forEach(mesh => {
        mesh.maxCount = mesh.count;
    });


    const instRocks = new THREE.InstancedMesh(geoRock, matRock, ROCK_COUNT);
    
    const instAnimals = new THREE.InstancedMesh(geoAnimal, matAnimal, ANIMAL_COUNT);
    const instClouds = new THREE.InstancedMesh(geoCloud, matGlow, CLOUD_COUNT);
    const instFlowers = new THREE.InstancedMesh(geoFlower, matFlower, FLOWER_COUNT);

    const rockColors = [0xe5d4ba, 0xcbb192, 0xd8c8b8, 0x8a7b69, 0xd2c0a3];
    const tempRockColor = new THREE.Color();
    for (let i = 0; i < ROCK_COUNT; i++) {
        tempRockColor.setHex(rockColors[Math.floor(Math.random() * rockColors.length)]);
        instRocks.setColorAt(i, tempRockColor);
    }

    const flowerColors = [0x00ffff, 0xff00ff, 0xffffff, 0x00ff88, 0x0000ff]; // white, yellow, pink, blue, red
    const tempFlowerColor = new THREE.Color();
    for (let i = 0; i < FLOWER_COUNT; i++) {
        tempFlowerColor.setHex(flowerColors[Math.floor(Math.random() * flowerColors.length)]);
        instFlowers.setColorAt(i, tempFlowerColor);
    }
    
    // Water Mesh
    let waterMesh;
    
    let instHouses = null;
    let instBoats = null;
    let instCastles = null;
    const HOUSE_COUNT = 60;
    const BOAT_COUNT = 40;
    const CASTLE_COUNT = 5;

    function loadAssets() {
        // All 3D models removed
    }

    const waterGeo = new THREE.PlaneGeometry(5000, 5000);
    waterGeo.rotateX(-Math.PI / 2);
    
    const waterUniforms = {
        uTime: { value: 0 }
    };
    
    
    const waterMat = new THREE.MeshStandardMaterial({ 
        color: 0xff66b2, 
        roughness: 0.1, 
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });

    
    waterMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = waterUniforms.uTime;
        
        shader.vertexShader = `
            varying vec3 vWorldPos;
        ` + shader.vertexShader;
        
        shader.vertexShader = shader.vertexShader.replace(
            `#include <worldpos_vertex>`,
            `#include <worldpos_vertex>
             vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
        );
        
        shader.fragmentShader = `
            uniform float uTime;
            varying vec3 vWorldPos;
            
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ; m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0; vec3 h = abs(x) - 0.5; vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox; m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g; g.x  = a0.x  * x0.x  + h.x  * x0.y; g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }
        ` + shader.fragmentShader;
        
        shader.fragmentShader = shader.fragmentShader.replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
             vec2 uv = vWorldPos.xz * 0.1; // Much smaller, more tightly packed ripples
             float n1 = 1.0 - abs(snoise(uv + vec2(uTime * 0.1, uTime * 0.05)));
             float n2 = 1.0 - abs(snoise(uv * 1.5 - vec2(uTime * 0.15, -uTime * 0.05)));
             float caustics = pow(n1, 6.0) + pow(n2, 6.0) * 0.5;
             
             // Fade out ripples on inland rivers and small lakes perfectly
             float simpleTerrainH = snoise(vWorldPos.xz * 0.003) * 15.0;
             float deepWater = smoothstep(-0.5, -4.0, simpleTerrainH); 
             
             caustics = clamp(caustics, 0.0, 1.0) * deepWater;
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.95, 1.0), caustics * 0.5);
             
             // Darken water in the distance to give depth to the vast ocean
             float dist = length(vWorldPos.xz - cameraPosition.xz);
             float depthFade = smoothstep(50.0, 350.0, dist);
             diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.2, depthFade);
            `
        );
    };

    waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 2.4; // Lowered slightly so the terrain shader can paint a smooth shoreline above it
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);

    treeMeshes.forEach(mesh => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; 
        scene.add(mesh);
    });
    [instRocks,  instFlowers].forEach(mesh => {
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; 
        scene.add(mesh);
    });

    instClouds.castShadow = true;
    instClouds.frustumCulled = false;
    scene.add(instClouds);

    // Super High Cumulonimbus Clouds
    const HIGH_CLOUD_COUNT = 30;
    const highCloudGeo = new THREE.DodecahedronGeometry(150, 1);
    const highCloudMat = new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const instHighClouds = new THREE.InstancedMesh(highCloudGeo, highCloudMat, HIGH_CLOUD_COUNT);
    instHighClouds.frustumCulled = false;
    scene.add(instHighClouds);
    
    instFlowers.receiveShadow = false;
    instFlowers.castShadow = false;
    scene.add(instFlowers);
    
    // High-Altitude Distant Clouds (Removed to fix glitchy sky blobs)
    


    // Companion Seagull Flock
    const flockGrp = new THREE.Group();
    scene.add(flockGrp);
    const birds = [];
    const matBirdWhite = new THREE.MeshLambertMaterial({ color: 0xffffff, fog: true, dithering: true });
    const matBirdBlue = new THREE.MeshLambertMaterial({ color: 0x2255aa, fog: true, dithering: true });
    const matBirdBeak = new THREE.MeshLambertMaterial({ color: 0xffcc00, fog: true, dithering: true });
    
    const geoBirdBody = new THREE.ConeGeometry(0.5, 2.5, 5);
    geoBirdBody.rotateX(-Math.PI / 2); // Tail at -Z, chest at +Z
    
    const geoBirdHead = new THREE.ConeGeometry(0.35, 1.2, 5);
    geoBirdHead.translate(0, 0.6, 0);
    geoBirdHead.rotateX(Math.PI / 4); // Leans forward
    
    const geoBirdBeak = new THREE.ConeGeometry(0.12, 0.8, 4);
    geoBirdBeak.rotateX(Math.PI / 2); // Points forward (+Z)
    
    const geoInnerWing = new THREE.CylinderGeometry(0.4, 0.8, 2.2, 4);
    geoInnerWing.rotateZ(-Math.PI / 2); // Points right (+X)
    geoInnerWing.scale(1, 0.05, 1);
    geoInnerWing.translate(1.1, 0, 0);
    
    const geoOuterWing = new THREE.CylinderGeometry(0.01, 0.4, 1.8, 4);
    geoOuterWing.rotateZ(-Math.PI / 2); // Points right (+X)
    geoOuterWing.scale(1, 0.05, 1);
    geoOuterWing.translate(0.9, 0, 0);
    
    for(let i=0; i<1; i++) { // Only 1 bird
        const bird = new THREE.Group();
        bird.scale.set(0.3, 0.3, 0.3); // Scale down dramatically
        
        const body = new THREE.Mesh(geoBirdBody, matBirdWhite);
        body.position.set(0, 0, -0.2); // Shift slightly back
        body.castShadow = true;
        const head = new THREE.Mesh(geoBirdHead, matBirdWhite);
        head.position.set(0, 0.2, 0.8);
        const beak = new THREE.Mesh(geoBirdBeak, matBirdBeak);
        beak.position.set(0, 0.7, 1.5);
        bird.add(body); bird.add(head); bird.add(beak);
        
        // Right Wing Group
        const wingR = new THREE.Group();
        const innerR = new THREE.Mesh(geoInnerWing, matBirdWhite);
        const outerR = new THREE.Mesh(geoOuterWing, matBirdBlue);
        outerR.position.set(2.2, 0, 0); 
        wingR.add(innerR); wingR.add(outerR);
        wingR.position.set(0.3, 0.2, 0.5); // Attach near chest
        
        // Left Wing Group
        const wingL = new THREE.Group();
        const innerL = new THREE.Mesh(geoInnerWing, matBirdWhite);
        const outerL = new THREE.Mesh(geoOuterWing, matBirdBlue);
        outerL.position.set(2.2, 0, 0);
        wingL.add(innerL); wingL.add(outerL);
        wingL.position.set(-0.3, 0.2, 0.5); // Attach near chest
        wingL.rotation.y = Math.PI; // Point left
        
        bird.add(wingL); bird.add(wingR);
        bird.userData = { wingL, wingR, offset: new THREE.Vector3(0,0,0), phase: 0 };
        birds.push(bird);
        flockGrp.add(bird);
    }
    let flockState = 'IDLE';
    let flockTimer = 0;
    let flockTarget = new THREE.Vector3();
    flockGrp.position.set(0, 200, 0);

    // Initialize all to hidden
    const dummyMatrix = new THREE.Matrix4();
    dummyMatrix.setPosition(0, -1000, 0);
    [...treeMeshes, instRocks,  instClouds, instFlowers, instHighClouds].forEach(mesh => {
        for(let i=0; i<mesh.count; i++) {
            mesh.setMatrixAt(i, dummyMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });

    // ==========================================
    // 6.25 AMBIENT SKY WHALE    // ==========================================
    // 6. ANIMATED WHALE 
    // ==========================================
    const skyWhales = [];
    const whalePod = new THREE.Group();
    whalePod.position.set(100, 150, -300); // Start in the sky ahead
    whalePod.rotation.y = Math.PI; // Face somewhat towards the player or forward
    scene.add(whalePod);
    const { group: whale, material: wMat } = createParticleWhale();
    whale.scale.setScalar(14.0); // GIANT — large enough to be cinematic at close range
    
    // Add magical ethereal blue glow
    const wLight = new THREE.PointLight(0x4488ff, 1.5, 300);
    whale.add(wLight);
    
    skyWhales.push({
        group: whale,
        mat: wMat,
        phase: Math.random() * 10
    });
    whalePod.add(whale);

    // ===================================================
    // 6.5 BOIDS (BIRDS)
    // ==========================================
    const BIRD_COUNT = 40;
    const geoBird = new THREE.BufferGeometry();
    const birdScale = 0.6;
    const bVerts = new Float32Array([
        // Left Wing
        0, 0, 1.5*birdScale,
        -2.0*birdScale, 0, -1.0*birdScale,
        0, 0, -0.5*birdScale,
        // Right Wing
        0, 0, 1.5*birdScale,
        0, 0, -0.5*birdScale,
        2.0*birdScale, 0, -1.0*birdScale,
    ]);
    geoBird.setAttribute('position', new THREE.BufferAttribute(bVerts, 3));
    geoBird.computeVertexNormals();
    
    const matBird = new THREE.MeshToonMaterial({ color: 0xffffff, side: THREE.DoubleSide, gradientMap });
    
    // Add shader modification to flap wings mathematically inside the GPU!
    matBird.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = `uniform float time;\n` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
            `#include <begin_vertex>`,
            `
            vec3 transformed = vec3( position );
            // Flap outer wing tips up and down
            if (abs(position.x) > 0.1) {
                transformed.y += sin(time * 8.0 + position.x) * 0.5 * ${birdScale};
            }
            `
        );
        matBird.userData.shader = shader;
    };

    const instBirds = new THREE.InstancedMesh(geoBird, matBird, BIRD_COUNT);
    instBirds.castShadow = true;
    instBirds.frustumCulled = false;
    scene.add(instBirds);

    const birdData = new Float32Array(BIRD_COUNT * 6); 
    for (let i = 0; i < BIRD_COUNT; i++) {
        birdData[i * 6 + 0] = (Math.random() - 0.5) * 600;
        birdData[i * 6 + 1] = 60 + Math.random() * 80;
        birdData[i * 6 + 2] = (Math.random() - 0.5) * 600;
        birdData[i * 6 + 3] = (Math.random() - 0.5) * 10;
        birdData[i * 6 + 4] = (Math.random() - 0.5) * 2;
        birdData[i * 6 + 5] = (Math.random() - 0.5) * 10;
    }

    const HIGH_BIRD_COUNT = 60;
    const instHighBirds = new THREE.InstancedMesh(geoBird, matBird, HIGH_BIRD_COUNT);
    instHighBirds.castShadow = true;
    instHighBirds.frustumCulled = false;
    scene.add(instHighBirds);

    const highBirdData = new Float32Array(HIGH_BIRD_COUNT * 6);
    for (let i = 0; i < HIGH_BIRD_COUNT; i++) {
        highBirdData[i * 6 + 0] = (Math.random() - 0.5) * 1200;
        highBirdData[i * 6 + 1] = 300 + Math.random() * 200; // High altitude!
        highBirdData[i * 6 + 2] = (Math.random() - 0.5) * 1200;
        highBirdData[i * 6 + 3] = (Math.random() - 0.5) * 10;
        highBirdData[i * 6 + 4] = (Math.random() - 0.5) * 2;
        highBirdData[i * 6 + 5] = (Math.random() - 0.5) * 10;
    }

    // ==========================================
    // FISH AND WHALE
    // ==========================================
    const FISH_COUNT = 50;
    const geoFish = new THREE.BufferGeometry();
    const fishScale = 0.4;
    const fVerts = new Float32Array([
        0, 0, 1.5*fishScale,
        -1.0*fishScale, 0, -1.0*fishScale,
        0, 0, -0.5*fishScale,
        
        0, 0, 1.5*fishScale,
        0, 0, -0.5*fishScale,
        1.0*fishScale, 0, -1.0*fishScale,
    ]);
    geoFish.setAttribute('position', new THREE.BufferAttribute(fVerts, 3));
    geoFish.computeVertexNormals();
    
    const matFish = new THREE.MeshToonMaterial({ color: 0x4477aa, side: THREE.DoubleSide, gradientMap });
    const instFish = new THREE.InstancedMesh(geoFish, matFish, FISH_COUNT);
    instFish.frustumCulled = false;
    scene.add(instFish);

    const fishData = new Float32Array(FISH_COUNT * 6); 
    for (let i = 0; i < FISH_COUNT; i++) {
        fishData[i * 6 + 0] = (Math.random() - 0.5) * 600;
        fishData[i * 6 + 1] = 5 + Math.random() * 5; 
        fishData[i * 6 + 2] = (Math.random() - 0.5) * 600;
        fishData[i * 6 + 3] = (Math.random() - 0.5) * 5;
        fishData[i * 6 + 4] = (Math.random() - 0.5) * 1;
        fishData[i * 6 + 5] = (Math.random() - 0.5) * 5;
    }

    // ==========================================
    // WIND TRAILS
    // ==========================================
    const trailGeo = new THREE.BoxGeometry(0.1, 0.1, 10.0);
    const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const instTrails = new THREE.InstancedMesh(trailGeo, trailMat, 100);
    instTrails.frustumCulled = false;
    scene.add(instTrails);

    const trailsData = new Float32Array(100 * 4); 
    for(let i=0; i<100; i++) {
       trailsData[i*4] = (Math.random() - 0.5) * 80;
       trailsData[i*4+1] = (Math.random() - 0.5) * 60;
       trailsData[i*4+2] = (Math.random() - 0.5) * 100;
       trailsData[i*4+3] = Math.random();
    }

    function updateFish(playerX, playerY, playerZ, time, dt) {
        // Fish Boids (Underwater)
        for (let i = 0; i < FISH_COUNT; i++) {
            let px = fishData[i * 6 + 0];
            let py = fishData[i * 6 + 1];
            let pz = fishData[i * 6 + 2];
            let vx = fishData[i * 6 + 3];
            let vy = fishData[i * 6 + 4];
            let vz = fishData[i * 6 + 5];

            let cx = 0, cy = 0, cz = 0;
            let sx = 0, sy = 0, sz = 0;
            let ax = 0, ay = 0, az = 0;
            let count = 0;

            for (let j = 0; j < FISH_COUNT; j++) {
                if (i === j) continue;
                let dx = px - fishData[j * 6 + 0];
                let dy = py - fishData[j * 6 + 1];
                let dz = pz - fishData[j * 6 + 2];
                let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (dist < 15) {
                    cx += fishData[j * 6 + 0]; cy += fishData[j * 6 + 1]; cz += fishData[j * 6 + 2];
                    ax += fishData[j * 6 + 3]; ay += fishData[j * 6 + 4]; az += fishData[j * 6 + 5];
                    sx += (px - fishData[j * 6 + 0]) / dist; sy += (py - fishData[j * 6 + 1]) / dist; sz += (pz - fishData[j * 6 + 2]) / dist;
                    count++;
                }
            }

            if (count > 0) {
                cx /= count; cy /= count; cz /= count;
                ax /= count; ay /= count; az /= count;
                vx += (cx - px) * 0.005 + (ax - vx) * 0.05 + sx * 0.05;
                vy += (cy - py) * 0.005 + (ay - vy) * 0.05 + sy * 0.05;
                vz += (cz - pz) * 0.005 + (az - vz) * 0.05 + sz * 0.05;
            }

            // Keep them underwater and near player
            vx += (playerX - px) * 0.0001;
            vz += (playerZ - pz) * 0.0001;
            vy += (5 - py) * 0.01; 

            vx += (Math.random() - 0.5) * 0.5;
            vy += (Math.random() - 0.5) * 0.2;
            vz += (Math.random() - 0.5) * 0.5;

            let speed = Math.sqrt(vx*vx + vy*vy + vz*vz);
            if (speed > 8) {
                vx = (vx / speed) * 8; vy = (vy / speed) * 8; vz = (vz / speed) * 8;
            }

            px += vx * dt; py += vy * dt; pz += vz * dt;
            
            if (py > 9) py = 9;

            if (px > playerX + 300) px -= 600; if (px < playerX - 300) px += 600;
            if (pz > playerZ + 300) pz -= 600; if (pz < playerZ - 300) pz += 600;

            fishData[i * 6 + 0] = px; fishData[i * 6 + 1] = py; fishData[i * 6 + 2] = pz;
            fishData[i * 6 + 3] = vx; fishData[i * 6 + 4] = vy; fishData[i * 6 + 5] = vz;

            dummy.position.set(px, py, pz);
            dummy.scale.setScalar(1.0 + Math.sin(time * 10 + i)*0.1);
            let dir = new THREE.Vector3(vx, vy, vz).normalize();
            let targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
            dummy.quaternion.copy(targetQuat);
            dummy.updateMatrix();
            instFish.setMatrixAt(i, dummy.matrix);
        }
        instFish.instanceMatrix.needsUpdate = true;
    }

    function updateBirdsGen(data, inst, count, tX, tY, tZ, time, dt, centerPull) {
        for (let i = 0; i < count; i++) {
            let px = data[i * 6 + 0], py = data[i * 6 + 1], pz = data[i * 6 + 2];
            let vx = data[i * 6 + 3], vy = data[i * 6 + 4], vz = data[i * 6 + 5];

            let cx = 0, cy = 0, cz = 0;
            let sx = 0, sy = 0, sz = 0;
            let ax = 0, ay = 0, az = 0;
            let n = 0;

            for (let j = 0; j < count; j++) {
                if (i === j) continue;
                let dx = px - data[j * 6 + 0], dy = py - data[j * 6 + 1], dz = pz - data[j * 6 + 2];
                let distSq = dx*dx + dy*dy + dz*dz;
                
                if (distSq < 1200) { 
                    cx += data[j * 6 + 0]; cy += data[j * 6 + 1]; cz += data[j * 6 + 2];
                    ax += data[j * 6 + 3]; ay += data[j * 6 + 4]; az += data[j * 6 + 5];
                    n++;
                }
                if (distSq < 200) { 
                    sx += dx; sy += dy; sz += dz;
                }
            }

            if (n > 0) {
                cx /= n; cy /= n; cz /= n;
                ax /= n; ay /= n; az /= n;
                vx += (cx - px) * 0.5 * dt;
                vy += (cy - py) * 0.5 * dt;
                vz += (cz - pz) * 0.5 * dt;
                vx += (ax - vx) * 0.1 * dt;
                vy += (ay - vy) * 0.1 * dt;
                vz += (az - vz) * 0.1 * dt;
            }
            
            vx += sx * 0.1 * dt; vy += sy * 0.1 * dt; vz += sz * 0.1 * dt;

            let tx = tX - px, ty = tY - py, tz = tZ - pz;
            let dToT = Math.sqrt(tx*tx + ty*ty + tz*tz);
            if (dToT > 50) {
                vx += (tx / dToT) * centerPull * dt;
                vy += (ty / dToT) * centerPull * dt;
                vz += (tz / dToT) * centerPull * dt;
            }

            let spd = Math.sqrt(vx*vx + vy*vy + vz*vz);
            if (spd > 35) { vx *= 35/spd; vy *= 35/spd; vz *= 35/spd; }
            if (spd < 15) { vx *= 15/spd; vy *= 15/spd; vz *= 15/spd; }

            px += vx * dt; py += vy * dt; pz += vz * dt;
            data[i * 6 + 0] = px; data[i * 6 + 1] = py; data[i * 6 + 2] = pz;
            data[i * 6 + 3] = vx; data[i * 6 + 4] = vy; data[i * 6 + 5] = vz;

            dummy.position.set(px, py, pz);
            let targetYaw = Math.atan2(vx, vz);
            dummy.rotation.set(0, targetYaw, Math.sin(time * 15 + i) * 0.4);
            dummy.scale.setScalar(0.6);
            dummy.updateMatrix();
            inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
    }

    function updateBirds(playerX, playerY, playerZ, time, dt) {
        updateBirdsGen(birdData, instBirds, BIRD_COUNT, playerX, playerY + 40, playerZ, time, dt, 5.0);
        updateBirdsGen(highBirdData, instHighBirds, HIGH_BIRD_COUNT, 0, 400, 0, time, dt, 2.0); // Orbit center
    }

    const animalData = new Float32Array(ANIMAL_COUNT * 4); 
    const dummy = new THREE.Object3D();

    const treeGrid = new Set();
    const TREE_CELL_SIZE = 17; // Increased to reduce overall density by ~20%
    function getTreeCell(x, z) {
        return Math.floor(x / TREE_CELL_SIZE) + '_' + Math.floor(z / TREE_CELL_SIZE);
    }

    const treeDist = 900; // Increased distance for trees so they spawn seamlessly in fog
    let isPrewarming = false;

    function updateInstances(playerX, playerZ, time, dt, playerYaw) {
        const dist = 350; 
        
        logicTimer += dt;
        const shouldUpdateTerrain = logicTimer >= (1.0 / 15.0);
        if (shouldUpdateTerrain) {
            logicTimer = 0;
        }
        
        // Clouds
        const cloudDist = 1200;
        for (let i = 0; i < CLOUD_COUNT; i++) {
            instClouds.getMatrixAt(i, dummy.matrix);
            dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
            
            if (Math.abs(dummy.position.x - playerX) > cloudDist || Math.abs(dummy.position.z - playerZ) > cloudDist || dummy.position.y < -500) {
                dummy.position.set(
                    playerX + (Math.random() - 0.5) * cloudDist * 2.0,
                    150 + Math.random() * 100,
                    playerZ + (Math.random() - 0.5) * cloudDist * 2.0
                );
                dummy.rotation.set(0, Math.random() * Math.PI, 0);
                dummy.scale.setScalar(1.5 + Math.random() * 2.0); 
            }
            dummy.position.x += 4.0 * dt;
            dummy.position.z += 1.5 * dt;
            dummy.updateMatrix();
            instClouds.setMatrixAt(i, dummy.matrix);
        }
        instClouds.instanceMatrix.needsUpdate = true;

        // High Cumulonimbus Clouds
        const highCloudDist = 3500;
        for (let i = 0; i < HIGH_CLOUD_COUNT; i++) {
            instHighClouds.getMatrixAt(i, dummy.matrix);
            dummy.position.setFromMatrixPosition(dummy.matrix);
            
            if (Math.abs(dummy.position.x - playerX) > highCloudDist || Math.abs(dummy.position.z - playerZ) > highCloudDist || dummy.position.y < -500) {
                dummy.position.set(
                    playerX + (Math.random() - 0.5) * highCloudDist * 2.0,
                    1500 + Math.random() * 600, // Super high altitude
                    playerZ + (Math.random() - 0.5) * highCloudDist * 2.0
                );
                dummy.rotation.set(0, Math.random() * Math.PI, 0);
                // Cumulonimbus shape: wide and tall
                dummy.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5); 
            }
            dummy.position.x += 1.5 * dt; // slow drift
            dummy.updateMatrix();
            instHighClouds.setMatrixAt(i, dummy.matrix);
        }
        instHighClouds.instanceMatrix.needsUpdate = true;

        if (shouldUpdateTerrain) {
            // Trees
            treeMeshes.forEach((instMesh, meshIdx) => {
            const count = instMesh.maxCount || instMesh.count;
            let treeUpdated = false;
            for (let i = currentFrame % 10; i < count; i += 10) {
                instMesh.getMatrixAt(i, dummy.matrix);
                dummy.position.setFromMatrixPosition(dummy.matrix);
                
                if (Math.abs(dummy.position.x - playerX) > treeDist || Math.abs(dummy.position.z - playerZ) > treeDist || dummy.position.y < -500) {
                    
                    if (dummy.position.y > 0) {
                        treeGrid.delete(getTreeCell(dummy.position.x, dummy.position.z));
                    }
                    
                    let valid = false;
                    let nx, nz, h, pathVal, cellKey;
                    let attempts = 0;

                    while(!valid && attempts < 15) {
                        nx = playerX + (Math.random() - 0.5) * treeDist * 2.0;
                        nz = playerZ + (Math.random() - 0.5) * treeDist * 2.0;
                        h = getMeshHeight(nx, nz);
                        pathVal = getPathStrength(nx, nz);
                        cellKey = getTreeCell(nx, nz);
                        
                        let isClearing = snoise(nx * 0.003, nz * 0.003 + 50) > 0.2; // Massive sweeping plains

                        if (!isClearing && h > 2.5 && h < 45 && pathVal < 0.1 && (Math.random() > 0.1)) { 
                            if (!treeGrid.has(cellKey)) {
                                valid = true;
                            }
                        }
                        attempts++;
                    }

                    if (valid) {
                        treeGrid.add(cellKey);
                        dummy.position.set(nx, h, nz);
                        dummy.rotation.set(0, Math.random() * Math.PI, 0);
                        
                        let scale = 0.7 + Math.random() * 1.1;
                        
                        dummy.scale.setScalar(scale);
                    } else {
                        dummy.position.set(0, -1000, 0); 
                    }
                    dummy.updateMatrix();
                    instMesh.setMatrixAt(i, dummy.matrix);
                    treeUpdated = true;
                }
            }
            if (treeUpdated) instMesh.instanceMatrix.needsUpdate = true;
        });

        // Rocks
        let rocksUpdated = false;
        for (let i = currentFrame % 5; i < ROCK_COUNT; i += 5) {
            instRocks.getMatrixAt(i, dummy.matrix);
            dummy.position.setFromMatrixPosition(dummy.matrix);
            
            if (Math.abs(dummy.position.x - playerX) > dist || Math.abs(dummy.position.z - playerZ) > dist || dummy.position.y < -500) {
                const nx = playerX + (Math.random() - 0.5) * dist * 2.0;
                const nz = playerZ + (Math.random() - 0.5) * dist * 2.0;
                const h = getMeshHeight(nx, nz);

                if (h > 2.6 && getPathStrength(nx, nz) < 0.1) { 
                    dummy.position.set(nx, h + 80 + Math.random() * 150, nz);
                    dummy.rotation.set(Math.random(), Math.random(), Math.random());
                    // Uneven scaling creates distinct natural boulders
                    dummy.scale.set(8.0 + Math.random() * 15.0, 5.0 + Math.random() * 10.0, 8.0 + Math.random() * 15.0); 
                } else {
                    dummy.position.set(0, -1000, 0);
                }
                dummy.updateMatrix();
                instRocks.setMatrixAt(i, dummy.matrix);
                rocksUpdated = true;
            }
        }

        // Houses
        if (instHouses) {
            let housesUpdated = false;
            for (let i = currentFrame % 5; i < HOUSE_COUNT; i += 5) {
                instHouses.getMatrixAt(i, dummy.matrix);
                dummy.position.setFromMatrixPosition(dummy.matrix);
                
                if (Math.abs(dummy.position.x - playerX) > dist || Math.abs(dummy.position.z - playerZ) > dist || dummy.position.y < -500) {
                    const nx = playerX + (Math.random() - 0.5) * dist * 2.0;
                    const nz = playerZ + (Math.random() - 0.5) * dist * 2.0;
                    const h = getMeshHeight(nx, nz);

                    if (h > 1.5 && h < 40.0 && Math.random() > 0.5) {
                        dummy.position.set(nx, h, nz);
                        dummy.rotation.set(0, Math.random() * Math.PI, 0);
                        dummy.scale.setScalar(0.5 + Math.random() * 0.3); 
                    } else {
                        dummy.position.set(0, -1000, 0);
                    }
                    dummy.updateMatrix();
                    instHouses.setMatrixAt(i, dummy.matrix);
                    housesUpdated = true;
                }
            }
            if (housesUpdated) instHouses.instanceMatrix.needsUpdate = true;
        }

        // Boats
        if (instBoats) {
            let boatsUpdated = false;
            for (let i = currentFrame % 5; i < BOAT_COUNT; i += 5) {
                instBoats.getMatrixAt(i, dummy.matrix);
                dummy.position.setFromMatrixPosition(dummy.matrix);
                
                if (Math.abs(dummy.position.x - playerX) > dist || Math.abs(dummy.position.z - playerZ) > dist || dummy.position.y < -500) {
                    const nx = playerX + (Math.random() - 0.5) * dist * 2.0;
                    const nz = playerZ + (Math.random() - 0.5) * dist * 2.0;
                    const h = getMeshHeight(nx, nz);

                    if (h < 1.8 && Math.random() < 0.2) { 
                        dummy.position.set(nx, 2.4, nz); // Bob on water line
                        dummy.rotation.set(0, Math.random() * Math.PI, 0);
                        dummy.scale.setScalar(0.8 + Math.random() * 0.4); 
                    } else {
                        dummy.position.set(0, -1000, 0);
                    }
                    dummy.updateMatrix();
                    instBoats.setMatrixAt(i, dummy.matrix);
                    boatsUpdated = true;
                } else if (dummy.position.y > 0) {
                    // Make boats slowly drift and bob
                    dummy.rotation.setFromRotationMatrix(dummy.matrix);
                    dummy.position.y = 2.4 + Math.sin(time * 2.0 + i) * 0.05;
                    dummy.rotation.x = Math.sin(time * 1.5 + i) * 0.05;
                    dummy.rotation.z = Math.cos(time * 1.8 + i) * 0.05;
                    dummy.updateMatrix();
                    instBoats.setMatrixAt(i, dummy.matrix);
                    boatsUpdated = true;
                }
            }
            if (boatsUpdated) instBoats.instanceMatrix.needsUpdate = true;
        }

        // Floating Castles
        if (instCastles) {
            let castlesUpdated = false;
            for (let i = currentFrame % 2; i < CASTLE_COUNT; i += 2) {
                instCastles.getMatrixAt(i, dummy.matrix);
                dummy.position.setFromMatrixPosition(dummy.matrix);
                
                if (Math.abs(dummy.position.x - playerX) > dist * 2.0 || Math.abs(dummy.position.z - playerZ) > dist * 2.0 || dummy.position.y < -500) {
                    const nx = playerX + (Math.random() - 0.5) * dist * 4.0;
                    const nz = playerZ + (Math.random() - 0.5) * dist * 4.0;
                    
                    dummy.position.set(nx, 150 + Math.random() * 100, nz);
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.scale.setScalar(2.0 + Math.random() * 1.0); 
                    dummy.updateMatrix();
                    instCastles.setMatrixAt(i, dummy.matrix);
                    castlesUpdated = true;
                } else if (dummy.position.y > 0) {
                    // Castles float gently in the sky
                    dummy.rotation.setFromRotationMatrix(dummy.matrix);
                    dummy.position.y += Math.sin(time * 0.5 + i) * 0.02;
                    dummy.rotation.y += 0.001;
                    dummy.updateMatrix();
                    instCastles.setMatrixAt(i, dummy.matrix);
                    castlesUpdated = true;
                }
            }
            if (castlesUpdated) instCastles.instanceMatrix.needsUpdate = true;
        }

        
        // Custom Nature Clusters
        if (natureLoaded) {
            for (let m = 0; m < instNatureItems.length; m++) {
                const inst = instNatureItems[m];
                if (!inst) continue;
                
                let updated = false;
                for (let i = currentFrame % 5; i < inst.count; i += 5) {
                    inst.getMatrixAt(i, dummy.matrix);
                    dummy.position.setFromMatrixPosition(dummy.matrix);
                    
                    if (Math.abs(dummy.position.x - playerX) > dist || Math.abs(dummy.position.z - playerZ) > dist || dummy.position.y < -500) {
                        let found = false;
                        for (let tries = 0; tries < 5; tries++) {
                            const nx = playerX + (Math.random() - 0.5) * dist * 2.0;
                            const nz = playerZ + (Math.random() - 0.5) * dist * 2.0;
                            
                            // Check if this cell belongs to this model type
                            if (getNatureSpawn(nx, nz) === m) {
                                const h = getMeshHeight(nx, nz);
                                if (h > 2.6 && getPathStrength(nx, nz) < 0.1) {
                                    dummy.position.set(nx, h, nz);
                                    dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
                                    
                                    // Randomize scale for variety
                                    const s = 0.5 + Math.random() * 1.5; 
                                    dummy.scale.set(s, s, s);
                                    
                                    dummy.updateMatrix();
                                    inst.setMatrixAt(i, dummy.matrix);
                                    updated = true;
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            dummy.position.set(0, -1000, 0);
                            dummy.updateMatrix();
                            inst.setMatrixAt(i, dummy.matrix);
                            updated = true;
                        }
                    }
                }
                if (updated) inst.instanceMatrix.needsUpdate = true;
            }
        }


        // Flowers
        let flowersUpdated = false;
        for (let i = currentFrame % 10; i < FLOWER_COUNT; i += 10) {
            instFlowers.getMatrixAt(i, dummy.matrix);
            dummy.position.setFromMatrixPosition(dummy.matrix);
            
            if (Math.abs(dummy.position.x - playerX) > dist || Math.abs(dummy.position.z - playerZ) > dist || dummy.position.y < -500) {
                const nx = playerX + (Math.random() - 0.5) * dist * 2.0;
                const nz = playerZ + (Math.random() - 0.5) * dist * 2.0;
                const h = getMeshHeight(nx, nz);
                
                let isClearing = snoise(nx * 0.003, nz * 0.003 + 50) > 0.2;
                let validFlower = isClearing ? (Math.random() < 0.8) : (Math.random() < 0.05);

                if (validFlower && h > 2.0 && getPathStrength(nx, nz) < 0.1) {
                    dummy.position.set(nx, h, nz);
                    dummy.rotation.set(0, Math.random() * Math.PI, 0);
                    dummy.scale.set(1, 1, 1);
                    let cNoise = snoise(nx * 0.005, nz * 0.005);
                    let cIdx = Math.floor(((cNoise + 1.0) / 2.0) * flowerColors.length);
                    tempFlowerColor.setHex(flowerColors[Math.min(flowerColors.length - 1, Math.max(0, cIdx))]);
                    instFlowers.setColorAt(i, tempFlowerColor);
                } else {
                    dummy.position.set(0, -1000, 0);
                }
                dummy.updateMatrix();
                instFlowers.setMatrixAt(i, dummy.matrix);
                flowersUpdated = true;
            }
        }
            
            if (rocksUpdated) instRocks.instanceMatrix.needsUpdate = true;
            
            if (flowersUpdated) { instFlowers.instanceMatrix.needsUpdate = true; instFlowers.instanceColor.needsUpdate = true; }
        } // End of shouldUpdateTerrain block

        // Animals
        for (let i = 0; i < ANIMAL_COUNT; i++) {
            let ax = animalData[i * 4 + 0];
            let az = animalData[i * 4 + 1];
            let offset = animalData[i * 4 + 2];
            let h = getMeshHeight(ax, az);

            // Move animal slowly
            ax += Math.sin(time * 0.5 + offset) * dt * 2.0;
            az += Math.cos(time * 0.5 + offset) * dt * 2.0;

            // Keep within distance
            if (Math.abs(ax - playerX) > dist || Math.abs(az - playerZ) > dist) {
                 ax = playerX + (Math.random() - 0.5) * dist * 2.0;
                 az = playerZ + (Math.random() - 0.5) * dist * 2.0;
                 h = getMeshHeight(ax, az);
                 if (h > 2.0 && h < 25 && getPathStrength(ax, az) < 0.2) {
                     animalData[i * 4 + 0] = ax;
                     animalData[i * 4 + 1] = az;
                 } else {
                     ax = 0; az = 0; // reset
                     animalData[i * 4 + 0] = ax;
                     animalData[i * 4 + 1] = az;
                 }
            } else {
                 animalData[i * 4 + 0] = ax;
                 animalData[i * 4 + 1] = az;
            }

            if (h > 2.0 && h < 25) {
                dummy.position.set(ax, h, az);
                dummy.rotation.set(0, time * 0.5 + offset, 0);
                dummy.scale.setScalar(0.8);
            } else {
                dummy.position.set(0, -1000, 0);
            }
            dummy.updateMatrix();
            instAnimals.setMatrixAt(i, dummy.matrix);
        }

        instClouds.instanceMatrix.needsUpdate = true;
        instAnimals.instanceMatrix.needsUpdate = true;


    }

    // ==========================================
    // 7. PLAYER SETUP
    // ==========================================
    const playerGrp = new THREE.Group();
    playerGrp.position.set(0, 50, 0);
    scene.add(playerGrp);

    const playerVisuals = new THREE.Group();
    playerGrp.add(playerVisuals);

    const proxyGeo = new THREE.BoxGeometry(1.5, 0.5, 3);
    const proxyMat = new THREE.MeshToonMaterial({ color: 0xcc4444, gradientMap });
    const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
    proxyMesh.castShadow = true;
    playerVisuals.add(proxyMesh);

    // Character Models State
    let currentCharacter = 'kiki';
    let kikiModel = null;
    let princessModel = null;
    let princessMixer = null;

    document.getElementById('char-toggle').addEventListener('click', () => {
        if (currentCharacter === 'kiki') {
            currentCharacter = 'princess';
            if (kikiModel) kikiModel.visible = false;
            if (princessModel) princessModel.visible = true;
            document.getElementById('char-toggle').innerText = 'Switch to Kiki';
        } else {
            currentCharacter = 'kiki';
            if (princessModel) princessModel.visible = false;
            if (kikiModel) kikiModel.visible = true;
            document.getElementById('char-toggle').innerText = 'Switch to Princess';
        }
    });

    let isHD = true;
    document.getElementById('res-toggle').addEventListener('click', () => {
        isHD = !isHD;
        renderer.setPixelRatio(isHD ? (window.devicePixelRatio || 1) : 0.5);
        document.getElementById('res-toggle').innerText = isHD ? 'Render: HD' : 'Render: SD';
    });

    // Load Kiki GLTF Model
    const gltfLoader = new GLTFLoader();
    
    // Initialize KTX2Loader for compressed textures (like the Whale model)
    const ktx2Loader = new KTX2Loader()
        .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/libs/basis/')
        .detectSupport(renderer);
    gltfLoader.setKTX2Loader(ktx2Loader);
    
    // Initialize MeshoptDecoder for compressed geometries (like the Whale model)
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    gltfLoader.load(
        'kiki-lowpoly.glb',
        (gltf) => {
            kikiModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(kikiModel);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = maxDim > 0 ? (2.0 / maxDim) : 1.0;
            kikiModel.scale.set(targetScale, targetScale, targetScale);
            
            kikiModel.position.x = -center.x * targetScale;
            kikiModel.position.y = -center.y * targetScale;
            kikiModel.position.z = -center.z * targetScale;
            
            kikiModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            kikiModel.rotation.y = Math.PI;
            proxyMesh.visible = false;
            kikiModel.visible = (currentCharacter === 'kiki');
            playerVisuals.add(kikiModel);
        }
    );

    gltfLoader.load(
        'Princess.glb',
        (gltf) => {
            princessModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(princessModel);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = maxDim > 0 ? (2.0 / maxDim) : 1.0;
            princessModel.scale.set(targetScale, targetScale, targetScale);
            
            princessModel.position.x = -center.x * targetScale;
            princessModel.position.y = -center.y * targetScale;
            princessModel.position.z = -center.z * targetScale;
            
            princessModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            princessModel.rotation.y = Math.PI;
            princessModel.visible = (currentCharacter === 'princess');
            playerVisuals.add(princessModel);
            
            if (gltf.animations && gltf.animations.length > 0) {
                princessMixer = new THREE.AnimationMixer(princessModel);
                const action = princessMixer.clipAction(gltf.animations[0]);
                action.play();
            }
        }
    );


    
    
    const natureItemFiles = [
        'AmethistTier2.glb', 'Cactus.glb', 'CaveCoralRock.glb', 'CrystalBlue.glb', 
        'CystalA01.glb', 'DesertRock.glb', 'HalucogenTree.glb', 'PortalRuby.glb', 
        'PortalUranium.glb', 'Ruby.glb', 'RubyTier3.glb', 'Shroom.glb', 
        'Tier2Diamond.glb', 'UraniumTier3.glb'
    ];
    const instNatureItems = [];
    let natureLoaded = false;
    
    // Load all nature items
    let loadedCount = 0;
    natureItemFiles.forEach((file, index) => {
        gltfLoader.load('nature_items/' + file, (gltf) => {
            let mesh = null;
            gltf.scene.traverse((c) => {
                if (!mesh && c.isMesh) {
                    mesh = c;
                }
            });
            if (mesh) {
                // Adjust scale so it fits the world
                const box = new THREE.Box3().setFromObject(mesh);
                const size = new THREE.Vector3();
                box.getSize(size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const targetScale = maxDim > 0 ? (5.0 / maxDim) : 1.0;
                
                mesh.geometry.scale(targetScale, targetScale, targetScale);
                
                // Allow them to glow if they want, but use their original materials.
                // Or we can just use the exact material they came with!
                const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, 100);
                inst.castShadow = true;
                inst.receiveShadow = true;
                
                // Initially hide them
                for (let i = 0; i < 100; i++) {
                    const dummy = new THREE.Object3D();
                    dummy.position.set(0, -1000, 0);
                    dummy.updateMatrix();
                    inst.setMatrixAt(i, dummy.matrix);
                }
                
                scene.add(inst); // directly add to scene instead of array since they load async
                instNatureItems[index] = inst;
            }
            loadedCount++;
            if (loadedCount === natureItemFiles.length) {
                natureLoaded = true;
            }
        });
    });

    function getNatureSpawn(nx, nz) {
        const sx = Math.floor(nx / 250);
        const sz = Math.floor(nz / 250);
        const hash = Math.abs(Math.sin(sx * 12.9898 + sz * 78.233) * 43758.5453);
        return Math.floor(hash * natureItemFiles.length);
    }


    // ==========================================
    // 8. INPUTS (Keyboard & Touch)
    // ==========================================
    const keys = { w: false, a: false, s: false, d: false, shift: false, space: false };
    const touchState = { x: 0, y: 0, boost: false, brake: false };
    let uiVisible = true;

    let pcControlsShown = false;

    window.addEventListener('keydown', e => {
        if (!pcControlsShown && e.key !== 'F12' && e.key !== 'F5') {
            document.getElementById('touch-controls').style.display = 'none';
            document.getElementById('pc-controls-hint').style.display = 'block';
            pcControlsShown = true;
            // Hide the hint after 10 seconds
            setTimeout(() => { document.getElementById('pc-controls-hint').style.opacity = '0'; }, 10000);
        }

        if(e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') keys.w = true;
        if(e.key.toLowerCase() === 's' || e.key === 'ArrowDown') keys.s = true;
        if(e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') keys.a = true;
        if(e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') keys.d = true;
        if(e.key === 'Shift') keys.shift = true;
        if(e.key === ' ') keys.space = true;
        if(e.key.toLowerCase() === 'h') {
            uiVisible = !uiVisible;
            const disp = uiVisible ? 'block' : 'none';
            const dispFlex = uiVisible ? 'flex' : 'none';
            
            document.getElementById('audio-controls').style.display = dispFlex;
            document.getElementById('fps-counter').style.display = disp;
            
            // Hide all buttons in settings-controls EXCEPT hide-ui-toggle
            const settingsBtns = document.getElementById('settings-controls').children;
            for(let i=0; i<settingsBtns.length; i++) {
                if (settingsBtns[i].id !== 'hide-ui-toggle') {
                    settingsBtns[i].style.display = uiVisible ? 'block' : 'none';
                }
            }
            
            document.getElementById('hide-ui-toggle').innerText = uiVisible ? 'Hide UI' : 'Show UI';
            document.getElementById('hide-ui-toggle').style.opacity = uiVisible ? '1' : '0.5';

            if (!pcControlsShown) {
                document.getElementById('touch-controls').style.opacity = uiVisible ? '1' : '0';
                document.getElementById('touch-controls').style.pointerEvents = uiVisible ? 'auto' : 'none';
            }
        }
    });
    window.addEventListener('keyup', e => {
        if(e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') keys.w = false;
        if(e.key.toLowerCase() === 's' || e.key === 'ArrowDown') keys.s = false;
        if(e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') keys.a = false;
        if(e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') keys.d = false;
        if(e.key === 'Shift') keys.shift = false;
        if(e.key === ' ') keys.space = false;
    });

    document.getElementById('hide-ui-toggle').addEventListener('click', () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    });

    const joyBase = document.getElementById('joystick-base');
    const joyKnob = document.getElementById('joystick-knob');
    let activeTouchId = null;
    const maxRadius = 40;

    joyBase.style.opacity = '0'; // Hide by default
    joyBase.style.pointerEvents = 'none';

    let initialPinchDist = null;
    let initialZoomDist = null;

    window.addEventListener('touchstart', e => {
        if (e.target.tagName !== 'CANVAS') return; // Ignore touches on UI buttons
        e.preventDefault();

        if (e.touches.length === 1) {
            const touch = e.changedTouches[0];
            activeTouchId = touch.identifier;
            
            // Move joyBase to touch point
            joyBase.style.left = (touch.clientX - 50) + 'px';
            joyBase.style.top = (touch.clientY - 50) + 'px';
            joyBase.style.bottom = 'auto';
            joyBase.style.opacity = '1';
            
            updateJoystick(touch);
        } else if (e.touches.length === 2) {
            resetJoystick();
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist = Math.sqrt(dx*dx + dy*dy);
            initialZoomDist = cameraZoomDist;
        }
    }, {passive: false});

    window.addEventListener('touchmove', e => {
        if (e.target.tagName !== 'CANVAS') return;
        e.preventDefault();

        if (e.touches.length === 2 && initialPinchDist !== null) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx*dx + dy*dy);
            
            cameraZoomDist = initialZoomDist * (initialPinchDist / newDist);
            cameraZoomDist = Math.max(5.0, Math.min(100.0, cameraZoomDist));
            
            if (cameraZoomDist > 25.0) document.getElementById('zoom-toggle').innerText = 'Zoom In';
            else document.getElementById('zoom-toggle').innerText = 'Zoom Out';
        } else {
            for(let touch of e.changedTouches) {
                if(touch.identifier === activeTouchId) updateJoystick(touch);
            }
        }
    }, {passive: false});

    const resetJoystick = () => {
        activeTouchId = null;
        touchState.x = 0; touchState.y = 0;
        joyKnob.style.transform = `translate(-50%, -50%)`;
        joyBase.style.opacity = '0';
    };

    window.addEventListener('touchend', e => {
        for(let touch of e.changedTouches) {
            if(touch.identifier === activeTouchId) resetJoystick();
        }
        if (e.touches.length < 2) {
            initialPinchDist = null;
        }
    });
    window.addEventListener('touchcancel', e => {
        resetJoystick();
        initialPinchDist = null;
    });

    function updateJoystick(touch) {
        const rect = joyBase.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > maxRadius) {
            dx = (dx / dist) * maxRadius;
            dy = (dy / dist) * maxRadius;
        }
        joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        touchState.x = dx / maxRadius;
        touchState.y = dy / maxRadius;
    }

    const boostBtn = document.getElementById('boost-btn');
    const startBoost = (e) => { e.preventDefault(); touchState.boost = true; boostBtn.style.transform = 'scale(0.9)'; };
    const resetBoost = (e) => { e.preventDefault(); touchState.boost = false; boostBtn.style.transform = 'scale(1)'; };
    boostBtn.addEventListener('touchstart', startBoost);
    boostBtn.addEventListener('mousedown', startBoost);
    boostBtn.addEventListener('touchend', resetBoost);
    boostBtn.addEventListener('touchcancel', resetBoost);
    boostBtn.addEventListener('mouseup', resetBoost);
    boostBtn.addEventListener('mouseleave', resetBoost);

    const brakeBtn = document.getElementById('brake-btn');
    const startBrake = (e) => { e.preventDefault(); touchState.brake = true; brakeBtn.style.transform = 'scale(0.9)'; };
    const resetBrake = (e) => { e.preventDefault(); touchState.brake = false; brakeBtn.style.transform = 'scale(1)'; };
    brakeBtn.addEventListener('touchstart', startBrake);
    brakeBtn.addEventListener('mousedown', startBrake);
    brakeBtn.addEventListener('touchend', resetBrake);
    brakeBtn.addEventListener('touchcancel', resetBrake);
    brakeBtn.addEventListener('mouseup', resetBrake);
    brakeBtn.addEventListener('mouseleave', resetBrake);


    // ==========================================
    // 9. FLIGHT PHYSICS & RENDER LOOP
    // ==========================================
    let velocity = 15.0; 
    let pitch = 0, yaw = 0, roll = 0;
    const BASE_FOV = 60;
    const clock = new THREE.Clock();
    // --- Low-Poly Particle Starfield ---
    const starCount = 8000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
        // Distribute randomly in a sphere well within camera.far (3000)
        const radius = 2500;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        const y = radius * Math.cos(phi);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        starPositions[i] = x;
        starPositions[i + 1] = y;
        starPositions[i + 2] = z;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        sizeAttenuation: false,
        fog: false, // Prevents scene fog from hiding the stars
        transparent: true,
        opacity: 0.0 // Start invisible — lerps to target based on time-of-day
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- Low-Poly Moon Mesh ---
    const moonGeometry = new THREE.IcosahedronGeometry(8, 0); // Completely flat, angular geometry
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xcee7ff });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(-150, 150, 200); // Positioned opposite to the sun setting
    scene.add(moonMesh);


    // --- Camera Rig Hierarchy ---
    const cameraBase = new THREE.Group(); 
    scene.add(cameraBase);

    const cameraPivot = new THREE.Group(); 
    cameraPivot.rotation.order = 'YXZ';
    cameraBase.add(cameraPivot);

    camera.position.set(0, 4, 12); 
    cameraPivot.add(camera);

    // --- Pan Event Listeners (Handles Mouse & Mobile Touch Screen) ---
    let isDragging = false;
    let previousPointerPos = { x: 0, y: 0 };

    const onPointerDown = (event) => {
        isDragging = true;
        previousPointerPos = { x: event.clientX, y: event.clientY };
    };

    const onPointerMove = (event) => {
        if (!isDragging) return;
        const deltaX = event.clientX - previousPointerPos.x;
        const deltaY = event.clientY - previousPointerPos.y;

        // Orbit the pivot
        cameraPivot.rotation.y -= deltaX * 0.004;
        cameraPivot.rotation.x -= deltaY * 0.004;
        
        // Clamp vertical look to prevent the camera from flipping upside down
        cameraPivot.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, cameraPivot.rotation.x));

        previousPointerPos = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = () => isDragging = false;

    // Target the render canvas wrapper to parse inputs properly
    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);

    // --- 4. Movement Variables ---
    const moveSpeed = 18;
    const turnAcceleration = 0.55; 
    const maxTurnSpeed = 0.45;     
    const maxBankAngle = Math.PI / 7; 
    const maxPitchAngle = Math.PI / 4; 

    let currentYaw = 0;   
    let currentPitch = 0;
    let currentRoll = 0;  
    let turnVelocity = 0; 

    const targetQuaternion = new THREE.Quaternion();
    const eulerRotation = new THREE.Euler(0, 0, 0, 'YXZ');
    const baseTargetQuat = new THREE.Quaternion();

    function tickMovement(delta, inputState, character, globalVelocity) {
        // Steering
        if (inputState.left) {
            turnVelocity += turnAcceleration * delta;
        } else if (inputState.right) {
            turnVelocity -= turnAcceleration * delta;
        } else {
            turnVelocity = THREE.MathUtils.lerp(turnVelocity, 0, 3.5 * delta); 
        }
        
        turnVelocity = Math.max(-maxTurnSpeed, Math.min(maxTurnSpeed, turnVelocity));
        currentYaw += turnVelocity * delta;

        // Banking
        let targetRoll = (turnVelocity / maxTurnSpeed) * maxBankAngle;
        currentRoll = THREE.MathUtils.lerp(currentRoll, targetRoll, 1.5 * delta); 

        // Altitude Control
        let targetPitch = -0.18; // Default
        if (inputState.up) { 
            targetPitch = maxPitchAngle; 
        } else if (inputState.down) {
            targetPitch = -maxPitchAngle; 
        }
        currentPitch = THREE.MathUtils.lerp(currentPitch, targetPitch, 1.5 * delta);

        // Apply Rotations
        eulerRotation.set(currentPitch, currentYaw, currentRoll, 'YXZ');
        targetQuaternion.setFromEuler(eulerRotation);
        
        // Soft camera auto-leveling
        if (!inputState.left && !inputState.right && !inputState.up && !inputState.down) {
            character.quaternion.slerp(targetQuaternion, 1.2 * delta); 
        } else {
            character.quaternion.slerp(targetQuaternion, 5.0 * delta); 
        }

        // Forward Flight & Speed Boost
        const movementDirection = new THREE.Vector3(0, 0, -1); 
        movementDirection.applyQuaternion(character.quaternion);
        
        let activeSpeed = globalVelocity; 
        character.position.add(movementDirection.multiplyScalar(activeSpeed * delta));

        // Anti-Clipping Floor Constraint (Metric calculation)
        const minimumFlightHeight = 18; 
        if (character.position.y < minimumFlightHeight) {
            character.position.y = minimumFlightHeight;
        }

        // Camera Base Tracking
        cameraBase.position.copy(character.position);
        
        eulerRotation.set(0, currentYaw, 0, 'YXZ'); 
        baseTargetQuat.setFromEuler(eulerRotation);
        
        cameraBase.quaternion.slerp(baseTargetQuat, 2.8 * delta); 
        
        // Auto-leveling for camera tilt
        camera.quaternion.slerp(new THREE.Quaternion(), 2.0 * delta);
    }


    const envConfigs = [
        {bg: 0x8cbce6, fog: 0x8cbce6, amb: 0xdcf2ff, dir: 0xfffaeb, ambI: 0.9, dirI: 2.5, starOp: 0}, // Day (Brighter sunlight)
        {bg: 0xffa07a, fog: 0xffa07a, amb: 0xffdab9, dir: 0xff8c00, ambI: 1.1, dirI: 3.2, starOp: 0.2}, // Dusk (Vibrant & glaring)
        {bg: 0x4a4a70, fog: 0x4a4a70, amb: 0x8888aa, dir: 0xffc099, ambI: 0.8, dirI: 1.8, starOp: 1.0}, // Twilight
    ];

    let lastFpsTime = performance.now();
    let framesThisSecond = 0;

    function animate() {
        requestAnimationFrame(animate);
        let dt = Math.min(clock.getDelta(), 0.1);
        const time = clock.getElapsedTime();
        
        if (princessMixer && currentCharacter === 'princess') {
            princessMixer.update(dt);
        }
        
        waterUniforms.uTime.value = time;
        
        currentFrame++;
        framesThisSecond++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            document.getElementById('fps-counter').innerText = framesThisSecond + ' FPS';
            framesThisSecond = 0;
            lastFpsTime = now;
        }

        const currentGroundY = getMeshHeight(playerGrp.position.x, playerGrp.position.z);
        const isOcean = Math.max(0, 1.0 - (currentGroundY / 5.0)); // 1.0 over ocean/beach, 0.0 over high ground
        
        // 3-Stage Lighting Engine Lerp
        const target = envConfigs[timePhase];
        scene.background.lerp(new THREE.Color(target.bg), dt * 2);
        scene.fog.color.lerp(new THREE.Color(target.fog), dt * 2);
        
        // Distance fog — must hide terrain edges at ±2000 units from center
        const fogAltitude = Math.max(0, playerGrp.position.y);
        
        // Decrease Far and Near to dramatically thicken fog and hide terrain edge popping better
        const dynamicFar = 1000 + fogAltitude * 0.3;
        const dynamicNear = 10 + fogAltitude * 0.15;
        
        scene.fog.far += (dynamicFar - scene.fog.far) * dt * 2.0;
        scene.fog.near += (dynamicNear - scene.fog.near) * dt * 2.0;
        
        // Pin background elements to player (Removed super clouds)
        
        ambientLight.color.lerp(new THREE.Color(target.amb), dt * 2);
        ambientLight.intensity += (target.ambI - ambientLight.intensity) * dt * 2;
        dirLight.color.lerp(new THREE.Color(target.dir), dt * 2);
        dirLight.intensity += (target.dirI - dirLight.intensity) * dt * 2;
        starMaterial.opacity += (target.starOp - starMaterial.opacity) * dt * 2;



        if (isPhotoMode) {
            dt = 0;
            if (photoControls) {
                photoControls.update();
            }
            composer.render();
            return;
        }

        const isBraking = keys.space || touchState.brake;
        const isBoosting = keys.shift || touchState.boost;

        if (!isFlightPaused) {
            let oldY = playerGrp.position.y;

            const targetSpeed = isBraking ? 0.0 : (isBoosting ? 250.0 : 18.0); // Extreme super speed
            velocity += (targetSpeed - velocity) * dt * (isBraking ? 3.0 : (isBoosting ? 1.5 : 1.0));
            
            const inputState = {
                forward: true,
                up: keys.w || touchState.y < -0.1,
                down: keys.s || touchState.y > 0.1,
                left: keys.a || touchState.x < -0.1,
                right: keys.d || touchState.x > 0.1
            };
            tickMovement(dt, inputState, playerGrp, velocity);

            playerGrp.position.y = Math.min(Math.max(playerGrp.position.y, 18), 600);
            cameraBase.position.lerp(playerGrp.position, dt * 7.0); // Re-sync camera position
        }
        
        // --- Camera Collision Prevention ---
        // --- Camera Collision Prevention & Zoom ---
        const idealCamPos = new THREE.Vector3();
        camera.getWorldPosition(idealCamPos);
        const playerPos = playerGrp.position.clone();
        const dirToCam = new THREE.Vector3().subVectors(idealCamPos, playerPos);
        const distToCam = dirToCam.length();
        dirToCam.normalize();
        
        const defaultCamDist = cameraZoomDist;
        const defaultCamHeight = cameraZoomDist * 0.33;
        
        // Smoothly lerp camera to default distance
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, defaultCamDist, dt * 5.0);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, defaultCamHeight, dt * 5.0);
        // -----------------------------------
        
        starField.position.copy(playerGrp.position); // Track player to create infinite distance illusion
        const groundY = getMeshHeight(playerGrp.position.x, playerGrp.position.z);
        const targetMinY = groundY + 55; // Keep above trees and terrain
        if (playerGrp.position.y < targetMinY) {
        const depth = targetMinY - playerGrp.position.y;
        const swoopPitch = Math.min(Math.PI / 4, depth / 40.0);
        currentPitch = THREE.MathUtils.lerp(currentPitch, swoopPitch, dt * 3.0);
        playerGrp.rotation.set(currentPitch, currentYaw, 0, 'YXZ');
        
        if (playerGrp.position.y < groundY + 15) {
            playerGrp.position.y += (groundY + 15 - playerGrp.position.y) * dt * 5.0;
        }
        }
        
        playerGrp.position.y = Math.min(Math.max(playerGrp.position.y, 18), 600);
        cameraBase.position.lerp(playerGrp.position, dt * 7.0); // Re-sync camera position
        starField.position.copy(playerGrp.position); // Track player to create infinite distance illusion

        // Visual bank and yaw when turning to see her side
        // const extraBank = (turnVelocity / maxTurnSpeed) * (Math.PI / 3); 
        // playerVisuals.rotation.z = THREE.MathUtils.lerp(playerVisuals.rotation.z, extraBank, dt * 5.0);
        
        // const extraYaw = (turnVelocity / maxTurnSpeed) * (Math.PI / 6);
        // playerVisuals.rotation.y = THREE.MathUtils.lerp(playerVisuals.rotation.y, extraYaw, dt * 5.0);
        
        // Remove extra pitch to prevent double-rotation
        playerVisuals.rotation.x = THREE.MathUtils.lerp(playerVisuals.rotation.x, 0, dt * 5.0);

        updateTerrainGeometry(playerGrp.position.x, playerGrp.position.z);
        waterMesh.position.x = playerGrp.position.x;
        waterMesh.position.z = playerGrp.position.z;

        camera.fov = THREE.MathUtils.lerp(camera.fov, isBoosting ? BASE_FOV + 35 : BASE_FOV, dt * 5.0);
        if (!isPhotoMode) {
            camera.up.set(0, 1, 0);
            camera.rotation.z = 0;
        }
        camera.updateProjectionMatrix();

        // Place the sun incredibly far away and low on the horizon for a permanent sunset glare effect!
        const toSun = staticSun.position.clone().sub(playerGrp.position).normalize();
        dirLight.position.copy(playerGrp.position).add(toSun.multiplyScalar(2000));
        dirLight.target.position.copy(playerGrp.position);
        dirLight.target.updateMatrixWorld();
        
        const altitude = Math.max(0, playerGrp.position.y - groundY);

        // Dynamically adjust shadow map resolution based on altitude
        const shadowSize = THREE.MathUtils.lerp(120, 250, Math.min(1, altitude / 150.0));
        dirLight.shadow.camera.left = -shadowSize;
        dirLight.shadow.camera.right = shadowSize;
        dirLight.shadow.camera.top = shadowSize;
        dirLight.shadow.camera.bottom = -shadowSize;
        dirLight.shadow.camera.updateProjectionMatrix();

        updateInstances(playerGrp.position.x, playerGrp.position.z, time, dt, currentYaw);
        updateBirds(playerGrp.position.x, playerGrp.position.y, playerGrp.position.z, time, dt);
        updateFish(playerGrp.position.x, playerGrp.position.y, playerGrp.position.z, time, dt);
        
        if (isWindTrailsOn && isBoosting) {
            instTrails.visible = true;
            for (let i = 0; i < 100; i++) {
                let z = trailsData[i*4+2];
                z += velocity * 3.0 * dt; 
                if (z > 50) {
                     z -= 100;
                     trailsData[i*4] = (Math.random() - 0.5) * 80;
                     trailsData[i*4+1] = (Math.random() - 0.5) * 60;
                }
                trailsData[i*4+2] = z;
                
                dummy.position.set(trailsData[i*4], trailsData[i*4+1], z);
                dummy.position.x += Math.sin(time * 3.0 + trailsData[i*4+3] * 10) * 0.5;
                dummy.position.y += Math.cos(time * 3.0 + trailsData[i*4+3] * 10) * 0.5;
                dummy.scale.setScalar(1.0);
                dummy.rotation.set(0,0,0);
                dummy.updateMatrix();
                instTrails.setMatrixAt(i, dummy.matrix);
            }
            instTrails.position.copy(playerGrp.position);
            instTrails.rotation.copy(playerGrp.rotation);
            instTrails.instanceMatrix.needsUpdate = true;
        } else {
            instTrails.visible = false;
        }

        if (audioCtx && audioCtx.state === 'running' && windGain && windFilter) {
            if (!isWindOn) {
                windGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
            } else {
                const speedFactor = Math.max(0, Math.min(1, (velocity - 15) / 30)); 
                const targetVolume = 0.2 + speedFactor * 0.35;
                windGain.gain.setTargetAtTime(targetVolume, audioCtx.currentTime, 0.1);
                
                const targetFreq = 400 + Math.sin(time) * 100 + speedFactor * 800; 
                windFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
            }
        }

        // Deep clouds track player (Removed)

        // Flocking Birds AI
        flockTimer -= dt;
        if (flockState === 'IDLE') {
            flockTarget.set(playerGrp.position.x + Math.sin(time*0.1)*500, playerGrp.position.y + 200, playerGrp.position.z + Math.cos(time*0.1)*500);
            if (flockTimer <= 0) { flockState = 'APPROACH'; flockTimer = 5 + Math.random() * 5; }
        } else if (flockState === 'APPROACH') {
            const rightOffset = new THREE.Vector3(5, 2, 0).applyQuaternion(playerGrp.quaternion);
            flockTarget.copy(playerGrp.position).add(rightOffset);
            if (flockTimer <= 0) { flockState = 'FOLLOW'; flockTimer = 180 + Math.random() * 120; }
        } else if (flockState === 'FOLLOW') {
            const rightOffset = new THREE.Vector3(8, 3, -3).applyQuaternion(playerGrp.quaternion);
            flockTarget.copy(playerGrp.position).add(rightOffset);
            if (flockTimer <= 0) { flockState = 'LEAVE'; flockTimer = 20 + Math.random() * 20; }
        } else if (flockState === 'LEAVE') {
            flockTarget.set(playerGrp.position.x + Math.sin(time*0.1)*2000, playerGrp.position.y + 500, playerGrp.position.z + Math.cos(time*0.1)*2000);
            if (flockTimer <= 0) { flockState = 'IDLE'; flockTimer = 10 + Math.random() * 20; }
        }
        
        flockGrp.position.lerp(flockTarget, dt * (flockState === 'FOLLOW' ? 2.0 : 0.5));
        const dir = flockTarget.clone().sub(flockGrp.position).normalize();
        if (dir.length() > 0.1) {
            const targetRot = Math.atan2(dir.x, dir.z);
            let dr = targetRot - flockGrp.rotation.y;
            while(dr > Math.PI) dr -= Math.PI*2;
            while(dr < -Math.PI) dr += Math.PI*2;
            flockGrp.rotation.y += dr * dt * 2.0;
            flockGrp.rotation.x = THREE.MathUtils.lerp(flockGrp.rotation.x, dir.y * 0.5, dt * 2.0);
        }

        birds.forEach(bird => {
            bird.position.lerp(bird.userData.offset, dt);
            const flapSpeed = (flockState === 'FOLLOW') ? 8 : 4;
            const flap = Math.sin(time * flapSpeed + bird.userData.phase);
            bird.userData.wingL.rotation.z = flap * 0.5;
            bird.userData.wingR.rotation.z = flap * 0.5;
        });

        // Giant Parallel Whale — close enough to feel cinematic
        // Whale flies freely on its own massive circular path
        whalePod.translateZ(30 * dt); // Move forward
        whalePod.rotateY(0.04 * dt); // Slow gentle turn to keep it orbiting the islands
        
        // Organic vertical bob
        whalePod.position.y += Math.sin(time * 0.5) * 5 * dt;
        
        // Pitch slightly with the bob
        whalePod.rotateX(Math.cos(time * 0.5) * 0.05 * dt);

        skyWhales.forEach(w => {
            if (w.mat.userData.shader) {
                w.mat.userData.shader.uniforms.uTime.value = time * 0.5 + w.phase;
            }
        });

        composer.render();
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
    });

    let timePhase = 0; // 0: Day, 1: Dusk, 2: Deep Twilight
    
    // ... lighting targets for lerping
    const envTargets = {
        bg: new THREE.Color(),
        fog: new THREE.Color(),
        amb: new THREE.Color(),
        dir: new THREE.Color(),
    };
    
    const timeToggleBtn = document.getElementById('time-toggle');
    if (timeToggleBtn) {
        timeToggleBtn.addEventListener('click', () => {
            timePhase = (timePhase + 1) % 3;
            if (timePhase === 0) timeToggleBtn.innerText = 'Switch to Dusk';
            else if (timePhase === 1) timeToggleBtn.innerText = 'Switch to Twilight';
            else timeToggleBtn.innerText = 'Switch to Day';
        });
    }


    // ==========================================
    // 9. AUDIO (WIND SOUNDSCAPE)
    // ==========================================
    let audioCtx;
    let windGain, windFilter;

    function initAudio() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        audioCtx = new AudioContext();
        
        const bufferSize = audioCtx.sampleRate * 2; 
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; 
        }
        
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        
        windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 400; 
        
        windGain = audioCtx.createGain();
        windGain.gain.value = 0;
        
        noiseSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(audioCtx.destination);
        
        noiseSource.start();
    }

    // ==========================================
    // 10. PROCEDURAL AMBIENT MUSIC
    // ==========================================
    let musicGain, reverbNode;
    let isMusicPlaying = false;
    let currentTrack = 0;
    let nextNoteTime = 0;
    let musicTimerID;
    
    let chordIndex = 0;
    let sequenceTime = 0;
    let arpIndex = 0;

    const tracks = [
        { 
            name: "Spirited Winds", 
            chords: [
                [174.61, 220.00, 261.63, 329.63], // Fmaj7
                [196.00, 246.94, 293.66, 349.23], // G7
                [164.81, 196.00, 246.94, 293.66], // Em7
                [220.00, 261.63, 329.63, 392.00]  // Am7
            ],
            speed: 2400, 
            stepSpeed: 300,
            padOsc: 'triangle',
            leadOsc: 'sine'
        },
        { 
            name: "Summer Clouds", 
            chords: [
                [261.63, 329.63, 392.00, 493.88], // Cmaj7
                [196.00, 246.94, 293.66, 392.00], // G
                [220.00, 261.63, 329.63, 392.00], // Am7
                [174.61, 220.00, 261.63, 329.63]  // Fmaj7
            ],
            speed: 3200, 
            stepSpeed: 400,
            padOsc: 'sawtooth',
            leadOsc: 'triangle'
        },
        { 
            name: "Evening Whispers", 
            chords: [
                [220.00, 261.63, 329.63, 493.88], // Am9
                [174.61, 220.00, 261.63, 392.00], // Fmaj9
                [261.63, 329.63, 392.00, 493.88], // Cmaj7
                [164.81, 207.65, 246.94, 293.66]  // E7
            ],
            speed: 2800, 
            stepSpeed: 350,
            padOsc: 'sine',
            leadOsc: 'sine'
        },
        { 
            name: "Wandering Spirits", 
            chords: [
                [261.63, 329.63, 392.00, 523.25], // C
                [174.61, 220.00, 261.63, 349.23], // F
                [196.00, 246.94, 293.66, 392.00], // G
                [220.00, 261.63, 329.63, 440.00]  // Am
            ],
            speed: 2000, 
            stepSpeed: 250,
            padOsc: 'triangle',
            leadOsc: 'triangle'
        },
        { 
            name: "Star Ocean", 
            chords: [
                [293.66, 369.99, 440.00, 554.37], // Dmaj7
                [220.00, 277.18, 329.63, 415.30], // Amaj7
                [246.94, 293.66, 369.99, 440.00], // Bm7
                [196.00, 246.94, 293.66, 369.99]  // Gmaj7
            ],
            speed: 4000, 
            stepSpeed: 500,
            padOsc: 'sine',
            leadOsc: 'triangle'
        },
        { 
            name: "Floating Islands", 
            chords: [
                [207.65, 261.63, 311.13, 392.00], // Abmaj7
                [233.08, 293.66, 349.23, 440.00], // Bbmaj7
                [261.63, 329.63, 392.00, 493.88], // Cmaj7
                [261.63, 329.63, 392.00, 493.88]  // Cmaj7 (held)
            ],
            speed: 4500, 
            stepSpeed: 500,
            padOsc: 'triangle',
            leadOsc: 'sine'
        },
        { 
            name: "Mystic Journey", 
            chords: [
                [196.00, 233.08, 293.66, 349.23], // Gm7
                [174.61, 220.00, 261.63, 329.63], // Fmaj7
                [155.56, 196.00, 233.08, 293.66], // Ebmaj7
                [146.83, 185.00, 220.00, 293.66]  // D7
            ],
            speed: 3600, 
            stepSpeed: 450,
            padOsc: 'sine',
            leadOsc: 'triangle'
        },
        { 
            name: "Gentle Breeze", 
            chords: [
                [329.63, 415.30, 493.88, 622.25], // Emaj7
                [277.18, 349.23, 415.30, 554.37], // Dbmaj7
                [246.94, 311.13, 369.99, 493.88], // Bmaj7
                [220.00, 277.18, 329.63, 440.00]  // Amaj7
            ],
            speed: 3000, 
            stepSpeed: 300,
            padOsc: 'sine',
            leadOsc: 'sine'
        }
    ];

    const arpPatterns = [
        [0, 1, 2, 3, 2, 1],
        [0, 2, 1, 3, 2, 3],
        [0, 1, 2, 1],
        [1, 2, 3, 2]
    ];

    function createReverb() {
        const length = audioCtx.sampleRate * 4; 
        const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
        for (let i = 0; i < 2; i++) {
            const channel = impulse.getChannelData(i);
            for (let j = 0; j < length; j++) {
                channel[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 3);
            }
        }
        const convolver = audioCtx.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }

    function playNote(freq, time, duration, oscType, isPad = false) {
        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc.type = oscType;
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        
        if (isPad) {
            filter.frequency.value = 600;
            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(0.04, time + duration * 0.4);
            env.gain.linearRampToValueAtTime(0.001, time + duration);
        } else {
            filter.frequency.setValueAtTime(1200, time);
            filter.frequency.exponentialRampToValueAtTime(400, time + duration);
            env.gain.setValueAtTime(0, time);
            env.gain.linearRampToValueAtTime(0.1, time + 0.05); // Quick attack
            env.gain.exponentialRampToValueAtTime(0.001, time + duration);
        }
        
        osc.connect(filter);
        filter.connect(env);
        env.connect(musicGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }

    function scheduleNotes() {
        if (!isMusicPlaying || !audioCtx) return;
        const track = tracks[currentTrack];
        
        // Prevent massive scheduling clump if tab was inactive
        if (nextNoteTime < audioCtx.currentTime - 0.5) {
            nextNoteTime = audioCtx.currentTime + 0.1;
        }
        
        while (nextNoteTime < audioCtx.currentTime + 0.2) {
            
            // On chord change
            if (sequenceTime % track.speed === 0) {
                const chord = track.chords[chordIndex % track.chords.length];
                
                // Play pad for the chord
                chord.forEach(freq => {
                    playNote(freq / 2, nextNoteTime, track.speed / 1000 * 1.5, track.padOsc, true);
                });
            }
            
            const chord = track.chords[chordIndex % track.chords.length];
            const pattern = arpPatterns[chordIndex % arpPatterns.length];
            
            // Music box arpeggio step
            if (sequenceTime % track.stepSpeed === 0) {
                const arpFreq = chord[pattern[arpIndex % pattern.length]] * 2; // Up one octave
                playNote(arpFreq, nextNoteTime, track.stepSpeed / 1000 * 2.0, track.leadOsc, false);
                arpIndex++;
                
                // Occasional slow melody note
                if (Math.random() > 0.7) {
                    const melFreq = chord[Math.floor(Math.random() * chord.length)] * 4; // Up two octaves
                    playNote(melFreq, nextNoteTime, track.speed / 1000 * 0.8, track.leadOsc, false);
                }
            }
            
            // Timing
            nextNoteTime += track.stepSpeed / 1000;
            sequenceTime += track.stepSpeed;
            
            if (sequenceTime >= track.speed) {
                sequenceTime = 0;
                chordIndex++;
                arpIndex = 0;
            }
        }
        musicTimerID = setTimeout(scheduleNotes, 50);
    }

    document.getElementById('music-toggle').addEventListener('click', () => {
        initAudio(); 
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        if (!musicGain) {
            musicGain = audioCtx.createGain();
            musicGain.gain.value = 0.5;
            reverbNode = createReverb();
            musicGain.connect(reverbNode);
            reverbNode.connect(audioCtx.destination);
            musicGain.connect(audioCtx.destination);
        }

        isMusicPlaying = !isMusicPlaying;
        const trackBtn = document.getElementById('track-toggle');
        if (isMusicPlaying) {
            sequenceTime = 0;
            chordIndex = 0;
            arpIndex = 0;
            nextNoteTime = audioCtx.currentTime + 0.1;
            scheduleNotes();
            document.getElementById('music-toggle').innerText = "⏸ Music";
            trackBtn.style.display = "block";
        } else {
            clearTimeout(musicTimerID);
            document.getElementById('music-toggle').innerText = "▶ Music";
            trackBtn.style.display = "none";
        }
    });

    document.getElementById('track-toggle').addEventListener('click', () => {
        currentTrack = (currentTrack + 1) % tracks.length;
        document.getElementById('track-toggle').innerText = "Track: " + tracks[currentTrack].name;
        
        sequenceTime = 0;
        chordIndex = 0;
        arpIndex = 0;
        nextNoteTime = audioCtx.currentTime + 0.1;
    });

    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });

    // Pre-warm the world so it is fully populated instantly on load
    updateTerrainGeometry(playerGrp.position.x, playerGrp.position.z);
    isPrewarming = true;
    for (let pre = 0; pre < 10; pre++) {
        currentFrame = pre;
        logicTimer = 1.0; // Force shouldUpdateTerrain = true
        updateInstances(playerGrp.position.x, playerGrp.position.z, 0, 1.0 / 60.0, 0);
    }
    isPrewarming = false;
    currentFrame = 0;
    logicTimer = 0;

    animate();
  