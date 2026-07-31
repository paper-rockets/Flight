const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Remove procedural bush geometry and instances
code = code.replace(/const geoBush = new THREE\.IcosahedronGeometry\(2, 0\);/g, '');
code = code.replace(/const matBush = new THREE\.MeshStandardMaterial\(\{[\s\S]*?\}\);/g, '');
code = code.replace(/const instBushes = new THREE\.InstancedMesh\(geoBush, matBush, BUSH_COUNT\);/g, '');
code = code.replace(/instBushes,/g, '');

// 2. Add nature cluster logic
const natureSetup = `
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
`;

// Insert the setup before the animate loop
code = code.replace(/\/\/ ==========================================\s*\/\/ 8\. INPUTS/g, natureSetup + "\n\n    // ==========================================\n    // 8. INPUTS");

// 3. Replace bush update loop with nature update loop
const natureUpdate = `
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
                                if (h > 0.0 && getPathStrength(nx, nz) < 0.1) {
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
`;

// Replace the bush loop. The bush loop starts with `// Bushes` and ends before `// Flowers`
const bushRegex = /\/\/ Bushes[\s\S]*?(?=\/\/ Flowers)/;
code = code.replace(bushRegex, natureUpdate + "\n\n        ");

fs.writeFileSync('magic.html', code);
console.log("Patched magic.html with Nature clusters");
