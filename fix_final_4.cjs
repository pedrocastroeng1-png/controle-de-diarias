const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(/funcionario_id\.eq\("data", data\)\);/g, 'funcionario_id).eq("data", data);');
code = code.replace(/dateStr\.gte\("end_date", dateStr\)\);/g, 'dateStr).gte("end_date", dateStr);');

fs.writeFileSync('src/lib/api.ts', code);
