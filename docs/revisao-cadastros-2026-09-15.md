# Revisão de produtos e feriados — 15/09/2026

Base: main 3caf7d4577f73d0a9f9df60d483cfd41dba9e67b. Supabase: controle-diarias (rijekzuumimvvupdapmc).

## Entrega

- Cadastros → Produtos: listagem, busca, categoria, ativos/inativos, cadastro e edição em modal centralizado, unidades permitidas, unidade padrão, observação e desativação. Escrita exclusiva de administrador validado no servidor. Apontador seleciona produtos ativos e unidades permitidas.
- Aproveita materiais e material_categories reais; não cria catálogo paralelo. Foram encontrados 692 produtos.
- A unidade escolhida é persistida no item e na movimentação da compra. Views e agregação por obra/material/unidade separam KG de UN. O total monetário continua somável. Desativação não apaga itens; detalhes e relatórios continuam exibindo produtos inativos.
- Compras antigas não possuíam unidade por item. unidade_catalogo_legado registra a unidade do catálogo na migração, preservando a interpretação usada nos relatórios anteriores. unidade_compra permanece nula nesses itens: não alegamos conhecer a unidade efetivamente usada na compra histórica.
- Feriados: cadastro e remoção com prévia calculada no banco, conferência do impacto na confirmação e auditoria privada. Original de presenças/atestados preservado. Trigger bloqueia novas presenças e meias-diárias em feriados, inclusive por clientes antigos. A view financeira zera a data e inclui funcionários elegíveis sem inserir faltas artificiais.
- Corrigido fallback que tratava falha de acesso a feriados como lista vazia. Agora o erro bloqueia cálculo/exportação afetado em vez de ignorar feriados.
- Contagem financeira compartilhada: meia diária 0,5; atestado elegível 1; feriado 0. Mantida inclusão imediata de datas futuras do atestado dentro do período e vínculo. PDF/Excel de pagamento apresentam atestado como presença; imagem médica não é anexada ao PDF de pagamento.
- Retirada referência ao SVG genérico (texto Arial dentro de círculo). Favicon e Apple touch icon usam novamente a marca original. Manifest preserva identidade, início e escopo. A imagem original ainda contém fundo: não foi inventada ou aprovada uma nova arte transparente. O JPEG gerado pelo AI Studio não tem canal alfa. Remoção fiel do fundo continua sendo uma tarefa visual separada.
- Lockfile restaurado à base auditada: removida dependência JWT desnecessária; sessão assinada HMAC no servidor. TypeScript agora verifica também api e server.

## Banco já aplicado

- 20260914205642_create_feriados_company_scoped_protected: tabela base, aplicada na etapa anterior; registrada aqui com SQL do histórico real.
- 20260915012822_cadastros_produtos_feriados: produtos/unidades, feriados, bloqueio, prévia, auditoria e views.
- 20260915013422_limitar_tentativas_login: limite persistente de 20 tentativas por identificador a cada janela de 15 minutos; identificador armazenado como HMAC, não como usuário ou senha.
- Removido o rascunho 001_initial_features.sql, que recriava compra com assinatura incompatível e deixava views incompletas.
- Tipos TypeScript regenerados do projeto real após as migrations.

Não executar novamente estas migrations no projeto já atualizado. O repositório não contém baseline completo para recriar todo o banco do zero.

## Validação

- TypeScript incluindo frontend e funções do servidor: passou.
- 53 testes automatizados: passaram, incluindo ZIP, regras financeiras, paginação, assinatura/expiração/adulteração da sessão, operador sem escrita, usuário desativado, troca de empresa e erro de consulta a feriados.
- Build Vite/PWA de produção: passou. Avisos já existentes de imports estáticos/dinâmicos misturados permanecem.
- Testes no Supabase em transação revertida: cadastro/remoção de feriado, rejeição de fingerprint obsoleto, view com valores zero, bloqueio de presença, compra 2 KG + 20 UN = R$ 46, saldos separados e preservação do histórico após desativação/troca de unidade padrão.
- Limite de login testado em transação revertida: primeiras 20 aceitas; tentativa 21 rejeitada.
- Após os testes: zero feriados cadastrados, 692 produtos, nenhum item legado sem snapshot de unidade; anon/authenticated sem escrita nos novos cadastros ou execução da RPC de feriados.
- Advisors: RLS sem policies nas tabelas protegidas é intencional (somente servidor/service_role, sem grants para clientes). Alertas antigos em outras tabelas/views não foram eliminados. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Antes da publicação

- As funções devem ter SUPABASE_SERVICE_ROLE_KEY e SUPABASE_URL (ou VITE_SUPABASE_URL). Nunca colocar chave privilegiada em variável VITE_.
- JWT_SECRET é opcional, com mínimo de 32 caracteres. Sem ele, a chave de assinatura é derivada no servidor da chave privilegiada com separação de propósito. Rotação invalida sessões anteriores.
- Login valida credenciais no servidor e retorna somente dados públicos. Sessão dura 8 horas; cada endpoint consulta novamente usuário ativo, perfil e empresa. Não há fallback que libere cadastro sem sessão.
- Sessões antigas exigem sair e entrar novamente. A troca de empresa do proprietário não é credencial de administrador deste módulo; é necessário entrar com conta real da empresa para os novos endpoints.
- A ferramenta disponível não expõe variáveis de ambiente da Vercel; existência/valores não foram confirmados.
- Não houve teste autenticado ponta a ponta em navegador/aparelho. Não afirmar que todos os fluxos publicados foram testados.
- APIs e policies legadas fora do escopo ainda exigem revisão de autorização. Esta entrega não é migração completa para Supabase Auth nem garantia de ausência de bugs.
- Movimentação manual de produto com múltiplas unidades é rejeitada pela rotina legada sem seletor, para não misturar quantidades. Não há consumidor dessa rotina na interface atual; compras aceitam a unidade escolhida normalmente.

A branch é para revisão. Nenhum merge em main ou deploy de produção foi solicitado nesta etapa.
