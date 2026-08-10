import sys

with open('/app/applet/tmp_table.txt', 'r') as f:
    old_content = f.read()

new_content = old_content.replace(
    '<div className="bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden w-full">',
    '<div className="hidden md:block bg-white rounded-b-xl shadow-sm border border-gray-200 overflow-hidden w-full">'
)

mobile_code = """
      {/* Mobile View (Cards) */}
      <div className="md:hidden flex flex-col space-y-4 mt-4">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-4 bg-white rounded-xl shadow-sm border border-gray-200">Carregando...</div>
        ) : activeTab === 'disponiveis' && ferramentas.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta disponível.</div>
        ) : activeTab === 'emprestadas' && emprestimos.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4 bg-white rounded-xl shadow-sm border border-gray-200">Nenhuma ferramenta emprestada.</div>
        ) : activeTab === 'disponiveis' ? (
          ferramentas.map((f) => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start">
                <div className="h-12 w-12 flex-shrink-0">
                  {imageUrls[f.id] ? (
                    <img className="h-12 w-12 rounded-lg object-cover" src={imageUrls[f.id]} alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Wrench className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{f.nome}</h3>
                  <div className="text-sm text-gray-500 mt-1">{f.marca}</div>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-500">Código: </span>
                      <span className="font-medium text-gray-900">{f.codigo_interno}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Status: </span>
                      <span className="font-medium text-green-600">Disponível</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => openEmprestar(f)} className="w-full justify-center text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg inline-flex items-center font-medium transition-colors uppercase tracking-wider text-sm">
                  <Hand className="h-5 w-5 mr-2" /> Emprestar
                </button>
              </div>
            </div>
          ))
        ) : (
          emprestimos.map((emp) => (
            <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-start">
                <div className="h-12 w-12 flex-shrink-0">
                  {emp.ferramenta?.foto_path ? (
                    <img className="h-12 w-12 rounded-lg object-cover" src={imageUrls[emp.ferramenta_id] || ''} alt="" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Wrench className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{emp.ferramenta?.nome}</h3>
                  <div className="mt-3 space-y-1">
                    <div className="text-sm">
                      <span className="text-gray-500">Funcionário: </span>
                      <span className="font-medium text-gray-900">{emp.funcionario?.nome}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Retirada: </span>
                      <span className="font-medium text-gray-900">{format(new Date(emp.data_emprestimo), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex space-x-2">
                <button onClick={() => openDevolucao(emp)} className="flex-1 justify-center text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-4 py-3 rounded-lg inline-flex items-center font-medium transition-colors uppercase tracking-wider text-sm">
                  <CornerDownLeft className="h-5 w-5 mr-2" /> Devolver
                </button>
                <button onClick={() => handleMarcarPerdida(emp.ferramenta_id)} className="flex-none justify-center text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-lg inline-flex items-center transition-colors" title="Marcar como perdida">
                  <AlertTriangle className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
"""

new_content += mobile_code

with open('src/pages/operador/Ferramentas.tsx', 'r') as f:
    full_code = f.read()

full_code = full_code.replace(old_content, new_content)

with open('src/pages/operador/Ferramentas.tsx', 'w') as f:
    f.write(full_code)

print("Updated successfully")
