const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// 1. addItem definition
const targetAddItem = `  const addItem = () => {
    setItensForm(prev => [
      ...prev, 
      { id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0, funcionario_id: null, produto_search: '', is_open: false }
    ]);
  };`;
const replaceAddItem = `  const addItem = () => {
    setItensForm(prev => [
      ...prev, 
      { id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, unidade_compra: '', valor_unitario: 0, funcionario_id: null, produto_search: '', is_open: false }
    ]);
  };`;
content = content.replace(targetAddItem, replaceAddItem);

// 2. update updateItem to handle setting default unit when material_id changes (but we can just let it be handled when they select the material)
const targetMaterialChange = `                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>`;
const replaceMaterialChange = `                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>`;
// Actually let's search for "onMouseDown={() => {" where they select a material
const targetSelectMaterial = `                                      onMouseDown={() => {
                                        updateItem(item.id, {
                                          material_id: mat.id,
                                          produto_search: mat.nome,
                                          is_open: false
                                        });
                                      }}`;
const replaceSelectMaterial = `                                      onMouseDown={() => {
                                        updateItem(item.id, {
                                          material_id: mat.id,
                                          produto_search: mat.nome,
                                          unidade_compra: mat.unidade,
                                          is_open: false
                                        });
                                      }}`;
content = content.replace(targetSelectMaterial, replaceSelectMaterial);

// 3. Add Unidade selector near Quantidade
const targetQuantidade = `                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantidade || ''}`;
const replaceQuantidade = `                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qtd</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantidade || ''}`;
content = content.replace(targetQuantidade, replaceQuantidade);

const targetUnidadeInput = `                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">{selectedMaterial?.unidade || '-'}</span>
                            </div>
                          </div>
                        </div>`;
const replaceUnidadeInput = `                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                          <select
                            value={item.unidade_compra || selectedMaterial?.unidade || ''}
                            onChange={(e) => updateItem(item.id, 'unidade_compra', e.target.value)}
                            disabled={!selectedMaterial}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            {selectedMaterial && (
                              <option value={selectedMaterial.unidade}>{selectedMaterial.unidade}</option>
                            )}
                            <option value="KG">KG</option>
                            <option value="UN">UN</option>
                          </select>
                        </div>`;
content = content.replace(targetUnidadeInput, replaceUnidadeInput);

// 4. Update the push to API
const targetPush = `            itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        funcionario_id: isEpi ? item.funcionario_id : null
      });`;
const replacePush = `            itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        funcionario_id: isEpi ? item.funcionario_id : null,
        unidade_compra: item.unidade_compra || materiais.find(m => m.id === item.material_id)?.unidade || 'UN'
      });`;
content = content.replace(targetPush, replacePush);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
