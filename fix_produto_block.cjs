const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

const regex = /<div className="sm:col-span-3 relative">\s*<label className="block text-xs font-medium text-gray-500 mb-1">Produto \*<\/label>[\s\S]*?<\/div>\s*\)\}\s*<\/div>/;

const newBlock = `<div className="sm:col-span-3 relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produto *</label>
                      <input
                        type="text"
                        required
                        disabled={!item.categoria_id}
                        placeholder={!item.categoria_id ? 'Selecione o tipo primeiro' : 'Digite para pesquisar...'}
                        value={item.produto_search || ''}
                        onChange={e => {
                           updateItem(item.id, { produto_search: e.target.value, is_open: true, material_id: '' });
                        }}
                        onFocus={() => updateItem(item.id, 'is_open', true)}
                        onBlur={() => updateItem(item.id, 'is_open', false)}
                        onKeyDown={e => {
                          if (e.key === 'Escape') {
                            updateItem(item.id, 'is_open', false);
                          }
                        }}
                        className="w-full text-sm rounded border border-gray-300 px-2 py-1.5 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"
                      />
                      {item.is_open && item.categoria_id && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {(() => {
                             const normalizeSearchText = (text: string) => 
                               (text || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim().replace(/\\s+/g, ' ');
                               
                             const search = normalizeSearchText(item.produto_search || '');
                             const tokens = search.split(' ').filter(Boolean);
                             
                             const filtered = catMateriais.filter((m: any) => {
                               if (tokens.length === 0) return true; // Show all when empty
                               const normalizedName = normalizeSearchText(m.nome);
                               return tokens.every(token => normalizedName.includes(token));
                             });
                             
                             if (filtered.length === 0) {
                               return (
                                 <div className="p-2 text-sm text-gray-500">
                                   <p>Nenhum produto encontrado neste tipo.</p>
                                   <p className="text-xs mt-1">Solicite ao administrador o cadastro do material.</p>
                                 </div>
                               );
                             }
                             return filtered.map((m: any) => (
                               <div
                                 key={m.id}
                                 className="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50"
                                 onPointerDown={(e) => {
                                    e.preventDefault();
                                    updateItem(item.id, { material_id: m.id, produto_search: m.nome, is_open: false });
                                 }}
                               >
                                 {m.nome}
                               </div>
                             ));
                          })()}
                        </div>
                      )}
                    </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
