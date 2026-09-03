const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

const anchor = `<div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">`;

const massActionBar = `      {selectedIds.length > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center text-blue-800 font-medium">
            <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
            {selectedIds.length} {selectedIds.length === 1 ? 'funcionário selecionado' : 'funcionários selecionados'}
          </div>
          <button
            onClick={() => setShowMassEdit(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Alterar obra
          </button>
        </div>
      )}

      {showMassEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">Alterar obra em massa</h3>
              <button onClick={() => setShowMassEdit(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Você está prestes a alterar a obra de <strong>{selectedIds.length}</strong> funcionários.
                Selecione a nova obra abaixo:
              </p>
              
              <div className="mb-4">
                <label htmlFor="massObra" className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Obra
                </label>
                <select
                  id="massObra"
                  value={massEditObraId}
                  onChange={(e) => setMassEditObraId(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>Selecione a nova obra</option>
                  {obras.filter(o => !o.parent_obra_id).map(o => (
                    <optgroup key={o.id} label={o.nome}>
                      <option value={o.id}>{o.nome} (Principal)</option>
                      {obras.filter(sub => sub.parent_obra_id === o.id).map(sub => (
                        <option key={sub.id} value={sub.id}>- {sub.nome}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">Funcionários selecionados:</p>
                <ul className="space-y-1">
                  {funcionarios.filter(f => selectedIds.includes(f.id)).map(f => (
                    <li key={f.id} className="text-sm text-gray-700 flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                      {f.nome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowMassEdit(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleMassEdit}
                disabled={!massEditObraId || massEditSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
              >
                {massEditSaving ? 'Aplicando...' : 'Aplicar alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">`;

code = code.replace(anchor, massActionBar);

fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
