const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf-8');

code = code.replace(/total: number;/, "total_calculado?: number;");
code = code.replace(/total_item: number;/, "valor_total?: number;");

fs.writeFileSync('src/lib/types.ts', code, 'utf-8');
