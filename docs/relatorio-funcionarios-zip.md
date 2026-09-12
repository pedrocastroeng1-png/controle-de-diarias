# Relatório de Funcionários em ZIP

Implementação autorizada por Pedro em 12/09/2026. Disponível na branch de revisão, sem merge/deploy de produção nesta etapa.

## Uso

Na página Funcionários, abrir Relatório de Funcionários, escolher ativos ou inativos, selecionar todos ou alguns cadastros, gerar e clicar em Baixar ZIP. A seleção do relatório é independente da seleção para alterar obras em massa. Trocar de grupo limpa a seleção e o download anterior.

Cada PDF inclui foto quando cadastrada, nome, status, tipo, função/obra atuais, cadastro em horário de Maceió, admissão e desligamento somente de inativos. Inclui método de pagamento, dados Caixa ou PIX conforme o método escolhido e observação. Ausências são explicitadas como Não informado. Arquivos usam nome sanitizado e UUID completo para preservar homônimos.

Diaristas recebem resumo de presenças integrais, meias diárias, dias de atestado e total calculado. Categorias não se sobrepõem. CLT recebe somente a ficha cadastral; nenhum total diário ou módulo de salários.

## Fonte e cálculo

Usa getRelatorioComAtestados sem filtro de período/obra, a mesma camada compartilhada dos relatórios existentes. Preserva a regra já implementada de vínculo, atestados segunda a sexta e um registro por funcionário/dia. Não comprova transferências. O cálculo histórico ainda usa valores da função atual, conforme a estrutura real do banco. As views brutas do Supabase ainda não incorporam atestados; a conciliação definitiva dessas views continua pendente da etapa de alinhamento.

A geração consulta novamente os cadastros e valida empresa, IDs e status antes de gerar. Falhas de histórico, valores inválidos ou fotos cadastradas indisponíveis interrompem o ZIP, sem apresentar resultado parcial como concluído. A foto é acessada por URL assinada já suportada pela API, convertida localmente em JPEG com proporção preservada. ZIP e imagens convertidas ficam em memória; URLs locais são liberadas. JSZip 3.10.1 declarado como dependência direta; módulo exportador carregado sob demanda.

As consultas paginadas não são um snapshot transacional. Alterações simultâneas de valores/cadastros durante a leitura ainda podem exigir nova geração. A autenticação/RLS preexistente não foi reformulada por este recurso; o filtro de empresa no cliente não substitui autorização no servidor.

## Correção pontual autorizada no banco

Aplicado o script supabase/data-fixes/desligamentos-inativos-2026-09-04.sql ao projeto controle-diarias. Exatamente os dois IDs explicitamente elegíveis receberam 2026-09-04 em data_desligamento. A verificação antes/depois confirmou as outras 14 datas preservadas. Não há presenças desses dois cadastros depois de 04/09/2026. O script exige duas alterações ou reverte a operação; não roda automaticamente no app e não cria regra para futuros inativos. Não houve alteração estrutural nem migration.

## Verificação

- TypeScript e 37 testes automatizados aprovados; sete testes novos cobrem totais, CLT, zero, duplicações, empresa, datas/fuso, homônimos, conteúdo/CRC do ZIP, falhas de foto e observação longa.
- Build de produção aprovado. Avisos anteriores de imports mistos permanecem.
- PDFs sintéticos renderizados e revisados: cadastro Caixa inativo, PIX CLT ativo e observação extensa em três páginas. Ficha comum em uma página, sem cortes no conteúdo/rodapé.
- Homologação interativa no navegador não concluída: navegador ausente, download do Chromium indisponível no ambiente. Não houve login ou teste de download no site de produção.

Revisar e homologar a branch antes de publicar. Esta entrega não declara concluídos os demais bloqueios da auditoria.
