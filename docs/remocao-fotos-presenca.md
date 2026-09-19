# Remoção das fotos de presença

## Escopo e publicação

Alteração iniciada em 19/09/2026 sobre `b4c381b`. A primeira etapa foi integrada pelo PR #7 e publicada em produção no commit `0e51ee1`, antes da remoção das colunas.

- Presença: marcar presente/ausente, confirmar e salvar, sem câmera, upload, preview, compressão ou substituição de fotografia.
- API: removida a exigência de foto para OPERADOR e os métodos exclusivos de upload, exclusão e auditoria de fotos de presença.
- Quadro Atual: mantém a hierarquia de obras e contagem por função, inclusive acesso CONSULTA. A rota `/admin/auditoria` permanece por compatibilidade com links e notificações existentes.
- PDF: removidas consultas de metadados, URLs e miniaturas. Os cálculos não foram modificados.
- Painel do Operador: removido o horário derivado da foto, pois não comprovava conclusão da presença.
- Fotos de funcionário, atestado e ferramenta preservadas.
- Lockfile sincronizado com o package.json existente; a instalação inicial com `npm ci` estava bloqueada por dependências ausentes no lockfile.

## Banco real

Migration aplicada: `20260919192504_remove_attendance_photos`.

- Recriada `public.vw_relatorio_funcionarios_clt` sem `photo_path` e `photo_taken_at`, conservando seleção, joins, filtro, owner e permissões existentes.
- Removidas somente `public.presencas.photo_path`, `photo_taken_at` e `photo_taken_by`.
- Removido o Cron `cleanup-attendance-photos-daily`.
- Removidas as policies de `storage.objects`: `Allow anon all attendance photos` e `Allow authenticated all attendance photos`.
- Removidos pela API de Storage os 336 arquivos e o bucket `attendance-photos`.
- `vw_relatorio_presencas` e `vw_folha_diarias` não foram alteradas.

A migration bloqueia alterações concorrentes em presencas durante a operação e compara os dados antes/depois na mesma transação. Divergência gera exceção e rollback.

## Comparação real antes/depois

| Verificação | Antes | Depois |
|---|---:|---:|
| Registros físicos de presença, todo o histórico | 997 | 997 |
| Presenças integrais físicas | 889 | 889 |
| Meias diárias físicas | 1 | 1 |
| View CLT, linhas | 89 | 89 |
| Folha SQL, 01/09 a 18/09/2026 | R$ 21.600,00 | R$ 21.600,00 |
| Folha SQL, 01/08 a 18/09/2026 | R$ 48.720,00 | R$ 48.720,00 |
| Relatório SQL, meias de 01/08 a 18/09 | 1 | 1 |
| Relatório do aplicativo com atestados, 01/09 a 18/09 | 225 integrais; 0 meias | 225 integrais; 0 meias |
| PDF e Excel com atestados, 01/09 a 18/09 | R$ 21.920,00 | R$ 21.920,00 |

A diferença entre o valor bruto das views SQL e o relatório do aplicativo já existia: o aplicativo aplica o tratamento de atestados. Não foi introduzida pela remoção das fotos. A meia diária real é de 03/08/2026.

Foram comparados hashes de todos os campos não fotográficos de presencas e da view CLT, além das linhas completas dos relatórios/folha nos períodos selecionados. Todos iguais:

- Presencas: `f62474d5e02250541b406bd35f46243f`.
- CLT: `c52aae36ef6e69ca8582aff817f4aab6`.
- Folha setembro: `44734d2be79090081381708418898e25`.
- Relatório setembro: `6c0210d29afcb144f2426f88d2b86c1a`.
- Folha agosto/setembro: `49612b3173aff578424a4e3faf6734f9`.
- Relatório agosto/setembro: `a96a5e396015605ee39cb646df4d791c`.

## Preservação das outras fotos

- `employee-photos`: 34 objetos, hash de IDs/caminhos `98f7b79fbe8043411e4e21a28e3c522e`, inalterado.
- `medical-certificates`: 5 objetos, hash `e31d3206677498db768f600c34be269c`, inalterado.
- `fotos_ferramentas`: bucket preservado, já estava vazio.
- `funcionarios.photo_path`: 31 referências cadastradas, inalteradas.
- `medical_certificates`: 4 registros, comparação de todos os campos inalterada.
- Buckets `communication-files` e `branding-assets` também preservados.

## Validação

- TypeScript (`npm run lint`): aprovado.
- Build de produção e service worker (`npm run build`): aprovados.
- Suíte (`npm test`): 69 testes aprovados, zero falhas.
- Teste da API real com transporte simulado: ADMIN e OPERADOR salvam sem campos de foto; falta e meia diária preservadas; CONSULTA e feriados continuam bloqueados.
- Testes existentes de atestados, feriados, meia diária, valores financeiros, relatório ZIP e fotos cadastrais aprovados.
- Executados os handlers reais de PDF e Excel das versões anterior e posterior sobre snapshots reais do período, com nomes anonimizados. Ambos mantiveram 225 diárias e R$ 21.920,00; Excel foi reaberto para validar as células de totais. PDF final sem imagens; primeiras páginas renderizadas e inspecionadas.
- Bundle efetivamente servido em produção: sem `attendance-photos` e `photo_taken_at`, contendo Quadro Atual e os três tipos de foto preservados.
- Não houve sessão autenticada de ADMIN/OPERADOR/CONSULTA disponível para validação manual ponta a ponta no navegador. A conferência desses perfis foi por código e testes automatizados; isso não equivale a um teste manual em produção.

## Arquivos

Alterados: `src/App.tsx`, `src/components/layout/Layout.tsx`, `src/components/WhatsNewScreen.tsx`, `src/lib/api.ts`, `src/lib/types.ts`, `src/pages/admin/Relatorios.tsx`, `src/pages/admin/Usuarios.tsx`, `src/pages/operador/Presenca.tsx`, `src/pages/operador/Painel.tsx`, `src/types/database.generated.ts` e `package-lock.json`.

`src/pages/admin/AuditoriaPresencas.tsx` foi substituído por `src/pages/admin/QuadroAtual.tsx`. Removido `src/lib/imageUtils.ts`, usado exclusivamente pela foto de presença. Adicionados `tests/presenca-sem-foto.test.ts`, a migration e este relatório.

Removidos 23 scripts avulsos obsoletos que recriavam a infraestrutura antiga ou testavam suas fotos: `analyze_photos.mjs`, `first_run_cleanup.mjs`, `fix.js`, `fix2.cjs`, `fix3.cjs`, `fix3.js`, `fix_auditoria.cjs`, `fix_auditoria_syntax.cjs`, `fix_getPhotoUrl.cjs`, `patch_admin_btn.cjs`, `patch_auditoria.cjs`, `patch_auditoria.py`, `patch_auditoria2.py`, `patch_auditoria_dropdown.cjs`, `patch_checkpoints.py`, `patch_handleExportPDF.py`, `patch_meia_diaria_usages.py`, `patch_pdf.py`, `patch_pdf_layout.py`, `patch_relatorios2.py`, `retention_policy.sql`, `run_pdf_test.js`, `test_signedurl.js`. Nenhum era executado pelo build ou pelos scripts npm.

Os tipos regenerados também refletem `usuarios.arquivado` e `usuarios.arquivado_em`, já existentes no banco; esta tarefa não criou nem alterou essas colunas.

## Pendência de infraestrutura

A Edge Function `cleanup-attendance-photos` ainda possui cadastro no projeto. O conector disponível não oferece exclusão de Edge Functions e a CLI não está autenticada. A função foi neutralizada: versão 6, JWT obrigatório, apenas resposta HTTP 410, sem leitura/escrita no banco ou Storage. O Cron foi excluído. A exclusão definitiva do cadastro depende de acesso autenticado ao painel ou à API de gerenciamento.

Não há dependência executável de foto de presença no aplicativo. As referências restantes em migrations antigas e no snapshot datado `supabase/reference/schema-2026-09-11.json` são histórico imutável, não o esquema atual; a migration de remoção registra a transição.

Aplicativos/abas que ainda estejam com a versão anterior em cache precisam aceitar a atualização ou recarregar antes de registrar presença; a versão antiga enviava colunas que já foram removidas. Não é necessário apagar registros nem reinstalar o PWA.
