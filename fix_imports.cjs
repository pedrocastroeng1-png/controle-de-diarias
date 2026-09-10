const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

content = content.replace(/import SmartPurchaseForm from '\.\.\/\.\.\/components\/SmartPurchaseForm';\n/g, "");
content = content.replace(/, Sparkles/g, "");

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
