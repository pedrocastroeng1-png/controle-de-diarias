const fs = require('fs');

const code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

// I will output the file to a backup just in case
fs.writeFileSync('src/pages/admin/Funcionarios.backup.tsx', code);

console.log("File backed up. Ready to rewrite.");
