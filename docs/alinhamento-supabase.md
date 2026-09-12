# Alinhamento com o banco real — etapa 1

Base GitHub: `f3b75ab1e1a8be54f04fc495be3adb8858a0c5e1`. Nenhuma alteração no Supabase ou deploy de produção nesta etapa.

## Corrigido no código

- Cliente Supabase deixa de ser `any` e utiliza o contrato gerado do projeto real; wrapper de empresa preserva a tipagem.
- Campos de funcionário e comunicação ausentes dos tipos passam a ter referência ao Row real. Automação usa dias numéricos e aceita os nulos reais.
- Supabase JS fixado em 2.110.1; lockfile sincronizado. Build executa TypeScript antes de gerar o bundle.
- Meio dia é calculado uma única vez (50%, não 25%); falta e CLT não geram custo no dashboard. Consulta relacional do dashboard corrigida.
- Relatórios de tela/Excel usam UUID da obra, não nome; views financeiras passam pelo filtro de empresa.
- Funcionários e relatórios consultam páginas até completar a contagem, com ordenação determinística. Mudança da contagem durante a consulta gera erro em vez de sucesso parcial. Isto não equivale a uma transação/snapshot contra edições concorrentes que mantenham a contagem.
- Funcionários atualizam ao recuperar foco/conexão e a cada minuto com a aba visível, mostram contagem/horário e descartam respostas antigas.
- Cadastro rápido de fornecedor extrai o ID do retorno tabular real. Parâmetros opcionais de RPC usam defaults documentados; compra exige fornecedor como o banco exige.
- Comunicação usa `push_dispatch_status` e reconhece destinatário ADMIN.
- QUEBRADA não existe no enum: operação bloqueada antes da escrita, botão desabilitado e tela informa indisponibilidade. Não foi substituído silenciosamente por EM_REPARO e o enum não foi alterado.

## Bloqueios para declarar o sistema pronto

1. Atestados: o frontend atual remunera dias de atestado e pode sobrepor presença/falta. A view da folha não faz isso. A regra precisa de decisão explícita; não se retirou remuneração de ninguém nesta etapa. A correção do filtro/paginação não resolve essa divergência.
2. Ferramenta quebrada: decidir entre um status novo e um fluxo com os status existentes; qualquer mudança no enum exige migration autorizada.
3. Segurança: RLS público, autenticação customizada em usuarios, policies de Storage e funções privilegiadas continuam como estavam. Isolamento via filtro do navegador não é segurança. Migração de Auth/RLS exige contas e estratégia de transição para não bloquear usuários.
4. Baseline: inventário/tipos não substituem dump restaurável, grants, corpos de funções, Edge Functions, secrets e cron. Histórico local/remoto ainda não está integralmente reconciliado.
5. Realtime de presencas/funcionarios não está publicado. Atualização da lista usa polling; demais telas que dependem exclusivamente de realtime continuam pendentes.
6. Datas/duplicidades: não mudar data de cadastro/admissão/desligamento nem consolidar pessoas por nome. A data provisória do relatório futuro não foi implementada.
7. Histórico financeiro: as views usam valor atual da função, não um snapshot monetário gravado na presença. Alterar função/valor pode recalcular histórico. A tela ainda aplica filtro de admissão/desligamento além da view; alinhar isso exige confirmar o tratamento de presenças reais fora do vínculo.
8. Operações de ferramentas com múltiplas escritas não são todas transacionais. Não foram testadas com escritas em produção.
9. Integrações Auth, Android/push, pagamentos, Storage e gravações completas precisam de homologação em ambiente separado. Testes unitários/build não demonstram ausência de bugs.

## Correções à auditoria narrativa

- A causa histórica do 38 não está provada. Estado React antigo é hipótese; não existe telemetria daquela sessão. O banco reconsultado tem 39.
- Usar os totais do inventário atual: 35 funções, 26 triggers públicos não internos, 53 migrations. A contagem inicial do texto não era precisa.
- A view de relatório tem 1.065 linhas; a folha tem 714 e soma R$ 70.020,00 na consulta de 11/09/2026. Totais não são comprovantes de transferência.

## Validação e próximo passo

Validação local em 11/09/2026: `npm ci --ignore-scripts` passou, `npm run check` passou (TypeScript + 19 testes), `npm run build` passou com avisos existentes de bundle grande/importações mistas. Testes cobrem fórmula, paginação, retornos RPC e nomes literais de relações/RPCs; não houve gravação em produção. Não houve homologação visual/end-to-end: o navegador de verificação não está instalado neste ambiente. Revisar diff em branch separada. Não fazer merge para main antes das decisões acima e da homologação. ZIP e financeiro CLT continuam fora desta etapa.
