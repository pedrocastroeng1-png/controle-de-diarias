const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf8');

code = code.replace(
  /\} catch \(err\) \{\n\s*console\.warn\("Could not load employee photo:", err\);\n\s*\}/m,
  `} catch (err) {
          console.warn("Could not load employee photo:", err);
          setRegistrationPhotoUrl('ERROR');
        }`
);

code = code.replace(
  /\{registrationPhotoUrl \? \(/g,
  `{registrationPhotoUrl === 'ERROR' ? (
                            <span className="text-red-500 text-sm font-medium flex flex-col items-center p-2 text-center">
                              <User className="h-12 w-12 text-red-300 mb-2 opacity-50" />
                              Foto indisponível
                            </span>
                          ) : registrationPhotoUrl ? (`
);

fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', code);
