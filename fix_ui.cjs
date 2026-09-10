const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// Remove Observacao from details
content = content.replace(
  /<div className="md:col-span-2 lg:col-span-4">\s*<p className="text-sm font-medium text-gray-500">Observação<\/p>\s*<p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">\{selectedCompra\.observacao \|\| '-'}<\/p>\s*<\/div>/g,
  ""
);

// Remove Observacao from form
content = content.replace(
  /<div className="md:col-span-2">\s*<label className="block text-sm font-medium text-gray-700 mb-1">Observação<\/label>\s*<textarea\s*rows=\{2\}\s*value=\{compraForm\.observacao\}\s*onChange=\{e => setCompraForm\(\{\.\.\.compraForm, observacao: e\.target\.value\}\)\}\s*className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"\s*\/>\s*<\/div>/g,
  ""
);

// Now, insert the Funcionário dropdown in the item map.
// Let's find where the items are rendered.
const itemRenderStart = `<div className="sm:col-span-4">\n                      <label className="block text-xs font-medium text-gray-500 mb-1">Produto *</label>\n                      <select`;

// We need to know if it's EPI inside the map.
// const isEpi = categorias.find((c: any) => c.id === item.categoria_id)?.nome?.trim().toLowerCase() === 'epi';

const itemRenderContent = `
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                      <select
                        value={item.categoria_id}
                        onChange={e => updateItem(item.id, 'categoria_id', e.target.value)}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">Categoria...</option>
                        {categorias.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produto *</label>
                      <select
                        required
                        disabled={!item.categoria_id}
                        value={item.material_id}
                        onChange={e => updateItem(item.id, 'material_id', e.target.value)}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                      >
                        <option value="">Produto...</option>
                        {catMateriais.map((m: any) => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                    </div>

                    {categorias.find((c: any) => c.id === item.categoria_id)?.nome?.trim().toLowerCase() === 'epi' && (
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Funcionário *</label>
                        <select
                          required
                          value={item.funcionario_id || ''}
                          onChange={e => updateItem(item.id, 'funcionario_id', e.target.value)}
                          className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="">Selecione...</option>
                          {funcionarios.map((f: any) => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}
`;

// Replace the cols for layout
// First replace the Categoria and Produto sections
content = content.replace(
  /<div className="sm:col-span-3">\s*<label className="block text-xs font-medium text-gray-500 mb-1">Categoria<\/label>[\s\S]*?<div className="sm:col-span-4">\s*<label className="block text-xs font-medium text-gray-500 mb-1">Produto \*<\/label>[\s\S]*?<\/select>\s*<\/div>/,
  itemRenderContent
);

// We need to fix the grid layout for the other fields, the grid had 12 columns
// If EPI is visible, it uses 3 + 3 + 3 = 9 columns. Remaining 3?
// Let's adjust grid-cols to 12. 
// It was: 3 (Cat) + 4 (Prod) + 2 (Qtd/Unid) + 3 (Valor/Total) = 12.
// With EPI: 3 (Cat) + 3 (Prod) + 3 (EPI) + 3 (Qtd/Unid) + 3 (Valor/Total) = 15? No, flex wrap or grid-cols-12 with wrap.
// Actually, we can use a flex layout or just let it wrap in sm:grid-cols-12 if it exceeds 12, it wraps.
// Wait, if we just make it flex or allow wrap.

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
