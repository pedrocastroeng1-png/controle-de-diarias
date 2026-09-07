# Instruções de Atualização do Banco de Dados

Foi gerado o arquivo `database_fornecedores.sql` na raiz do projeto contendo a estrutura necessária para o novo módulo.

Para concluir a implementação, você deve executar este script SQL no Editor SQL do seu painel do Supabase.

O script executa as seguintes operações:
1. Cria a tabela `fornecedores` (com RLS e chaves para `empresa_id`).
2. Adiciona a coluna `fornecedor_id` na tabela `compras_materiais`.
3. Cria todos os índices necessários.
4. Habilita as políticas RLS para proteção multiempresa.
5. Atualiza a view `vw_relatorio_compras_materiais` para trazer o nome do fornecedor correto através do relacionamento sem quebrar os registros antigos (utilizando COALESCE).
