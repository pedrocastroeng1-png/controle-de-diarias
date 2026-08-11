import re

with open('src/pages/admin/CentralComunicacoes.tsx', 'r') as f:
    content = f.read()

old_hist = """                <h3 className="font-bold text-gray-900 text-lg">{h.titulo}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{h.mensagem}</p>
              
              <div className="text-xs text-gray-500 mb-4">
                Enviado por: <span className="font-medium text-gray-700">{h.remetente?.usuario || 'Sistema'}</span>
              </div>"""

new_hist = """                <h3 className="font-bold text-gray-900 text-lg">{h.title || h.titulo}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                  {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <p className="text-gray-700 mb-4">{h.message || h.mensagem}</p>
              
              <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                <div>Enviado por: <span className="font-medium text-gray-700">{h.remetente?.usuario || h.creator?.usuario || 'Sistema'}</span></div>
                <div className="font-semibold text-blue-600">
                  {h.push_dispatch_status === 'QUEUED' && 'Push na fila...'}
                  {h.push_dispatch_status === 'SENDING' && 'Enviando...'}
                  {h.push_dispatch_status === 'SENT' && 'Push enviado'}
                  {h.push_dispatch_status === 'PARTIAL' && 'Push parcialmente enviado'}
                  {h.push_dispatch_status === 'FAILED' && <span className="text-red-500">Falha no Push</span>}
                </div>
              </div>"""

if old_hist in content:
    content = content.replace(old_hist, new_hist)
else:
    print("old_hist not found")

with open('src/pages/admin/CentralComunicacoes.tsx', 'w') as f:
    f.write(content)

