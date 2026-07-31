const fs = require('fs');
let code = fs.readFileSync('C:\\Users\\macie\\OneDrive\\Desktop\\KIKI FINAL 3\\magic.html', 'utf8');

// The error is Identifier 'h' has already been declared.
// Let's replace 'const h = ' with 'let h_tmp = ' in the whole file and fix usages.
// But we only want to fix the JS usages in the specific blocks.
// Actually, since all these `const h` and `let h` are local variables inside loops, 
// let's just do it manually with multi_replace_file_content.
