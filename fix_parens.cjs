const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// Replace .select(...) ) with .select(...)
code = code.replace(/\.select\(([^)]*)\)\)/g, '.select($1)');
code = code.replace(/\.select\(\`(.*?)\`\)\)/g, '.select(`$1`)');
code = code.replace(/\.select\("(.*?)"\)\)/g, '.select("$1")');
code = code.replace(/\.select\((.*)\)\)/g, '.select($1)');

code = code.replace(/\.update\(([^)]*)\)\)/g, '.update($1)');
code = code.replace(/\.delete\(\)\)/g, '.delete()');

fs.writeFileSync('src/lib/api.ts', code);
