# EPI destinado a diferentes obras

O seletor inicial inclui “Várias obras — EPI”. Nesse modo, cada unidade tem obra e funcionário obrigatórios. Somente EPIs são permitidos. Uma compra e um recibo podem ter destinações diferentes; não se cria uma obra fictícia.

O cabeçalho usa obra_id nulo nesse modo. Cada item grava obra_destino_id, validado contra a empresa e a obra do funcionário ativo. Compras normais continuam com obra no cabeçalho e o mesmo contrato de RPC. Itens antigos usam COALESCE(item.obra_destino_id, compra.obra_id), sem atualização destrutiva dos registros. Transferir funcionários no futuro não muda as obras dos gastos históricos.

A movimentação usa a obra do item. A view de relatório mantém as colunas e usa o destino para obra, obra principal e filtros; os consumidores de estoque, painel e quantidades recebem a mesma atribuição. Lista e detalhes apresentam nomes reais das obras. Excel inclui funcionário e recibo, e busca dados novos para o filtro selecionado; o resumo de produtos também separa unidade e categoria nas fórmulas.

Migration aplicada: 20260915165426_epi_obras_por_destinacao. Tipos regenerados do Supabase real. Não foi inserido dado definitivo de teste.

Validação: 61 testes passaram, incluindo geração do arquivo Excel em memória. Teste real transacional revertido confirmou compra única de 3 pares, total R$ 30, duas obras com R$ 20 e R$ 10, movimentações corretas, histórico após transferência, rejeição de funcionário incompatível, rejeição de não EPI e compatibilidade do cliente antigo. Sem novos avisos de segurança no comparativo dos advisors. Não houve teste visual autenticado no navegador.
