-- Correção pontual autorizada por Pedro em 12/09/2026.
-- Não executar automaticamente no aplicativo ou em futuros desligamentos.
-- Preserva datas existentes e não modifica status, admissão ou presenças.
BEGIN;
DO $$
DECLARE alterados integer;
BEGIN
  UPDATE public.funcionarios
  SET data_desligamento = DATE '2026-09-04'
  WHERE empresa_id = '3d510769-b94c-40fa-a96e-f29939d35c89'
    AND id IN ('9d077acc-e03d-47b0-b18a-ec7f627fcb59', 'd9f942be-791c-4b9a-9811-1b4d83563a71')
    AND ativo = false AND data_desligamento IS NULL;
  GET DIAGNOSTICS alterados = ROW_COUNT;
  IF alterados <> 2 THEN
    RAISE EXCEPTION 'Esperados 2 cadastros elegíveis, encontrados %. Operação revertida.', alterados;
  END IF;
END $$;
COMMIT;
