# Destinação individual de EPI

Na compra, a quantidade inteira de um item EPI determina a quantidade de seletores de funcionário. Cada posição corresponde a uma unidade da compra (por exemplo, um PAR). Funcionários podem se repetir. Todos devem estar ativos e vinculados à obra selecionada.

A compra é enviada uma única vez à RPC existente `registrar_compra_material`: cada posição vira um item de quantidade 1, com o mesmo material, unidade e preço, e seu próprio `funcionario_id`. Assim, o cabeçalho da compra permanece único. Os detalhes mostram as destinações em linhas separadas; os relatórios existentes somam as quantidades e valores. Não há alteração de schema, RPC, compras antigas ou comprovação de entrega física.

Ao mudar de obra, os nomes são limpos; consultas antigas não podem substituir a lista da obra atual. A redução de quantidade exige confirmação se remover nomes preenchidos. Aumento mantém os nomes. Há limite de 1000 destinações por item para evitar travar o formulário; compras maiores podem ser divididas em mais itens. EPI exige quantidade inteira; as demais categorias mantêm quantidades fracionárias.

Validação: testes de três destinatários, repetição, nomes ausentes/fora da obra, quantidades inválidas e redimensionamento. Teste real no Supabase executado em BEGIN/ROLLBACK: três pares a R$ 10 para três funcionários resultaram em uma compra, três itens, três movimentações, quantidade 3 e total R$ 30 no relatório. Nenhuma compra de teste permaneceu gravada.

Não foi realizado teste visual autenticado no navegador nesta etapa.
