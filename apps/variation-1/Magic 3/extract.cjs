const fs = require('fs');
const code = fs.readFileSync('C:\\Users\\macie\\OneDrive\\Desktop\\KIKI FINAL 3\\magic.html', 'utf8');
const match = code.match(/<script type="module">([\s\S]*?)<\/script>/);
if (match) {
    fs.writeFileSync('C:\\Users\\macie\\OneDrive\\Desktop\\KIKI FINAL 3\\test.js', match[1]);
    console.log("Extracted JS");
}
