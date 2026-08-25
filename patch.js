const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf8');
code = code.replace(
  `      if (f.photo_path) {
        try {
          const url = await api.getPhotoUrl('employee-photos', f.photo_path);
          setRegistrationPhotoUrl(url);
        } catch (err) {
          console.warn("Could not load employee photo:", err);
        }
        setRegistrationPhotoUrl(url);
      }`,
  `      if (f.photo_path) {
        try {
          const url = await api.getPhotoUrl('employee-photos', f.photo_path);
          setRegistrationPhotoUrl(url);
        } catch (err) {
          console.warn("Could not load employee photo:", err);
        }
      }`
);
fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', code);
