const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Ferramentas.tsx', 'utf8');

code = code.replace(
  `        for (const f of filtered) {
          if (f.foto_path) {
            urls[f.id] = await api.getPhotoUrl('fotos_ferramentas', f.foto_path);
          }
        }`,
  `        for (const f of filtered) {
          if (f.foto_path) {
            try {
              urls[f.id] = await api.getPhotoUrl('fotos_ferramentas', f.foto_path);
            } catch (e) { console.warn(e); }
          }
        }`
);

code = code.replace(
  `        for (const emp of data) {
          if (emp.ferramenta?.foto_path) {
            urls[emp.ferramenta_id] = await api.getPhotoUrl('fotos_ferramentas', emp.ferramenta.foto_path);
          }
        }`,
  `        for (const emp of data) {
          if (emp.ferramenta?.foto_path) {
            try {
              urls[emp.ferramenta_id] = await api.getPhotoUrl('fotos_ferramentas', emp.ferramenta.foto_path);
            } catch (e) { console.warn(e); }
          }
        }`
);

fs.writeFileSync('src/pages/operador/Ferramentas.tsx', code);
