const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Colors
code = code.replace(/const colorDeepWater = new THREE\.Color\(0x1a4a8c\);/, 'const colorDeepWater = new THREE.Color(0x2d0a42);');
code = code.replace(/const colorShallowWater = new THREE\.Color\(0x4da9e8\);/, 'const colorShallowWater = new THREE.Color(0xff66b2);');
code = code.replace(/const colorSand = new THREE\.Color\(0xf2e1b8\);/, 'const colorSand = new THREE.Color(0xd8bfd8);');
code = code.replace(/const colorIslandGrass = new THREE\.Color\(0x76d149\);/, 'const colorIslandGrass = new THREE.Color(0x008080);');
code = code.replace(/const colorHigh = new THREE\.Color\(0x89e05e\);/, 'const colorHigh = new THREE.Color(0x00ffff);');
code = code.replace(/const colorIslandRock = new THREE\.Color\(0x8a725a\);/, 'const colorIslandRock = new THREE.Color(0x2a2a4a);');
code = code.replace(/const colorDirt = new THREE\.Color\(0xdcb58a\);/, 'const colorDirt = new THREE.Color(0x501b45);');
code = code.replace(/const colorPath = new THREE\.Color\(0xbd9973\);/, 'const colorPath = new THREE.Color(0x733d6b);');

// 2. Terrain Equation
const newTerrain = `
    function terrainHeightJS(x, z) {
        let biome = snoise(x * 0.0003, z * 0.0003); 
        let craterNoise = snoise(x * 0.002, z * 0.002);
        let craterY = Math.abs(craterNoise) * 20.0 - 15.0; 
        let spireNoise = snoise(x * 0.005, z * 0.005);
        let spireY = (spireNoise > 0.5) ? (spireNoise - 0.5) * 400.0 - 5.0 : spireNoise * 10.0 - 5.0;
        let landY = snoise(x * 0.003, z * 0.003) * 15.0; 
        landY += snoise(x * 0.015, z * 0.015) * 5.0;
        let fieldY = snoise(x * 0.003, z * 0.003) * 20.0 + 8.0; 
        fieldY += snoise(x * 0.015, z * 0.015) * 5.0;
        let y = 0;
        const msmooth = (e0, e1, v) => {
            let t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
            return t * t * (3 - 2 * t);
        };
        if (biome < -0.4) y = craterY;
        else if (biome < -0.2) y = craterY * (1 - msmooth(-0.4, -0.2, biome)) + spireY * msmooth(-0.4, -0.2, biome);
        else if (biome < 0.0) y = spireY;
        else if (biome < 0.2) y = spireY * (1 - msmooth(0.0, 0.2, biome)) + landY * msmooth(0.0, 0.2, biome);
        else if (biome < 0.6) y = landY;
        else if (biome < 0.8) y = landY * (1 - msmooth(0.6, 0.8, biome)) + fieldY * msmooth(0.6, 0.8, biome);
        else y = fieldY;
        return y;
    }
`;
code = code.replace(/function terrainHeightJS\(x, z\) \{[\s\S]*?return y;\r?\n    \}/, newTerrain.trim());

// 3. Giant Mushrooms instead of Trees
// We will replace the entire Tree 1-4 definitions.
const mushroomGen = `
    const createMushroom = (stemColor, capColor, size, height) => {
        const geos = [];
        const stem = new THREE.CylinderGeometry(0.3 * size, 0.5 * size, height, 6);
        stem.translate(0, height / 2, 0);
        applyColor(stem, stemColor);
        geos.push(stem);
        const cap = new THREE.SphereGeometry(2.5 * size, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        cap.translate(0, height, 0);
        applyColor(cap, capColor);
        geos.push(cap);
        const merged = BufferGeometryUtils.mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g), false);
        merged.scale(2.5, 2.5, 2.5);
        return merged;
    };
    const geoTree1 = createMushroom(0x331144, 0x00ffff, 1.0, 3.0);
    const geoTree2 = createMushroom(0x221133, 0xff00ff, 1.5, 4.5);
    const geoTree3 = createMushroom(0x111122, 0xffffff, 0.8, 2.5);
    const geoTree4 = createMushroom(0x442255, 0x00ff88, 1.2, 3.5);
`;
code = code.replace(/\/\/ Tree 1:[\s\S]*?(?=\/\/ Tree 5)/, mushroomGen);

// 4. Floating Islands
code = code.replace(/dummy\.scale\.set\(0\.7 \+ Math\.random\(\) \* 2\.0, 0\.5 \+ Math\.random\(\) \* 1\.5, 0\.7 \+ Math\.random\(\) \* 2\.0\);/, 'dummy.scale.set(15.0 + Math.random() * 30.0, 10.0 + Math.random() * 20.0, 15.0 + Math.random() * 30.0);');
code = code.replace(/dummy\.position\.set\(nx, h, nz\);/, 'dummy.position.set(nx, h + 150 + Math.random() * 200, nz);');

// 5. Env presets & Bloom
code = code.replace(/const envPresets = \{[\s\S]*?\}\};/, `const envPresets = {
        'Day': { bg: 0x110022, fog: 0x220033, amb: 0x222244, dir: 0x444488, sunY: -100 },
        'Twilight': { bg: 0x050011, fog: 0x110022, amb: 0x111133, dir: 0x222266, sunY: -200 },
        'Dusk': { bg: 0x0a001a, fog: 0x1a0033, amb: 0x151544, dir: 0x333377, sunY: -150 }
    };`);
code = code.replace(/\/\/ const bloomPass = new UnrealBloomPass/g, 'const bloomPass = new UnrealBloomPass');
code = code.replace(/\/\/ composer\.addPass\(bloomPass\)/g, 'composer.addPass(bloomPass)');
code = code.replace(/renderer\.render\(scene, camera\);/g, 'composer.render();');
// Ensure UnrealBloomPass is imported.
if (!code.includes('UnrealBloomPass')) {
    code = code.replace(/import \{ EffectComposer \}/, "import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';\n    import { EffectComposer }");
}

// 6. Flowers
code = code.replace(/const FLOWER_COUNT = 0;/, 'const FLOWER_COUNT = isMobile ? 100 : 300;');
code = code.replace(/const flowerColors = \[.*?\];/, 'const flowerColors = [0x00ffff, 0xff00ff, 0xffffff, 0x00ff88, 0x0000ff];');

// 7. Starfield always on
code = code.replace(/starField\.material\.opacity = THREE\.MathUtils\.lerp\(.*?dt\);/, 'starField.material.opacity = 1.0;');

fs.writeFileSync('magic.html', code);
console.log("Patched magic.html");
