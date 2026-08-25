const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf8');

code = code.replace(
  /\)\s*:\s*\(\s*\{attendancePhotoUrl === 'ERROR' \? \(/m,
  `) : attendancePhotoUrl === 'ERROR' ? (`
);

code = code.replace(
  /Sem Foto\s*<\/span>\s*\)\}\s*\)\}/m,
  `Sem Foto
                              </span>
                            )}`
);

fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', code);
