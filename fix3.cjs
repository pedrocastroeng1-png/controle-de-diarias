const fs = require('fs');
let content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');
const corruptRegex = /\s*\}\}\n\s*setCameraModalFuncId\(null\);\n\s*setPreviewPhoto\(null\);\n\s*\} catch \(err: any\) \{\n\s*setErro\(err\.message \|\| "Erro ao processar foto"\);\n\s*showToast\("❌ Erro ao processar foto", "error"\);\n\s*\} finally \{\n\s*setSaving\(false\);\n\s*\}\n\s*\}\}/;

content = content.replace(corruptRegex, '\n                  }}');
fs.writeFileSync('src/pages/operador/Presenca.tsx', content);
