const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace('.delete(.eq("id", id))', '.delete().eq("id", id)');
code = code.replace('.delete(.eq("id", id))', '.delete().eq("id", id)');
fs.writeFileSync('src/lib/api.ts', code);
