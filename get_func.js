const fs = require('fs');
const content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');
const lines = content.split('\n');
let funcLines = [];
let found = false;
for (const line of lines) {
  if (line.includes('const handleConfirmSalvar')) found = true;
  if (found) {
    funcLines.push(line);
    if (line.includes('setShowConfirm(false)')) {
        break; // probably the end of try block, wait let's just grab 50 lines
    }
  }
}
console.log(funcLines.slice(0, 50).join('\n'));
