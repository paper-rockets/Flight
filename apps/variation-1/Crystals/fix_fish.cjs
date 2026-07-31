const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
let lines = code.split('\n');

// Find '    [...treeMeshes, instRocks, instBushes, instClouds, instFlowers, instHighClouds].forEach(mesh => {'
let s = lines.findIndex(l => l.includes('[...treeMeshes, instRocks'));
// Find '    ]);' which is the end of fVerts
let e = lines.findIndex((l, i) => i > s && l.includes('    ]);'));

if (s > -1 && e > -1) {
    let toInsert = [
        '    [...treeMeshes, instRocks, instBushes, instClouds, instFlowers, instHighClouds].forEach(mesh => {',
        '        for(let i=0; i<mesh.count; i++) {',
        '            mesh.setMatrixAt(i, dummyMatrix);',
        '        }',
        '        mesh.instanceMatrix.needsUpdate = true;',
        '    });',
        '',
        '    // ==========================================',
        '    // 6.25 AMBIENT SKY WHALE',
        '    // ==========================================',
        '    const skyWhales = [];',
        '    const whalePod = new THREE.Group();',
        '',
        '    // ==========================================',
        '    // FISH AND WHALE',
        '    // ==========================================',
        '    const FISH_COUNT = 50;',
        '    const geoFish = new THREE.BufferGeometry();',
        '    const fishScale = 0.4;',
        '    const fVerts = new Float32Array([',
        '        0, 0, 1.5*fishScale,',
        '        -1.0*fishScale, 0, -1.0*fishScale,',
        '        0, 0, -0.5*fishScale,',
        '        ',
        '        0, 0, 1.5*fishScale,',
        '        0, 0, -0.5*fishScale,',
        '        1.0*fishScale, 0, -1.0*fishScale,',
        '    ]);'
    ];
    lines.splice(s, e - s + 1, ...toInsert);
    fs.writeFileSync('index.html', lines.join('\n'));
    console.log('Fixed fish & whales');
} else {
    console.log('Indices not found:', s, e);
}

