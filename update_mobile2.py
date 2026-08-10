import sys

with open('src/pages/operador/Ferramentas.tsx', 'r') as f:
    code = f.read()

# We need to extract the exact block to replace.
# It starts at: {/* Mobile View (Cards) */}
# and ends right before: {showEmprestarModal && selectedFerramenta && (

start_marker = '{/* Mobile View (Cards) */}'
end_marker = '{showEmprestarModal && selectedFerramenta && ('

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

old_mobile_block = code[start_idx:end_idx]

new_mobile_block = """{/* Mobile View (Cards) */}
      <div className="md:hidden flex flex-col space-y-4 mt-4 pb-8">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Carregando...</div>
        ) : activeTab === 'disponiveis' && ferramentas.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta disponível.</div>
        ) : activeTab === 'emprestadas' && emprestimos.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta emprestada.</div>
        ) : activeTab === 'disponiveis' ? (
          ferramentas.map((f) => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                {imageUrls[f.id] ? (
                  <img className="h-8 w-8 rounded-full object-cover" src={imageUrls[f.id]} alt="" />
                ) : (
                  <span className="text-xl">🔨</span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{f.nome}</h3>
              </div>
              
              <div className="text-base text-gray-700 font-medium">
                {f.marca} {f.modelo}
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Código:</div>
                <div className="font-semibold text-gray-900">{f.codigo_interno}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Status:</div>
                <div className="font-semibold text-green-600">Disponível</div>
              </div>

              <div className="pt-2">
                <button onClick={() => openEmprestar(f)} className="w-full justify-center text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  EMPRESTAR
                </button>
              </div>
            </div>
          ))
        ) : (
          emprestimos.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                {emp.ferramenta?.foto_path ? (
                  <img className="h-8 w-8 rounded-full object-cover" src={imageUrls[emp.ferramenta_id] || ''} alt="" />
                ) : (
                  <span className="text-xl">🔨</span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{emp.ferramenta?.nome}</h3>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Funcionário:</div>
                <div className="font-semibold text-gray-900">{emp.funcionario?.nome}</div>
              </div>
              
              <div className="text-sm">
                <div className="text-gray-500 mb-1">Retirada:</div>
                <div className="font-semibold text-gray-900">{format(new Date(emp.data_emprestimo), 'dd/MM/yyyy')}</div>
              </div>

              <div className="pt-2 flex flex-col space-y-3">
                <button onClick={() => openDevolucao(emp)} className="w-full justify-center text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  DEVOLVER
                </button>
                <button onClick={() => handleMarcarPerdida(emp.ferramenta_id)} className="w-full justify-center text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-3.5 rounded-xl font-bold transition-colors uppercase tracking-widest text-sm">
                  MARCAR COMO PERDIDA
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      """

new_code = code[:start_idx] + new_mobile_block + code[end_idx:]

with open('src/pages/operador/Ferramentas.tsx', 'w') as f:
    f.write(new_code)

print("Updated perfectly")
