const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

const targetSelect = `              <option value="" disabled>Selecione</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>`;

const newSelect = `              <option value="" disabled>Selecione</option>
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
fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
