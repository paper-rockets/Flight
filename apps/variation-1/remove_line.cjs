const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
let lines = code.split('\n');
let filtered = lines.filter(l => !l.includes('updateBirds('));
fs.writeFileSync('index.html', filtered.join('\n'));

