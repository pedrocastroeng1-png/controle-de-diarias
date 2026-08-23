const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

// Add view type 'choice' and 'smart_form'
code = code.replace(
  /const \[view, setView\] = useState<'list' \| 'form' \| 'details'>\('list'\);/,
  "const [view, setView] = useState<'list' | 'choice' | 'form' | 'smart_form' | 'details'>('list');"
);

// Replace NOVA COMPRA button behavior
code = code.replace(
  /<button\s+onClick=\{\(\) => \{\s+resetForm\(\);\s+setView\('form'\);\s+\}\}/,
  "<button onClick={() => { resetForm(); setView('choice'); }}"
);

// We need to fetch funcionarios for the smart form. Are they fetched in the tab?
// Let's look for getObras in the tab
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', code, 'utf-8');
