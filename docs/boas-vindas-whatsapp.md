# Boas-vindas pelo WhatsApp

Após criar um usuário, ADMIN e OWNER veem a prévia do guia. O ícone de conversa na lista permite reabrir a prévia para usuários ativos. O cadastro oferece WhatsApp brasileiro opcional com DDD; o número é normalizado com 55 no campo existente `public.usuarios.telefone`.

A mensagem inclui nome, login (e-mail é opcional), instalação Android/iPhone e instruções de presença, compras/EPI e empréstimos/devoluções. Perfil CONSULTA não recebe instruções para registrar operações; no cadastro ADMIN, permissões personalizadas limitam as seções do guia. O OWNER lista dados básicos e apresenta o guia do perfil, orientando usar apenas funções liberadas.

O botão abre `wa.me` com texto codificado; a confirmação de envio ocorre no WhatsApp. Não existe envio automático, integração paga, registro de entrega ou compartilhamento de senha. É possível copiar a mensagem. Alterar o número na prévia vale só para aquele envio; para persistir, editar o cadastro ADMIN. Nenhuma migration, alteração de permissões ou de cálculos financeiros foi necessária.

## Verificação em 22/09/2026

- Supabase real: `usuarios.telefone` confirmado como `text` nullable.
- TypeScript e build de produção aprovados.
- 74 testes aprovados. Novos testes cobrem normalização de telefone, URL/Unicode, omissão de senha e tokens, consulta/permissões, API de criação/edição/remoção de telefone, preservação quando campo omitido e recusa de OPERADOR.
- Testes de API usam transporte Supabase simulado; não foram criados usuários nem enviados WhatsApps reais.
- Tentativa de inspeção visual local bloqueada pelo navegador (`ERR_BLOCKED_BY_CLIENT` para localhost). Verificação em celulares Android/iPhone e envio real permanecem para teste de aceitação.
