import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_func = """sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string }): Promise<void> => {"""
new_func = """sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id, usuario_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string, usuario_id?: string }): Promise<void> => {"""

old_insert = """      .insert([{ 
        title: titulo, 
        message: mensagem,
        type: 'INFO',
        priority: 'NORMAL',
        target_audience: 'OPERATOR'
      }])"""
new_insert = """      .insert([{ 
        title: titulo, 
        message: mensagem,
        type: 'INFO',
        priority: 'NORMAL',
        target_audience: 'OPERATOR',
        created_by: usuario_id || null
      }])"""

if old_func in content and old_insert in content:
    content = content.replace(old_func, new_func)
    content = content.replace(old_insert, new_insert)
else:
    print("old_func or old_insert not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

with open('src/pages/admin/CentralComunicacoes.tsx', 'r') as f:
    content = f.read()

content = content.replace("sugestao_id: sugestao.id", "sugestao_id: sugestao.id,\n        usuario_id: usuario?.id")
content = content.replace("destinatarios: destinatarios", "destinatarios: destinatarios,\n        usuario_id: usuario?.id")

with open('src/pages/admin/CentralComunicacoes.tsx', 'w') as f:
    f.write(content)

