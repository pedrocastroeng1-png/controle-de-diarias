const fs = require('fs');
let content = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const brokenRegex = /Nova Foto\n\s*<button/g;

const fix = `Nova Foto
                  </span>
                  <div className="h-48 w-48 mx-auto rounded-3xl overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-md">
                    <img
                      src={previewPhoto.url}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <button`;

content = content.replace(brokenRegex, fix);
fs.writeFileSync('src/pages/operador/Presenca.tsx', content);
