const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');
code = code.replace(/import {([^}]+), Sparkles, FileText } from 'lucide-react';/, (match, p1) => {
    const imports = new Set(p1.split(',').map(s => s.trim()).filter(Boolean));
    imports.add('Sparkles');
    imports.add('FileText');
    return `import { ${Array.from(imports).join(', ')} } from 'lucide-react';`;
});
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code);
