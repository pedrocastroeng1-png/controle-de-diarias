-- ETAPA 1: OTIMIZAÇÃO E RETENÇÃO DE FOTOS (Controle de Diárias 7.0)
-- 
-- Objetivo: Remover arquivos físicos do Storage (bucket "attendance-photos")
-- que possuem data de criação superior a 20 dias, preservando todos os
-- registros do banco de dados (tabela public.presencas).
--
-- NOTA: O Supabase possui uma tabela interna chamada "storage.objects".
-- Apagar registros dessa tabela aciona o trigger do Storage API para
-- apagar o arquivo físico correspondente no bucket.

CREATE OR REPLACE FUNCTION delete_expired_photos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    file_record record;
    deleted_count integer := 0;
BEGIN
    -- Busca fotos do bucket 'attendance-photos' criadas há mais de 20 dias
    FOR file_record IN 
        SELECT id, name
        FROM storage.objects
        WHERE bucket_id = 'attendance-photos'
          AND name != '.emptyFolderPlaceholder'
          AND created_at < NOW() - INTERVAL '20 days'
    LOOP
        -- A exclusão nesta tabela força o Supabase a deletar o arquivo físico S3.
        DELETE FROM storage.objects WHERE id = file_record.id;
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Rotina concluída: % fotos expiradas foram removidas fisicamente do storage.', deleted_count;
END;
$$;

-- ==============================================================================
-- INSTRUÇÕES PARA AUTOMATIZAÇÃO (CRON)
-- ==============================================================================
-- Como verificado, a extensão pg_cron NÃO está habilitada por padrão.
-- Para que a função delete_expired_photos() rode automaticamente:
-- 
-- 1. No Painel do Supabase, acesse Database -> Extensions.
-- 2. Pesquise por "pg_cron" e clique para habilitar (Enable).
-- 3. Após habilitar, execute o bloco abaixo no SQL Editor do Supabase:
--
-- SELECT cron.schedule(
--   'cleanup_expired_photos_daily', -- Nome da rotina
--   '0 3 * * *',                    -- Executa todo dia às 3:00 da manhã
--   'SELECT delete_expired_photos();'
-- );
--
-- Isso garante que as exclusões ocorram 100% no servidor de banco de dados,
-- sem depender do frontend, do PWA aberto ou de navegação humana.
