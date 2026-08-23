const fs = require('fs');
const file = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/Visão Geral/g, 'Central de Operações');
content = content.replace(/bg-gradient-to-br from-gray-900 to-gray-800/g, 'bg-[var(--color-pceg-navy)]');
content = content.replace(/bg-emerald-400/g, 'bg-[var(--color-pceg-gold)]');

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard updated');
