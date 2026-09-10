const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// Header
content = content.replace(
  /<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto<\/th>/,
  '<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>\n                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>'
);

// Cell
content = content.replace(
  /<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">\s*<div className="font-medium">\{item\.material\?\.nome\}<\/div>\s*<div className="text-xs text-gray-500">\{item\.material\?\.category\?\.nome\}<\/div>\s*<\/td>/,
  `<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{item.material?.nome}</div>
                        <div className="text-xs text-gray-500">{item.material?.category?.nome}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.funcionario?.nome || '-'}
                      </td>`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
