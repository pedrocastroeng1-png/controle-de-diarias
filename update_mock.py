import sys

with open('src/lib/api.ts', 'r') as f:
    code = f.read()

mock_data = """[
         { id: '1', titulo: 'Ferramenta não devolvida', mensagem: 'A ferramenta Martelete Bosch continua registrada como emprestada.\\n\\nFavor verificar se houve esquecimento na devolução.', tipo: 'ferramenta_pendente', created_at: new Date().toISOString() },
         { id: '2', titulo: 'Ferramenta Quebrada', mensagem: 'O operador João relatou que a Furadeira de Bancada quebrou durante o uso.', tipo: 'ferramenta_quebrada', created_at: new Date().toISOString() },
         { id: '3', titulo: 'Novo Atestado', mensagem: 'João enviou um atestado de 2 dias.', tipo: 'novo_atestado', created_at: new Date().toISOString() },
         { id: '4', titulo: 'Comunicação Não Visualizada', mensagem: 'A comunicação "Aviso Geral" enviada há 2 dias ainda não foi visualizada por 3 operadores.', tipo: 'comunicacao_nao_visualizada', created_at: new Date().toISOString() }
       ];"""

code = code.replace("""[
         { id: '1', titulo: 'Ferramenta não devolvida', mensagem: 'Martelete Bosch continua com o operador.', tipo: 'ferramenta_pendente', created_at: new Date().toISOString() },
         { id: '2', titulo: 'Novo Atestado', mensagem: 'João enviou um atestado de 2 dias.', tipo: 'novo_atestado', created_at: new Date().toISOString() }
       ];""", mock_data)

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

print("Mock updated")
