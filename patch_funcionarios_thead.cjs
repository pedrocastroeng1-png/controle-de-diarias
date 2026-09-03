const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

const anchorThead = `<thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>`;

const newThead = `<thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-700">
                    {selectedIds.length > 0 && selectedIds.length === filteredFuncionarios.length ? (
                      <CheckSquare className="h-5 w-5" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>`;

code = code.replace(anchorThead, newThead);

const anchorTbody = `<tr key={funcionario.id} className={\`hover:bg-gray-50 \${funcionario.ativo === false ? 'opacity-75' : ''}\`}>
                  <td className={\`px-6 py-4 whitespace-nowrap text-sm font-medium \${funcionario.ativo === false ? 'text-gray-500' : 'text-gray-900'}\`}>
                    {funcionario.nome}
                  </td>`;

const newTbody = `<tr key={funcionario.id} className={\`hover:bg-gray-50 \${funcionario.ativo === false ? 'opacity-75' : ''}\`}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button onClick={() => handleSelect(funcionario.id)} className="text-gray-500 hover:text-blue-600">
                      {selectedIds.includes(funcionario.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className={\`px-6 py-4 whitespace-nowrap text-sm font-medium \${funcionario.ativo === false ? 'text-gray-500' : 'text-gray-900'}\`}>
                    {funcionario.nome}
                  </td>`;

code = code.replace(anchorTbody, newTbody);

fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
