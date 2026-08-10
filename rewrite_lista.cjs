const fs = require('fs');

const code = fs.readFileSync('src/pages/admin/Ferramentas/ListaFerramentas.tsx', 'utf-8');

// I will just use regex to replace the table part with conditional rendering.
// Wait, I will just rewrite the whole file, it's easier.

