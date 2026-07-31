const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Companion Seagull Flock
let s1 = code.indexOf('    // Companion Seagull Flock');
let e1 = code.indexOf('    // Initialize all to hidden', s1);
if (s1 > -1 && e1 > -1) code = code.substring(0, s1) + code.substring(e1);
else console.log('Failed 1');

// 2. Boids (Birds)
let s2 = code.indexOf('    // ===================================================\n    // 6.5 BOIDS (BIRDS)');
let e2 = code.indexOf('    // ==========================================\n', s2 + 100);
if (s2 > -1 && e2 > -1) code = code.substring(0, s2) + code.substring(e2);
else console.log('Failed 2');

// 3. updateBirdsGen and updateBirds
let s3 = code.indexOf('    function updateBirdsGen(');
let e3 = code.indexOf('    const animalData = new Float32Array(ANIMAL_COUNT * 4);', s3);
if (s3 > -1 && e3 > -1) code = code.substring(0, s3) + code.substring(e3);
else console.log('Failed 3');

// 4. updateBirds call
let s4 = code.indexOf('        updateBirds(playerGrp.position.x, playerGrp.position.y, playerGrp.position.z, time, dt);\n');
if (s4 > -1) code = code.substring(0, s4) + code.substring(s4 + '        updateBirds(playerGrp.position.x, playerGrp.position.y, playerGrp.position.z, time, dt);\n'.length);
else console.log('Failed 4');

// 5. Flocking Birds AI
let s5 = code.indexOf('        // Flocking Birds AI');
let e5 = code.indexOf('        // Giant Parallel Whale', s5);
if (s5 > -1 && e5 > -1) code = code.substring(0, s5) + code.substring(e5);
else console.log('Failed 5');

fs.writeFileSync('index.html', code);
console.log('Done');

