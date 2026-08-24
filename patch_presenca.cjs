const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const oldCheck = `
        if (presencas[f.id] === true) {
           if (!capturedFotos[f.id]) {
              throw new Error(\`Falta foto de presença para \${f.nome}\`);
           }
           photo_path = await api.uploadAttendancePhoto(capturedFotos[f.id], f.id);
           photo_taken_at = now;
           photo_taken_by = userId;
        }
`;

const newCheck = `
        if (presencas[f.id] === true) {
           if (!isAdmin && !capturedFotos[f.id]) {
              throw new Error(\`Falta foto de presença para \${f.nome}\`);
           }
           if (capturedFotos[f.id]) {
             photo_path = await api.uploadAttendancePhoto(capturedFotos[f.id], f.id);
             photo_taken_at = now;
             photo_taken_by = userId;
           }
        }
`;

if (code.includes('if (!capturedFotos[f.id]) {') && code.includes('photo_path = await api.uploadAttendancePhoto')) {
  code = code.replace(oldCheck.trim(), newCheck.trim());
  fs.writeFileSync('src/pages/operador/Presenca.tsx', code);
  console.log("Presenca.tsx patched successfully.");
} else {
  console.log("Could not find check in Presenca.tsx.");
}
