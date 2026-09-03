const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf8');

const targetSelect = `<select
              id="obra"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>`;

const newSelect = `<select
              id="obra"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todas as Obras</option>
              {obras.filter(o => !o.parent_obra_id).map(o => (
                <optgroup key={o.id} label={o.nome}>
                  <option value={o.id}>{o.nome} (Principal)</option>
                  {obras.filter(sub => sub.parent_obra_id === o.id).map(sub => (
                    <option key={sub.id} value={sub.id}>- {sub.nome}</option>
                  ))}
                </optgroup>
              ))}
            </select>`;

code = code.replace(targetSelect, newSelect);

fs.writeFileSync('src/pages/admin/Relatorios.tsx', code);
