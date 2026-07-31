const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

// 1. Update JS Terrain Height
const jsTerrainRegex = /function terrainHeightJS\(x, z\) \{[\s\S]*?return y;\n    \}/;
const newJSTerrain = `function terrainHeightJS(x, z) {
        let y = snoise(x * 0.002, z * 0.002) * 5.0 + 3.0; 
        y += snoise(x * 0.01, z * 0.01) * 3.0; 
        y += Math.abs(snoise(x * 0.05, z * 0.05)) * 1.5;
        let hillNoise = snoise(x * 0.001, z * 0.001);
        if (hillNoise > 0.5) {
            y += (hillNoise - 0.5) * 20.0;
        }
        return y;
    }`;
code = code.replace(jsTerrainRegex, newJSTerrain);

// 2. Update Shader Terrain Height
const shaderTerrainRegex = /float getTerrainHeight\(float x, float z\) \{[\s\S]*?return y;\n             \}/;
const newShaderTerrain = `float getTerrainHeight(float x, float z) {
                 float y = snoise(vec2(x * 0.002, z * 0.002)) * 5.0 + 3.0;
                 y += snoise(vec2(x * 0.01, z * 0.01)) * 3.0;
                 y += abs(snoise(vec2(x * 0.05, z * 0.05))) * 1.5;
                 float hillNoise = snoise(vec2(x * 0.001, z * 0.001));
                 if (hillNoise > 0.5) {
                     y += (hillNoise - 0.5) * 20.0;
                 }
                 return y;
             }`;
code = code.replace(shaderTerrainRegex, newShaderTerrain);

// 3. Fix Tree and Nature Spawn Heights
code = code.replace(/if \(!isClearing && h > 3\.5 && h < 45/g, 'if (!isClearing && h > 2.5 && h < 45');
code = code.replace(/if \(h > 0\.0 && getPathStrength\(nx, nz\) < 0\.1\)/g, 'if (h > 2.6 && getPathStrength(nx, nz) < 0.1)');

// 4. Change Clouds to small glowing crystals
const cloudRegex = /const geoCloud = new THREE\.IcosahedronGeometry\(25, 2\);[\s\S]*?geoCloud\.computeVertexNormals\(\);/;
const newCloud = `const geoCloud = new THREE.OctahedronGeometry(5, 0);
    geoCloud.scale(1.0, 3.0, 1.0); 
    const ccolors = [];
    for (let i = 0; i < geoCloud.attributes.position.count; i++) {
        const color = new THREE.Color();
        color.setHSL(Math.random(), 1.0, 0.5); // Random vibrant colors
        ccolors.push(color.r, color.g, color.b);
    }
    geoCloud.setAttribute('color', new THREE.Float32BufferAttribute(ccolors, 3));
    geoCloud.computeVertexNormals();`;
code = code.replace(cloudRegex, newCloud);

code = code.replace(/const instClouds = new THREE\.InstancedMesh\(geoCloud, matCloud, CLOUD_COUNT\);/, 'const instClouds = new THREE.InstancedMesh(geoCloud, matGlow, CLOUD_COUNT);');

// 5. Shrink cloud scale in update loop
code = code.replace(/dummy\.scale\.set\(1\.5 \+ Math\.random\(\) \* 2\.0, 0\.8 \+ Math\.random\(\) \* 1\.0, 1\.5 \+ Math\.random\(\) \* 2\.0\);/g, 'dummy.scale.set(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5);');

fs.writeFileSync('magic.html', code);
console.log("Patched terrain and crystals.");
