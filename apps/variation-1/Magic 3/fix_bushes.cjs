const fs = require('fs');
let code = fs.readFileSync('magic.html', 'utf8');

code = code.replace(/if \(bushesUpdated\) instBushes\.instanceMatrix\.needsUpdate = true;/g, '');

fs.writeFileSync('magic.html', code);
console.log("Fixed bushesUpdated reference error");
