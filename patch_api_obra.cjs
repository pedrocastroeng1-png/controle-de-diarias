const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

code = code.replace(
`    if (obraId) {
      // Obras are filtered by name since the view has 'obra' column
      query = query.eq("obra", obraId);
    }`,
`    if (obraId) {
      query = query.eq("obra_id", obraId);
    }`
);

fs.writeFileSync('src/lib/api.ts', code);
