import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

// Remove the wrongly injected modal
const modalMatch = /\{showFornecedorModal && \([\s\S]*?\n\s*\)\}/;
let modalStr = content.match(modalMatch)[0];
content = content.replace(modalMatch, '');

// The modalStr contains the JSX. Let's insert it inside the 'new' view return.
// We search for `// NEW PURCHASE FORM` and find its return
content = content.replace(
  /\/\/\s*NEW PURCHASE FORM\s*return \(\s*<form/i,
  `// NEW PURCHASE FORM\n  return (\n    <>\n      ${modalStr}\n      <form`
);

// We need to close the fragment for 'new' view return.
// We look for the closing </form> of the NEW PURCHASE FORM
content = content.replace(
  /<\/form>\s*;\s*\}/,
  `</form>\n    </>;\n  }`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
