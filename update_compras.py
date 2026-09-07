import re
with open('/tmp/compras.tsx', 'r') as f:
    content = f.read()

# 1. Add fornecedores state
content = content.replace("const [categorias, setCategorias] = useState<any[]>([]);", 
"const [categorias, setCategorias] = useState<any[]>([]);\n  const [fornecedores, setFornecedores] = useState<any[]>([]);\n  const [showFornecedorModal, setShowFornecedorModal] = useState(false);\n  const [novoFornecedorNome, setNovoFornecedorNome] = useState('');")

# 2. Add fornecedor_id to compraForm
content = content.replace("fornecedor: '',", "fornecedor: '',\n    fornecedor_id: '',")

# 3. Add getFornecedores to fetchData
content = content.replace("api.getMaterialCategories()", "api.getMaterialCategories(),\n        api.getFornecedores({ ativo: true })")
content = content.replace("const [comprasData, obrasData, materiaisData, categoriasData] = await Promise.all([", "const [comprasData, obrasData, materiaisData, categoriasData, fornecedoresData] = await Promise.all([")
content = content.replace("setCategorias(categoriasData);", "setCategorias(categoriasData);\n      setFornecedores(fornecedoresData);")

# 4. handleOpenNew update
content = content.replace("fornecedor: '',", "fornecedor: '',\n      fornecedor_id: '',")

# 5. UI change for fornecedor input (Combobox / Select with Plus button)
ui_search = """          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <input
              type="text"
              placeholder="Nome do fornecedor ou loja"
              value={compraForm.fornecedor}
              onChange={e => setCompraForm({...compraForm, fornecedor: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>"""

ui_replace = """          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <div className="flex gap-2">
              <select
                value={compraForm.fornecedor_id}
                onChange={e => {
                  const f = fornecedores.find(x => x.id === e.target.value);
                  setCompraForm({ ...compraForm, fornecedor_id: e.target.value, fornecedor: f ? f.nome : '' });
                }}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione ou adicione...</option>
                {fornecedores.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              <button 
                type="button" 
                onClick={() => setShowFornecedorModal(true)}
                className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 border border-gray-300"
                title="Cadastrar Novo Fornecedor"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>"""

content = content.replace(ui_search, ui_replace)

# 6. Add quick create modal at the bottom
modal = """
      {/* Modal Novo Fornecedor Rápido */}
      {showFornecedorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowFornecedorModal(false)} />
            
            <div className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Novo Fornecedor Rápido</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fornecedor *</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={novoFornecedorNome}
                    onChange={(e) => setNovoFornecedorNome(e.target.value)}
                    placeholder="Ex: Casa Souza"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowFornecedorModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!novoFornecedorNome.trim()) return;
                      try {
                        const newF = await api.createFornecedor({ nome: novoFornecedorNome.trim() });
                        setFornecedores([...fornecedores, newF].sort((a,b) => a.nome.localeCompare(b.nome)));
                        setCompraForm({ ...compraForm, fornecedor_id: newF.id, fornecedor: newF.nome });
                        setShowFornecedorModal(false);
                        setNovoFornecedorNome('');
                      } catch(e: any) {
                        alert(e.message);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
"""
content = content.replace("    </div>\n  );\n}", modal + "\n    </div>\n  );\n}")

with open('/tmp/compras.tsx', 'w') as f:
    f.write(content)
