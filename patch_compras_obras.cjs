const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');
code = code.replace(
  "setObras(obrasData.filter(o => o.status === 'ATIVA'));",
  "setObras(obrasData);"
);
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code, 'utf-8');
