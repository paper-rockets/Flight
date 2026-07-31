const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Replace the entire createMushroom and tree definitions (lines ~600-683)
const newFloraCode = `
    function createWeepingLumen(stemColor, capColor, lightColor, size, height) {
        const solidGeos = [];
        const glowGeos = [];
        
        const stem = new THREE.CylinderGeometry(0.3 * size, 0.5 * size, height, 5);
        stem.translate(0, height / 2, 0);
        applyColor(stem, stemColor);
        solidGeos.push(stem);
        
        const cap = new THREE.SphereGeometry(2.5 * size, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2);
        cap.translate(0, height - 0.2, 0);
        const pos = cap.attributes.position;
        for(let i=0; i<pos.count; i++) {
            if (pos.getY(i) > height) {
               pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.5 * size);
            }
        }
        applyColor(cap, capColor);
        solidGeos.push(cap);
        
        const numVines = 12;
        for (let i=0; i<numVines; i++) {
            const angle = (i / numVines) * Math.PI * 2;
            const radius = 2.2 * size;
            const vx = Math.cos(angle) * radius;
            const vz = Math.sin(angle) * radius;
            const vy = height - 0.2;
            
            const bulb = new THREE.SphereGeometry(0.15 * size, 4, 4);
            const dropLength = 0.5 + Math.random() * 2.0;
            bulb.translate(vx, vy - dropLength, vz);
            applyColor(bulb, lightColor);
            glowGeos.push(bulb);
            
            const vine = new THREE.CylinderGeometry(0.02, 0.02, dropLength, 3);
            vine.translate(vx, vy - dropLength / 2, vz);
            applyColor(vine, 0x111111);
            solidGeos.push(vine);
        }
        
        const geoSolid = BufferGeometryUtils.mergeGeometries(solidGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const geoGlow = BufferGeometryUtils.mergeGeometries(glowGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const merged = BufferGeometryUtils.mergeGeometries([geoSolid, geoGlow], true);
        merged.scale(2.5, 2.5, 2.5);
        return merged;
    }

    function createEtherealCanopy(stemColor, capColor, lightColor, size, height) {
        const solidGeos = [];
        const glowGeos = [];
        
        const stem = new THREE.CylinderGeometry(0.2 * size, 0.4 * size, height, 5, 3);
        const pos = stem.attributes.position;
        for(let i=0; i<pos.count; i++) {
            const y = pos.getY(i);
            const angle = y * 0.5;
            const x = pos.getX(i);
            const z = pos.getZ(i);
            pos.setX(i, x * Math.cos(angle) - z * Math.sin(angle) + Math.sin(y)*0.5);
            pos.setZ(i, x * Math.sin(angle) + z * Math.cos(angle));
        }
        stem.translate(0, height / 2, 0);
        applyColor(stem, stemColor);
        solidGeos.push(stem);
        
        const cap = new THREE.IcosahedronGeometry(2.0 * size, 0);
        cap.translate(0, height + 1.0, 0);
        applyColor(cap, capColor);
        solidGeos.push(cap);
        
        const numDots = 15;
        for(let i=0; i<numDots; i++) {
            const dot = new THREE.SphereGeometry(0.15 * size, 4, 4);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.0 * size + 0.1;
            dot.translate(r * Math.sin(phi) * Math.cos(theta), height + 1.0 + r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
            applyColor(dot, lightColor);
            glowGeos.push(dot);
        }
        
        const geoSolid = BufferGeometryUtils.mergeGeometries(solidGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const geoGlow = BufferGeometryUtils.mergeGeometries(glowGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const merged = BufferGeometryUtils.mergeGeometries([geoSolid, geoGlow], true);
        merged.scale(2.5, 2.5, 2.5);
        return merged;
    }

    function createGlowingLotus(petalColor, coreColor, size) {
        const solidGeos = [];
        const glowGeos = [];
        
        const numPetals = 8;
        for(let i=0; i<numPetals; i++) {
            const petal = new THREE.ConeGeometry(0.5 * size, 2.0 * size, 3);
            petal.rotateX(Math.PI / 2.5);
            petal.rotateY((i / numPetals) * Math.PI * 2);
            petal.translate(0, 0.2, 0);
            applyColor(petal, petalColor);
            solidGeos.push(petal);
        }
        
        const core = new THREE.IcosahedronGeometry(0.8 * size, 0);
        core.translate(0, 0.5 * size, 0);
        applyColor(core, coreColor);
        glowGeos.push(core);
        
        const geoSolid = BufferGeometryUtils.mergeGeometries(solidGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const geoGlow = BufferGeometryUtils.mergeGeometries(glowGeos.map(g => g.index ? g.toNonIndexed() : g), false);
        const merged = BufferGeometryUtils.mergeGeometries([geoSolid, geoGlow], true);
        merged.scale(2.5, 2.5, 2.5);
        return merged;
    }

    const geoTree1 = createWeepingLumen(0x2a1b3d, 0x111133, 0x00ffff, 1.2, 4.0); // Cyan weeping
    const geoTree2 = createEtherealCanopy(0x1a0f2e, 0x800080, 0xff1493, 1.5, 5.0); // Pink canopy
    const geoTree3 = createGlowingLotus(0x004040, 0x00ffcc, 1.5); // Teal lotus
    const geoTree4 = createWeepingLumen(0x2d1a29, 0x221144, 0xffa500, 1.0, 3.5); // Orange weeping
    
    // We can just define dummy geos for 5 and 6 since they are unused (count=0)
    const geoTree5 = new THREE.BoxGeometry(0,0,0);
    const geoTree6 = new THREE.BoxGeometry(0,0,0);
`;
const regexTreeGen = /const createMushroom = [\s\S]*?(?=\/\/ 6\. BUILDINGS)/;
code = code.replace(regexTreeGen, newFloraCode + "\n\n    ");

// 2. Multi-material instantiation
// Find: const matTree = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.1 });
// Replace with the material array
const matTreeRegex = /const matTree = new THREE\.MeshStandardMaterial\(\{ vertexColors: true, roughness: 0\.8, metalness: 0\.1 \}\);/;
const multiMatCode = `
    const matTree = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.0 });
    const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
    const treeMaterials = [matTree, matGlow];
`;
code = code.replace(matTreeRegex, multiMatCode);

// Find the instantiation lines
const instTreeRegex1 = /const instTree1 = new THREE\.InstancedMesh\(geoTree1, matTree, Math\.floor\(3600 \* TREE_MULT\)\);/;
const instTreeRegex2 = /const instTree2 = new THREE\.InstancedMesh\(geoTree2, matTree, Math\.floor\(3600 \* TREE_MULT\)\);/;
const instTreeRegex3 = /const instTree3 = new THREE\.InstancedMesh\(geoTree3, matTree, Math\.floor\(3600 \* TREE_MULT\)\);/;
const instTreeRegex4 = /const instTree4 = new THREE\.InstancedMesh\(geoTree4, matTree, Math\.floor\(2400 \* TREE_MULT\)\);/;
const instTreeRegex5 = /const instTree5 = new THREE\.InstancedMesh\(geoTree5, matTree, 0\);/;
const instTreeRegex6 = /const instTree6 = new THREE\.InstancedMesh\(geoTree6, matTree, 0\);/;

code = code.replace(instTreeRegex1, 'const instTree1 = new THREE.InstancedMesh(geoTree1, treeMaterials, Math.floor(3600 * TREE_MULT));');
code = code.replace(instTreeRegex2, 'const instTree2 = new THREE.InstancedMesh(geoTree2, treeMaterials, Math.floor(3600 * TREE_MULT));');
code = code.replace(instTreeRegex3, 'const instTree3 = new THREE.InstancedMesh(geoTree3, treeMaterials, Math.floor(3600 * TREE_MULT));');
code = code.replace(instTreeRegex4, 'const instTree4 = new THREE.InstancedMesh(geoTree4, treeMaterials, Math.floor(2400 * TREE_MULT));');
code = code.replace(instTreeRegex5, 'const instTree5 = new THREE.InstancedMesh(geoTree5, treeMaterials, 0);');
code = code.replace(instTreeRegex6, 'const instTree6 = new THREE.InstancedMesh(geoTree6, treeMaterials, 0);');


// 3. Darken the Environment presets for max contrast
code = code.replace(/'Twilight': \{ bg: 0x050011, fog: 0x110022, amb: 0x111133, dir: 0x222266, sunY: -200 \},/, "'Twilight': { bg: 0x020008, fog: 0x050011, amb: 0x08081a, dir: 0x111133, sunY: -200 },");
code = code.replace(/'Dusk': \{ bg: 0x0a001a, fog: 0x1a0033, amb: 0x151544, dir: 0x333377, sunY: -150 \}/, "'Dusk': { bg: 0x030008, fog: 0x0a001a, amb: 0x0a0a22, dir: 0x1a1a44, sunY: -150 }");

fs.writeFileSync('magic.html', code);
console.log("Rewrote flora in magic.html");
