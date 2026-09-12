# Revisão 8.1 — 12/09/2026

Base: main 2dccd5cb23717990e4a6eefcc26fdf6c731a9ed5. Alterações para revisão em branch própria. Sem publicação em produção nesta etapa.

## Supabase real consultado

- 579 colunas em 47 tabelas/views públicas; comparação dos nomes de relação/coluna com o catálogo de 11/09 sem inclusões ou exclusões. Isso não afirma igualdade de defaults, tipos, funções ou permissões não comparados nesta rodada.
- 39 funcionários, 23 ativos; nenhum inativo sem desligamento.
- Nenhuma duplicação de funcionário/data em presenças; nenhuma presença vinculada a funcionário/obra de outra empresa nas verificações executadas.
- Nenhuma tabela pública na publicação realtime. O dashboard dependia exclusivamente dessa assinatura para atualizar depois de aberto.
- View vw_relatorio_presencas confirmada: valor por função atual, obra da presença real e faltas sintéticas; não incorpora medical_certificates.
- Trigger de funcionários confirmado: desativar preenche desligamento e reativar limpa desligamento. Não foi necessário alterar isso no frontend. Continua usando CURRENT_DATE do banco.
- Policies de funcionarios, presencas e medical_certificates continuam permitindo acesso amplo. Autenticação legada no cliente não foi migrada. O bloqueio de empresa no cliente não constitui segurança de servidor.

## Correções

1. Dashboard: atualização a cada 60 segundos enquanto visível, ao recuperar conexão/foco; descarte de resposta após desmontagem, sem criar assinatura realtime que não recebe eventos.
2. Data de hoje no dashboard fixada em America/Maceio, com revisão a cada 30 segundos para a virada do dia.
3. Obra registrada na presença prevalece sobre a lotação atual ao distribuir funcionários nos cards, inclusive presença de funcionário posteriormente desativado.
4. Card da própria obra principal passa a usar apenas funcionários diretamente nela; o agregado com subobras continua no cabeçalho, evitando repetir agregado como se fosse frente independente.
5. Custo do dashboard usa registros do mesmo relatório central com atestados; soma em centavos, preserva meia diária, falta zero e CLT fora das diárias. Presença física/composição operacional continuam baseadas nos registros de presença; a convenção atestado=presente do futuro e-mail não foi aplicada indiscriminadamente a indicadores operacionais.
6. Consultas com withEmpresa e inclusões com addEmpresaId falham quando não há empresa na sessão, em vez de prosseguir sem filtro. Métodos de login permanecem separados. Ainda não protege contra adulteração da sessão nem substitui RLS.
7. Paginação completa e ordenação estável para presenças do dia e funcionários por obra.
8. Consulta de atestados ativos para a tela de presença não considera sábado/domingo como afastamento pago, conforme regra segunda a sexta já definida; datas inválidas geram erro.
9. AppUpdater não bloqueia a renderização inicial aguardando version.json; limite de 10 segundos na consulta. Limpeza de intervalos/listeners de registro do service worker.
10. Service worker limita a limpeza aos caches com prefixos conhecidos do sistema. Navegação tenta cache após 5 segundos sem resposta de rede, quando existir cache.
11. Versão 8.1 em package.json/lockfile e arquivos gerados de versão. Versão do pacote Android não alterada, pois não foi gerado APK.

## Validação

- TypeScript aprovado; 46 testes aprovados, incluindo novos casos de fuso, transferência, custo com atestado/CLT e escopo de empresa.
- Build de produção e service worker aprovados. Avisos anteriores de imports estáticos/dinâmicos permanecem.
- Dependências reaproveitadas da instalação validada anterior; nenhuma dependência atualizada, lockfile só mudou versão raiz.
- Arquivos api-materiais.ts e ComprasMateriaisTab.tsx preservados. A proteção compartilhada contra ausência de empresa também é usada por consultas de materiais; não houve mudança de regras de compras.
- Nenhuma gravação/migration no Supabase; nenhuma mensagem enviada; módulo de e-mail não implementado.
- Sem homologação interativa autenticada em navegador ou testes de escrita em dados reais. Build/testes não equivalem a garantia de ausência de bugs.

## Pendências relevantes

- Autenticação legada e policies amplas exigem migração coordenada; não é seguro trocar permissões isoladamente e interromper os usuários.
- Valores históricos continuam dependendo da função/tarifa atual, pois não existe snapshot financeiro implementado.
- Função antiga getDashboardStats (sem consumidores encontrados em src) continua fora do cálculo central; revisão concentrou o dashboard efetivamente utilizado.
- Faltas no dashboard continuam incluindo funcionários sem registro; a distinção operacional entre não lançado e falta não foi redesenhada nesta rodada.
- Problemas já documentados de compras (cliques repetidos/exclusão e erro de recarga) preservados conforme instrução anterior de somente inspecionar esse módulo.
- Causa histórica da tela com 38 permanece não demonstrada; a consulta atual confirma 39, sem evidência para atribuir o evento antigo a cache ou deploy.
