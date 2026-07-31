const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const regex = /const (nx|cX) = playerX \+ \(Math\.random\(\) \- 0\.5\) \* ([a-zA-Z]+) \* (2\.0|2|4\.0|4);\s*const (nz|cZ) = playerZ \+ \(Math\.random\(\) \- 0\.5\) \* \2 \* \3;/g;

code = code.replace(regex, (match, vX, distVar, mult, vZ) => {
    return \let dx = (Math.random() - 0.5) * \ * \;
                    let dz = (Math.random() - 0.5) * \ * \;
                    if (!isPrewarming) {
                        if (Math.random() > 0.5) dx = Math.sign(dx) * (\ * (\/2) * 0.95) || (\ * (\/2) * 0.95);
                        else dz = Math.sign(dz) * (\ * (\/2) * 0.95) || (\ * (\/2) * 0.95);
                    }
                    const \ = playerX + dx;
                    const \ = playerZ + dz;\;
});

const regexInline = /dummy\.position\.set\(\s*playerX \+ \(Math\.random\(\) \- 0\.5\) \* ([a-zA-Z]+) \* (2\.0|2),\s*([^,]+),\s*playerZ \+ \(Math\.random\(\) \- 0\.5\) \* \1 \* \2\s*\);/g;

code = code.replace(regexInline, (match, distVar, mult, yExpr) => {
    return \let dx = (Math.random() - 0.5) * \ * \;
                let dz = (Math.random() - 0.5) * \ * \;
                if (!isPrewarming) {
                    if (Math.random() > 0.5) dx = Math.sign(dx) * (\ * (\/2) * 0.95) || (\ * (\/2) * 0.95);
                    else dz = Math.sign(dz) * (\ * (\/2) * 0.95) || (\ * (\/2) * 0.95);
                }
                dummy.position.set(
                    playerX + dx,
                    \,
                    playerZ + dz
                );\;
});

fs.writeFileSync('index.html', code);
