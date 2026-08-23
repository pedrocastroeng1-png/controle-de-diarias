const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

// Remove total from payloadCompra
code = code.replace(/total: totalCompra,/, "");

// Remove total_item from itensValidos
code = code.replace(/total_item: totalItem/g, "");

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code, 'utf-8');
