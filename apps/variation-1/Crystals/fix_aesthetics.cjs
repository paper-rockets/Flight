const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Lower Mountains
// Find: let spireY = (spireNoise > 0.5) ? (spireNoise - 0.5) * 400.0 - 5.0 : spireNoise * 10.0 - 5.0;
// Replace with: let spireY = (spireNoise > 0.5) ? (spireNoise - 0.5) * 100.0 - 5.0 : spireNoise * 10.0 - 5.0;
code = code.replace(/let spireY = \(spireNoise > 0\.5\) \? \(spireNoise - 0\.5\) \* 400\.0 - 5\.0 : spireNoise \* 10\.0 - 5\.0;/, 'let spireY = (spireNoise > 0.5) ? (spireNoise - 0.5) * 100.0 - 5.0 : spireNoise * 10.0 - 5.0;');

// 2. Improve Mushrooms (Low poly caps, softer colors)
// Replace the mushroom generator
const newMushroomGen = `
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
`;
code = code.replace(/const createMushroom = \([\s\S]*?const geoTree2 = createMushroom\(0x2e1114, 0xffb6c1, 1\.5, 4\.5\);|const createMushroom = \([\s\S]*?const geoTree2 = createMushroom\(0x221133, 0xff00ff, 1\.5, 4\.5\);/, newMushroomGen);

// 3. Improve Pine Trees (Softer colors)
code = code.replace(/applyColor\(cone31, 0x00ffff\);/, 'applyColor(cone31, 0x7fffd4);'); // Aquamarine
code = code.replace(/applyColor\(cone41, 0xff00ff\);/g, 'applyColor(cone41, 0xdda0dd);'); // Plum/Soft Purple
code = code.replace(/applyColor\(cone42, 0xff00ff\);/g, 'applyColor(cone42, 0xdda0dd);');

// 4. Floating Rocks (Reduce scale slightly, adjust position)
code = code.replace(/dummy\.scale\.set\(15\.0 \+ Math\.random\(\) \* 30\.0, 10\.0 \+ Math\.random\(\) \* 20\.0, 15\.0 \+ Math\.random\(\) \* 30\.0\);/, 'dummy.scale.set(8.0 + Math.random() * 15.0, 5.0 + Math.random() * 10.0, 8.0 + Math.random() * 15.0);');
code = code.replace(/dummy\.position\.set\(nx, h \+ 150 \+ Math\.random\(\) \* 200, nz\);/, 'dummy.position.set(nx, h + 80 + Math.random() * 150, nz);'); // Lower the islands a bit so they are more visible above the player


fs.writeFileSync('magic.html', code);
console.log("Fixed aesthetics in magic.html");
