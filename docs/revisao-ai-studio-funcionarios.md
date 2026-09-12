# Revisão do redesenho do AI Studio

Base revisada: eb08be551eb97204b6bd1ecf497217c8c73094e0, comparada com 129b8eb49349e6e1a6e97c43878152a97463d033. Correções em branch separada; não publicadas automaticamente.

## Problemas corrigidos

- Lockfile regredido para versão 5.0.0, sem entradas de Firebase, tipos React e JSZip direto. npm ci falhou na base recebida. Restaurado o lockfile compatível com o package.json existente; npm ci aprovado sem atualizar dependências.
- Modal podia fechar por Escape/X/Cancelar durante gravação e mantinha os campos editáveis. Agora bloqueia fechamento e edição durante o salvamento e usa trava síncrona contra submissões repetidas.
- Modal sem contenção de foco, restauração de foco ou bloqueio do fundo. Componente compartilhado usa portal, inert no fundo, bloqueio de rolagem, título acessível, Tab/Shift+Tab/Escape e devolução do foco. Mantém confirmação de descarte. Aplicado também à alteração de obra em massa.
- Criação seguida de falha na foto deixava o ID recém-criado esquecido; tentar novamente podia cadastrar outra pessoa. ID agora é preservado imediatamente e nova tentativa atualiza o mesmo cadastro. Na edição, upload ocorre antes da atualização conjunta dos campos/foto; falha no upload não grava parcialmente o formulário. Falhas de comunicação após um INSERT sem resposta continuam dependentes de idempotência no servidor; não se promete eliminar toda duplicação possível.
- Erro do formulário compartilhava estado com atualização periódica da lista e podia desaparecer. Estados agora separados.
- Selecionar todos comparava apenas quantidades; uma busca com outros IDs podia aparecer selecionada indevidamente. Seleção agora compara IDs e preserva escolhas fora da busca. Aplicado à lista e ao ZIP; controle também disponível no celular.
- Alteração de obra em massa trocava somente obra_id, deixando nome da obra antigo na tela. Atualiza também o objeto da obra associado.
- ZIP permitia trocar grupo durante geração, combinando a seleção antiga com a apresentação nova. Controles agora bloqueados enquanto carrega/gera; contagens adicionadas aos grupos.
- Avatar podia manter estado de imagem anterior ao trocar caminho e não tratava falha de decodificação. Instância vinculada ao caminho, cancelamento/limite da requisição, onError e opção de tentar novamente; iniciais legíveis.
- Restaurados contador e atualização manual da lista removidos pelo redesenho. Edição preserva opções de função/obra atuais que não estejam na lista de ativos. Nome/tipo/status visíveis no cabeçalho da ficha.

Layout do AI Studio preservado: fotos ao lado do nome, cadastro/edição centralizados e relatório no rodapé. Cálculos/PDF/ZIP e métodos de compras não foram reescritos. Não houve gravação no Supabase nesta revisão.

## Compras: somente inspeção, conforme Pedro

Os arquivos src/lib/api-materiais.ts e src/pages/admin/ComprasMateriaisTab.tsx permanecem intactos.

Confirmado no Supabase real: excluir_compra_material(p_empresa_id uuid, p_usuario_id uuid, p_compra_id uuid) existe e devolve UUID. Confere perfil ADMIN/ativo do usuário informado e empresa da compra. A FK compras_materiais_itens.compra_id possui ON DELETE CASCADE; material_movimentacoes.compra_item_id também. Nenhuma exclusão foi executada para teste.

Pontos para os testes de Pedro:
- O botão Excluir não tem trava específica contra cliques repetidos; no detalhe ele continua renderizado durante a requisição.
- fetchData captura falhas de recarga internamente e pode mostrar “Erro ao cadastrar fornecedor”, inclusive após exclusão. Isso pode deixar a lista antiga sem deixar claro se a exclusão já ocorreu.
- A autorização da RPC depende do ID de usuário fornecido pelo cliente, no modelo de autenticação legado. O problema de identidade/SECURITY DEFINER já identificado na auditoria não foi resolvido pelo botão novo. Não considerar a checagem de perfil na tela uma garantia de autorização do servidor.

Script rewrite_funcionarios.js adicionado pelo AI Studio não é referenciado pelos scripts do package.json e usa require em projeto ESM; preservado, não executado. É um artefato auxiliar, não parte da funcionalidade.

## Validação

Instalação limpa aprovada após restaurar lockfile. TypeScript e 42 testes aprovados, incluindo cinco novos testes sobre seleção e salvamento com falha de foto. Build de produção aprovado com avisos preexistentes de imports mistos. Diff dos dois arquivos de compras vazio.

Não houve teste interativo autenticado no site, nem operação de cadastro/exclusão real. As verificações de modal são revisão de código/compilação; não equivalem a teste visual em navegador. A homologação interativa permanece pendente.
