const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Fix the tree position (it was wrongly set to float)
// The trees should be at h.
code = code.replace(/dummy\.position\.set\(nx, h \+ 150 \+ Math\.random\(\) \* 200, nz\);/, 'dummy.position.set(nx, h, nz);');

// 2. Fix the rock position (it should be floating)
// Let's find the exact rock loop and replace it.
const rockLoopRegex = /(\/\/ Rocks[\s\S]*?dummy\.position\.set\(nx, )(h)(, nz\);[\s\S]*?dummy\.scale\.set\(15\.0 \+ Math\.random\(\) \* 30\.0, 10\.0 \+ Math\.random\(\) \* 20\.0, 15\.0 \+ Math\.random\(\) \* 30\.0\);)/;
code = code.replace(rockLoopRegex, '$1h + 150 + Math.random() * 200$3');

// 3. Mix trees and mushrooms
// The original geoTree1, geoTree2, geoTree3, geoTree4 were replaced by mushrooms.
// I will keep geoTree1 and geoTree2 as mushrooms, but restore geoTree3 and geoTree4 to pine trees!
// Let's look for the mushroomGen in magic.html.
const pineGen = `
    const t3Geos = [];
    const t3Trunk = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 5);
    t3Trunk.translate(0, 1.75, 0);
    applyColor(t3Trunk, 0x111122);
    t3Geos.push(t3Trunk);
    const cone31 = new THREE.ConeGeometry(2.0, 3, 5);
    cone31.translate(0, 3, 0); applyColor(cone31, 0x00ffff); t3Geos.push(cone31);
    const geoTree3 = BufferGeometryUtils.mergeGeometries(t3Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree3.scale(2.5, 2.5, 2.5);

    const t4Geos = [];
    const t4Trunk = new THREE.CylinderGeometry(0.3, 0.6, 3.0, 5);
    t4Trunk.translate(0, 1.5, 0);
    applyColor(t4Trunk, 0x221133);
    t4Geos.push(t4Trunk);
    const cone41 = new THREE.ConeGeometry(1.8, 2.5, 5);
    cone41.translate(0, 2.8, 0); applyColor(cone41, 0xff00ff); t4Geos.push(cone41);
    const cone42 = new THREE.ConeGeometry(1.5, 2.5, 5);
    cone42.translate(0, 4.0, 0); applyColor(cone42, 0xff00ff); t4Geos.push(cone42);
    const geoTree4 = BufferGeometryUtils.mergeGeometries(t4Geos.map(g => g.index ? g.toNonIndexed() : g), false);
    geoTree4.scale(2.5, 2.5, 2.5);
`;
code = code.replace(/const geoTree3 = createMushroom\(0x111122, 0xffffff, 0\.8, 2\.5\);/, '');
code = code.replace(/const geoTree4 = createMushroom\(0x442255, 0x00ff88, 1\.2, 3\.5\);/, pineGen);

// 4. Make water transparent AND an opaque glowing liquid
// How? We can make the MeshStandardMaterial of the water transparent:true, opacity: 0.6.
// BUT we also add a second layer!
// "both" -> transparent water with glowing opaque liquid underneath? 
// Or transparent shallow water, but deep water is glowing opaque?
// We can use the shader to make depth affect opacity.
// The waterMaterial has onBeforeCompile:
const waterMaterialUpdate = `
    const waterMat = new THREE.MeshStandardMaterial({ 
        color: 0xff66b2, 
        roughness: 0.1, 
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
`;
code = code.replace(/const waterMat = new THREE\.MeshStandardMaterial\(\{[\s\S]*?\}\);/, waterMaterialUpdate);

fs.writeFileSync('magic.html', code);
console.log("Fixed magic.html");
