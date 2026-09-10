import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf-8');

// 1. Import apiMateriaisRPC
content = content.replace(
  `import { format } from 'date-fns';`,
  `import { format } from 'date-fns';\nimport { apiMateriaisRPC } from '../../lib/api-materiais';`
);

// 2. Add handler for Fornecedor modal
const fornecedorHandler = `
  const handleCadastrarFornecedor = async () => {
    if (!novoFornecedorNome.trim()) {
      alert('Informe o nome do fornecedor');
      return;
    }
    try {
      setIsSaving(true);
      const novoId = await apiMateriaisRPC.cadastrarFornecedorRapido({ p_nome: novoFornecedorNome.trim() });
      setFormSuccess('Fornecedor cadastrado com sucesso!');
      setShowFornecedorModal(false);
      setNovoFornecedorNome('');
      
      // Refresh list
      const fornecedoresData = await api.getFornecedores({ ativo: true });
      setFornecedores(fornecedoresData);
      
      // Auto-select
      if (novoId) {
        setCompraForm(prev => ({ ...prev, fornecedor_id: novoId }));
      }
    } catch (err: any) {
      if (err.message && err.message.includes('já está cadastrado')) {
        alert('Este fornecedor já está cadastrado.');
      } else {
        alert('Erro ao cadastrar fornecedor.');
      }
    } finally {
      setIsSaving(false);
    }
  };
`;
// Let's insert the handler before handleSave
content = content.replace(
  `  const handleSave = async (e: React.FormEvent) => {`,
  fornecedorHandler + `\n  const handleSave = async (e: React.FormEvent) => {`
);

// 3. Rewrite handleSave to use apiMateriaisRPC
const handleSaveNew = `  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!compraForm.data_compra) return setFormError('A data da compra é obrigatória.');
    if (!compraForm.obra_id) return setFormError('A obra é obrigatória.');
    if (!compraForm.fornecedor_id) return setFormError('O fornecedor é obrigatório.');
    if (itensForm.length === 0) return setFormError('Adicione pelo menos um item à compra.');

    const itensValidos = [];
    for (let i = 0; i < itensForm.length; i++) {
      const item = itensForm[i];
      if (!item.material_id) return setFormError(\`Selecione o produto para o item \${i + 1}.\`);
      if (item.quantidade <= 0) return setFormError(\`A quantidade do item \${i + 1} deve ser maior que zero.\`);
      if (item.valor_unitario < 0) return setFormError(\`O valor unitário do item \${i + 1} não pode ser negativo.\`);
      
      itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario
      });
    }

    try {
      setIsSaving(true);
      await apiMateriaisRPC.registrarCompraMaterial({
        p_data_compra: compraForm.data_compra,
        p_fornecedor_id: compraForm.fornecedor_id,
        p_numero_recibo: compraForm.numero_recibo || null,
        p_obra_id: compraForm.obra_id,
        p_itens: itensValidos
      });
      setFormSuccess('Compra registrada com sucesso!');
      await fetchData();
      setTimeout(() => { setView('list'); }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao registrar compra.');
    } finally {
      setIsSaving(false);
    }
  };`;

// replace old handleSave
content = content.replace(
  /const handleSave = async \(e: React.FormEvent\) => \{[\s\S]*?catch \(err: any\) \{[\s\S]*?finally \{[\s\S]*?\}\n  \};/,
  handleSaveNew
);

// 4. Update the Obra selector logic to show hierarchy
const mainObras = `obras.filter(o => !o.parent_obra_id)`;
const obraOptions = `{obras.filter(o => !o.parent_obra_id).map(obra => (
                <optgroup key={obra.id} label={obra.nome}>
                  <option value={obra.id}>{obra.nome} (Principal)</option>
                  {obras.filter(sub => sub.parent_obra_id === obra.id).map(sub => (
                    <option key={sub.id} value={sub.id}>-- {sub.nome}</option>
                  ))}
                </optgroup>
              ))}`;

content = content.replace(
  /\{obras.map\(obra => \(\s*<option key=\{obra.id\} value=\{obra.id\}>\{obra.nome\}<\/option>\s*\)\)\}/,
  obraOptions
);

// 5. Date field logic: Disable for Operador
const isAdminDecl = `const isAdmin = usuario?.perfil === 'ADMIN';`;
content = content.replace(
  `const { usuario } = useAuth();`,
  `const { usuario } = useAuth();\n  const isAdmin = usuario?.perfil === 'ADMIN';`
);

content = content.replace(
  /<input\s*type="date"\s*required\s*value=\{compraForm.data_compra\}[\s\S]*?\/>/,
  `<input
              type="date"
              required
              disabled={!isAdmin}
              value={compraForm.data_compra}
              onChange={e => setCompraForm({...compraForm, data_compra: e.target.value})}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />`
);

// 6. Remove Observação field
content = content.replace(
  /<div className="md:col-span-2">\s*<label className="block text-sm font-medium text-gray-700 mb-1">Observação<\/label>[\s\S]*?<\/textarea>\s*<\/div>/,
  ``
);

// 7. Render CADASTRO FORNECEDOR modal
const modalJSX = `
      {showFornecedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Cadastro Rápido de Fornecedor</h3>
              <button onClick={() => setShowFornecedorModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do fornecedor *</label>
              <input
                type="text"
                autoFocus
                value={novoFornecedorNome}
                onChange={e => setNovoFornecedorNome(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFornecedorModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCadastrarFornecedor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  /return \(\s*<div/,
  modalJSX + `\n  return (\n    <div`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
