const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

const targetUnid = `                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unid.</label>
                        <input
                          type="text"
                          disabled
                          value={selectedMaterial?.unidade || ''}
                          className="w-full text-sm rounded border border-gray-200 bg-gray-100 text-gray-600 px-2 py-1.5 text-center font-medium"
                        />
                      </div>`;
const replaceUnid = `                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unid.</label>
                        <select
                          value={item.unidade_compra || selectedMaterial?.unidade || ''}
                          onChange={(e) => updateItem(item.id, 'unidade_compra', e.target.value)}
                          disabled={!selectedMaterial}
                          className="w-full text-sm rounded border border-gray-300 px-1 py-1.5 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {selectedMaterial && (
                            <option value={selectedMaterial.unidade}>{selectedMaterial.unidade}</option>
                          )}
                          <option value="KG">KG</option>
                          <option value="UN">UN</option>
                        </select>
                      </div>`;
content = content.replace(targetUnid, replaceUnid);

const targetSelectMat = `                                      updateItem(item.id, {
                                        material_id: mat.id,
                                        produto_search: mat.nome,
                                        is_open: false
                                      });`;
const replaceSelectMat = `                                      updateItem(item.id, {
                                        material_id: mat.id,
                                        produto_search: mat.nome,
                                        unidade_compra: mat.unidade,
                                        is_open: false
                                      });`;
content = content.replace(targetSelectMat, replaceSelectMat);

const targetPushApi = `      itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        funcionario_id: isEpi ? item.funcionario_id : null
      });`;
const replacePushApi = `      itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        funcionario_id: isEpi ? item.funcionario_id : null,
        unidade_compra: item.unidade_compra || materiais.find(m => m.id === item.material_id)?.unidade || 'UN'
      });`;
content = content.replace(targetPushApi, replacePushApi);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
