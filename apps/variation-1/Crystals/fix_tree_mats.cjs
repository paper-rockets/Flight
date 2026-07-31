const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

const oldMatRegex = /const matTree = new THREE\.MeshToonMaterial\(\{ vertexColors: true, gradientMap, dithering: true \}\);/;
const newMats = `
    const matTree = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap, dithering: true });
    const matGlow = new THREE.MeshBasicMaterial({ vertexColors: true });
    const treeMaterials = [matTree, matGlow];
`;

code = code.replace(oldMatRegex, newMats);
fs.writeFileSync('magic.html', code);
console.log("Fixed treeMaterials definition in magic.html");
