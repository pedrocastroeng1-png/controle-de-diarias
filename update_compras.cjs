const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// Add CATEGORY_EMOJIS
if (!content.includes('CATEGORY_EMOJIS')) {
  const emojiMapping = `
const CATEGORY_EMOJIS: Record<string, string> = {
  'Materiais de Construção': '🧱',
  'Ferragens': '🔩',
  'Esquadrias e Acessórios': '🚪',
  'Madeira': '🪚',
  'Elétrica': '⚡',
  'Hidráulica': '🚰',
  'Pintura': '🎨',
  'Ferramentas': '🧰',
  'EPI': '🦺',
  'Limpeza': '🧹',
  'Fixadores': '🪛',
  'Acabamentos': '🧱',
  'Materiais Diversos': '📦'
};

export default function ComprasMateriaisTab() {`;
  content = content.replace("export default function ComprasMateriaisTab() {", emojiMapping);
}

// Add state for produto_search and is_open
content = content.replace(
  "{ id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0, funcionario_id: null }",
  "{ id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0, funcionario_id: null, produto_search: '', is_open: false }"
);

// updateItem clearing
content = content.replace(
  "updated.material_id = '';",
  "updated.material_id = '';\n          updated.produto_search = '';\n          updated.is_open = false;"
);

// Replace Categoria Label
content = content.replace(
  /<label className="block text-xs font-medium text-gray-500 mb-1">Categoria<\/label>/g,
  '<label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Produto</label>'
);

// Replace Categoria option rendering
content = content.replace(
  /<option value="">Categoria\.\.\.<\/option>\s*\{categorias\.map\(\(c: any\) => \(\s*<option key=\{c\.id\} value=\{c\.id\}>\{c\.nome\}<\/option>\s*\)\)\}/,
  `<option value="">Tipo de Produto...</option>
                        {categorias.map((c: any) => {
                          const emoji = CATEGORY_EMOJIS[c.nome] || '';
                          return <option key={c.id} value={c.id}>{emoji ? \`\${emoji} \${c.nome}\` : c.nome}</option>;
                        })}`
);

// Replace Produto block
const oldProdutoBlock = /<div className="sm:col-span-3">\s*<label className="block text-xs font-medium text-gray-500 mb-1">Produto \*<\/label>\s*<select\s*required\s*disabled=\{!item\.categoria_id\}\s*value=\{item\.material_id\}\s*onChange=\{e => updateItem\(item\.id, 'material_id', e\.target\.value\)\}\s*className="w-full text-sm rounded border border-gray-300 px-2 py-1\.5 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100"\s*>\s*<option value="">Produto\.\.\.<\/option>\s*\{catMateriais\.map\(\(m: any\) => \(\s*<option key=\{m\.id\} value=\{m\.id\}>\{m\.nome\}<\/option>\s*\)\)\}\s*<\/select>\s*<\/div>/;

const newProdutoBlock = `
                    <div className="sm:col-span-3 relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Produto *</label>
                      <input
                        type="text"
                        required
                        disabled={!item.categoria_id}
                        placeholder={!item.categoria_id ? 'Selecione o tipo primeiro' : 'Digite para pesquisar...'}
                        value={item.produto_search || ''}
                        onChange={e => {
                           updateItem(item.id, 'produto_search', e.target.value);
                           updateItem(item.id, 'is_open', true);
                           if (item.material_id) updateItem(item.id, 'material_id', '');
                        }}
                        onFocus={() => updateItem(item.id, 'is_open', true)}
                        onBlur={() => setTimeout(() => updateItem(item.id, 'is_open', false), 200)}
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
                             const search = (item.produto_search || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
                             const filtered = catMateriais.filter((m: any) => m.nome.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(search));
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
                                 onClick={() => {
                                    updateItem(item.id, 'material_id', m.id);
                                    updateItem(item.id, 'produto_search', m.nome);
                                    updateItem(item.id, 'is_open', false);
                                 }}
                               >
                                 {m.nome}
                               </div>
                             ));
                          })()}
                        </div>
                      )}
                    </div>`;

content = content.replace(oldProdutoBlock, newProdutoBlock);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
