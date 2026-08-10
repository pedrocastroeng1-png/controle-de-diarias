-- Auditoria automática das ferramentas (Security Definer para acessar tabela de histórico e ignorar RLS)
CREATE OR REPLACE FUNCTION public.audit_ferramentas_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id UUID := auth.uid();
    v_evento public.tool_event_type;
    v_descricao TEXT;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_evento := 'CADASTRO';
        v_descricao := 'Ferramenta cadastrada.';
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'EMPRESTADA' THEN
                v_evento := 'EMPRESTIMO';
                v_descricao := 'Ferramenta emprestada.';
            ELSIF NEW.status = 'ATIVA' AND OLD.status = 'EMPRESTADA' THEN
                v_evento := 'DEVOLUCAO';
                v_descricao := 'Ferramenta devolvida.';
            ELSIF NEW.status = 'EM_REPARO' THEN
                v_evento := 'REPARO';
                v_descricao := 'Ferramenta enviada para reparo.';
            ELSIF NEW.status = 'PERDIDA' THEN
                v_evento := 'PERDA';
                v_descricao := 'Ferramenta marcada como perdida.';
            ELSIF NEW.status = 'INATIVA' THEN
                v_evento := 'INATIVACAO';
                v_descricao := 'Ferramenta inativada.';
            ELSIF NEW.status = 'ATIVA' AND OLD.status IN ('INATIVA', 'EM_REPARO', 'PERDIDA') THEN
                v_evento := 'REATIVACAO';
                v_descricao := 'Ferramenta reativada.';
            ELSE
                v_evento := 'EDICAO';
                v_descricao := 'Ferramenta editada (status).';
            END IF;
        ELSE
            v_evento := 'EDICAO';
            v_descricao := 'Ferramenta editada.';
        END IF;
    END IF;

    INSERT INTO public.historico_ferramentas (ferramenta_id, evento, usuario_id, descricao)
    VALUES (
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        v_evento,
        v_usuario_id,
        v_descricao
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_ferramentas ON public.ferramentas;
CREATE TRIGGER trg_audit_ferramentas
AFTER INSERT OR UPDATE ON public.ferramentas
FOR EACH ROW
EXECUTE FUNCTION public.audit_ferramentas_changes();

-- Trigger para garantir que deleções não ocorram no histórico e empréstimos
CREATE OR REPLACE FUNCTION public.prevent_deletion()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'A exclusão de registros nesta tabela não é permitida para manter o histórico de auditoria.';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_historico_deletion ON public.historico_ferramentas;
CREATE TRIGGER prevent_historico_deletion
BEFORE DELETE ON public.historico_ferramentas
FOR EACH ROW
EXECUTE FUNCTION public.prevent_deletion();

DROP TRIGGER IF EXISTS prevent_emprestimos_deletion ON public.emprestimos_ferramentas;
CREATE TRIGGER prevent_emprestimos_deletion
BEFORE DELETE ON public.emprestimos_ferramentas
FOR EACH ROW
EXECUTE FUNCTION public.prevent_deletion();

-- Associa a função de updated_at padrão
DROP TRIGGER IF EXISTS update_ferramentas_timestamp ON public.ferramentas;
CREATE TRIGGER update_ferramentas_timestamp
BEFORE UPDATE ON public.ferramentas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_emprestimos_timestamp ON public.emprestimos_ferramentas;
CREATE TRIGGER update_emprestimos_timestamp
BEFORE UPDATE ON public.emprestimos_ferramentas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
