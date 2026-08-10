-- Adiciona a coluna meia_diaria na tabela de presencas
ALTER TABLE public.presencas ADD COLUMN IF NOT EXISTS meia_diaria BOOLEAN DEFAULT FALSE;

-- Atualiza a view vw_relatorio_presencas para incluir a meia diária e o valor calculado
CREATE OR REPLACE VIEW public.vw_relatorio_presencas AS
SELECT 
    p.id,
    p.data,
    CASE 
        WHEN p.meia_diaria THEN 'MEIA DIÁRIA'
        WHEN p.presente THEN 'PRESENTE'
        ELSE 'FALTOU'
    END AS status,
    f.nome AS funcionario,
    func.nome AS funcao,
    CASE 
        WHEN p.meia_diaria THEN func.valor_diaria / 2
        ELSE func.valor_diaria
    END AS valor_diaria,
    o.nome AS obra,
    p.funcionario_id
FROM public.presencas p
JOIN public.funcionarios f ON p.funcionario_id = f.id
JOIN public.funcoes func ON f.funcao_id = func.id
JOIN public.obras o ON p.obra_id = o.id;

-- Criação de uma função e trigger para garantir que apenas ADMIN possa alterar meia_diaria
CREATE OR REPLACE FUNCTION check_admin_meia_diaria()
RETURNS TRIGGER AS $$
DECLARE
  v_perfil text;
BEGIN
  IF NEW.meia_diaria IS DISTINCT FROM OLD.meia_diaria THEN
    SELECT perfil INTO v_perfil FROM public.usuarios WHERE id = auth.uid();
    IF v_perfil != 'ADMIN' THEN
      RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem alterar para meia diária.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_admin_meia_diaria ON public.presencas;
CREATE TRIGGER trigger_check_admin_meia_diaria
  BEFORE UPDATE OR INSERT ON public.presencas
  FOR EACH ROW
  EXECUTE FUNCTION check_admin_meia_diaria();
