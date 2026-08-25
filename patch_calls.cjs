const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

// The single saves:
// await api.salvarPresencas([ { ... } ]);
// Change to: await api.salvarPresencas([ ... ], usuario?.empresa_id);

code = code.replace(/await api\.salvarPresencas\(\[\n/g, "await api.salvarPresencas([\n");

// Replace the array literal calls:
const pattern1 = /await api\.salvarPresencas\(\[\s+([\s\S]*?)\s+\]\);/g;
code = code.replace(pattern1, "await api.salvarPresencas([$1], usuario?.empresa_id);");

// Replace the registrosToSave call
code = code.replace(/await api\.salvarPresencas\(registrosToSave\);/g, "await api.salvarPresencas(registrosToSave, usuario?.empresa_id);");

fs.writeFileSync('src/pages/operador/Presenca.tsx', code);
