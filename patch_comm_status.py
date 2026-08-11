import re

with open('src/pages/admin/Communications.tsx', 'r') as f:
    content = f.read()

old_footer = """                      <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Criado em {format(parseISO(c.created_at), 'dd/MM/yyyy')}</span>
                        <span className="flex items-center">"""

new_footer = """                      <div className="flex items-center flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Criado em {format(parseISO(c.created_at), 'dd/MM/yyyy')}</span>
                        {c.push_dispatch_status && (
                          <span className={`flex items-center font-semibold ${c.push_dispatch_status === 'FAILED' ? 'text-red-500' : 'text-blue-600'}`}>
                            {c.push_dispatch_status === 'QUEUED' && 'Push na fila...'}
                            {c.push_dispatch_status === 'SENDING' && 'Enviando...'}
                            {c.push_dispatch_status === 'SENT' && 'Push enviado'}
                            {c.push_dispatch_status === 'PARTIAL' && 'Push parcialmente enviado'}
                            {c.push_dispatch_status === 'FAILED' && 'Falha no Push'}
                          </span>
                        )}
                        <span className="flex items-center">"""

if old_footer in content:
    content = content.replace(old_footer, new_footer)
else:
    print("old_footer not found")

with open('src/pages/admin/Communications.tsx', 'w') as f:
    f.write(content)

