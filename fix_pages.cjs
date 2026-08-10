const fs = require('fs');

// 1. AuditoriaPresencas.tsx -> only Diaristas
let audi = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf-8');
audi = audi.replace(/api\.getFuncionarios\('todos'\)/g, `api.getFuncionarios('todos', true)`);
fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', audi);

// 2. Relatorios.tsx -> only Diaristas
let rel = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf-8');
// For Relatorios, we want ALL to filter the Relatorio using CLT names? No, our filter in api.ts uses supabase query directly!
// So getFuncionarios('todos') in Relatorios.tsx is just to populate the Dropdown "Funcionário" filter!
// And the dropdown should ONLY show Diaristas.
rel = rel.replace(/api\.getFuncionarios\('todos'\)/g, `api.getFuncionarios('todos', true)`);
fs.writeFileSync('src/pages/admin/Relatorios.tsx', rel);

// 3. Operador Presenca.tsx -> only Diaristas
let op = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf-8');
op = op.replace(/funcs = await api\.getFuncionarios\(\);/g, `funcs = await api.getFuncionarios('ativos', true);`);
fs.writeFileSync('src/pages/operador/Presenca.tsx', op);

console.log('Pages fixed!');
