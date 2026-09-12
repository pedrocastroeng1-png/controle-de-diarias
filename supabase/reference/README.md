# Referência do Supabase real — 11/09/2026

Projeto: `controle-diarias` (`rijekzuumimvvupdapmc`). Origem: consultas somente leitura ao catálogo PostgreSQL e geração oficial de tipos pelo Supabase.

- `schema-2026-09-11.json`: colunas das tabelas/views públicas, constraints, índices, definições de views/triggers, assinaturas de funções, RLS/policies, configurações de buckets, publicações e nomes/versões de migrations.
- `../../src/types/database.generated.ts`: contrato TypeScript gerado, sem dados de funcionários nem credenciais.

Esta captura contém 31 tabelas públicas, 16 views, 35 funções públicas, 26 triggers públicos não internos, 125 índices e 53 versões de migrations. Esses números foram recontados no catálogo e substituem números divergentes do texto inicial da auditoria.

## Não executar como migration

O JSON é um inventário, **não** um dump restaurável. Não contém corpos de funções, grants completos, segredos, objetos binários, dados, Auth ou configurações de Edge Functions/cron. Não reproduz o ambiente sozinho. Migrations antigas e SQLs soltos na raiz não são a verdade atual; não executar `db push`, `db reset --linked`, `db pull` com alteração de histórico remoto ou SQLs antigos contra produção.

Para uma baseline restaurável ainda é necessário exportar schema com mecanismo oficial, revisar segredos e permissões, incluir dependências Auth/Storage e testar restauração num ambiente descartável separado. Não se deve fabricar 53 migrations vazias ou reexecutar o histórico na produção.

## Atualização

Regenerar os tipos pelo Supabase a cada mudança de schema. Atualizar o inventário por consultas somente leitura e executar `npm run check` e `npm run build`. O teste local detecta tabelas/RPCs literais ausentes no inventário e erros TypeScript; não consulta produção automaticamente e não certifica RLS, atomicidade ou todos os SELECTs dinâmicos.

Documentação: https://supabase.com/docs/guides/api/rest/generating-types
