const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

code = code.replace(/compra\.total/g, "compra.total_calculado");
code = code.replace(/selectedCompra\.total/g, "selectedCompra.total_calculado");
code = code.replace(/item\.total_item/g, "item.valor_total");

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code, 'utf-8');
