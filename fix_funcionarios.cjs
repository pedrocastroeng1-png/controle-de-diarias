const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf-8');

// I need to add state for tipoColaborador
code = code.replace(/const \[obraId, setObraId\] = useState\(''\);/, `const [obraId, setObraId] = useState('');
  const [tipoColaborador, setTipoColaborador] = useState<'DIARISTA' | 'CLT'>('DIARISTA');`);

// I need to add tipoColaborador to handleSubmit
code = code.replace(/obra_id: obraId/, `obra_id: obraId,\n        tipo_colaborador: tipoColaborador`);

// I need to add tipoColaborador to handleEdit
code = code.replace(/setObraId\(f\.obra_id\);/, `setObraId(f.obra_id);\n    setTipoColaborador(f.tipo_colaborador || 'DIARISTA');`);

// I need to clear it on cancel
code = code.replace(/setObraId\(''\);/, `setObraId(''); setTipoColaborador('DIARISTA');`);

// Now the form fields. It's a grid grid-cols-1 md:grid-cols-4. I can make it md:grid-cols-5 maybe, or just fit it in.
// Let's add the field after Obra.
const selectTipo = `          <div>
            <label htmlFor="tipoColaborador" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="tipoColaborador"
              value={tipoColaborador}
              onChange={(e) => setTipoColaborador(e.target.value as any)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="DIARISTA">DIARISTA</option>
              <option value="CLT">CLT</option>
            </select>
          </div>
`;
code = code.replace(/<\/select>\s*<\/div>\s*<div className="col-span-1 md:col-span-4">/, `</select>\n          </div>\n${selectTipo}          <div className="col-span-1 md:col-span-5">`);
code = code.replace(/className="grid grid-cols-1 md:grid-cols-4 gap-4"/, `className="grid grid-cols-1 md:grid-cols-5 gap-4"`);
code = code.replace(/<div className="col-span-1 md:col-span-4 flex justify-end gap-3 mt-2">/, `<div className="col-span-1 md:col-span-5 flex justify-end gap-3 mt-2">`);
code = code.replace(/<div className="col-span-1 md:col-span-2">/, `<div className="col-span-1 md:col-span-2">`);

// Add column to table
code = code.replace(/<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\s*Função\s*<\/th>/, `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                  Tipo\n                </th>\n                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\n                  Função\n                </th>`);

code = code.replace(/<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\s*\{funcionario\.funcao\?\.nome \|\| '-'\}\s*<\/td>/, `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\n                    {funcionario.tipo_colaborador || 'DIARISTA'}\n                  </td>\n                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\n                    {funcionario.funcao?.nome || '-'}\n                  </td>`);

code = code.replace(/colSpan=\{10\}/, `colSpan={11}`);

fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
console.log('Fixed Funcionarios');
