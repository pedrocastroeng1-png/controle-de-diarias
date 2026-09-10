import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

content = content.replace(
  /fornecedor_id:\s*'',\s*fornecedor_id:\s*'',/g,
  `fornecedor_id: '',`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
