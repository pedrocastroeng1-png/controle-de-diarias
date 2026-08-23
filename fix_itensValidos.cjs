const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

code = code.replace(/itensValidos\.push\(\{\s+material_id: item\.material_id,\s+quantidade: item\.quantidade,\s+valor_unitario: item\.valor_unitario,?\s+\}\);/g, 
  "itensValidos.push({\n        material_id: item.material_id,\n        quantidade: item.quantidade,\n        valor_unitario: item.valor_unitario,\n        funcionario_id: item.funcionario_id || null\n      });"
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code);
