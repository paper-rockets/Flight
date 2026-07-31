const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
let lines = code.split('\n');

// 730 is line 731 in editor
let startIdx = 730; 
let endIdx = 934; 

let toInsert = [
'    // ==========================================',
'    // 6. INSTANCED DIORAMA PROPS',
'    // ==========================================',
'    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);',
'    ',
'    const ROCK_COUNT = isMobile ? 120 : 800;',
'    const BUSH_COUNT = isMobile ? 72 : 216;',
'    const ANIMAL_COUNT = isMobile ? 25 : 50;',
'    const CLOUD_COUNT = 50;',
'    const FLOWER_COUNT = 0; // Removed flowers',
'    const TREE_MULT = isMobile ? 0.3 : 1.0;',
'    ',
'    function applyColor(geometry, colorHex) {',
'        const color = new THREE.Color(colorHex);',
'        const colors = [];',
'        const count = geometry.attributes.position.count;'
];

lines.splice(startIdx, endIdx - startIdx, ...toInsert);

fs.writeFileSync('index.html', lines.join('\n'));

