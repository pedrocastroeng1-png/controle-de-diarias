import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

content = content.replace(
  /<\/form>\s*\);\s*\}/,
  `</form>\n    </>\n  );\n}`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
