-- Emprestar ferramenta
CREATE OR REPLACE FUNCTION public.emprestar_ferramenta(
    p_ferramenta_id UUID,
    p_funcionario_id UUID,
    p_obra_id UUID
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operador_id UUID := auth.uid();
    v_status public.tool_status;
BEGIN
    IF v_operador_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- Lock pessimista para impedir concorrência e race conditions
    SELECT status INTO v_status
    FROM public.ferramentas
    WHERE id = p_ferramenta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ferramenta não encontrada.';
    END IF;

    IF v_status != 'ATIVA' THEN
        RAISE EXCEPTION 'A ferramenta não está disponível para empréstimo (Status: %).', v_status;
    END IF;

    -- Insere o empréstimo
    INSERT INTO public.emprestimos_ferramentas (
        ferramenta_id, funcionario_id, obra_id, operador_emprestimo_id, data_emprestimo
    ) VALUES (
        p_ferramenta_id, p_funcionario_id, p_obra_id, v_operador_id, NOW()
    );

    -- Atualiza status (Trigger de auditoria vai registrar o EMPRESTIMO automaticamente)
    UPDATE public.ferramentas
    SET status = 'EMPRESTADA'
    WHERE id = p_ferramenta_id;

END;
$$ LANGUAGE plpgsql;

-- Devolver ferramenta
CREATE OR REPLACE FUNCTION public.devolver_ferramenta(
    p_emprestimo_id UUID,
    p_condicao public.return_condition,
    p_observacao TEXT DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operador_id UUID := auth.uid();
    v_ferramenta_id UUID;
    v_data_devolucao TIMESTAMP WITH TIME ZONE;
BEGIN
    IF v_operador_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- Busca o ID da ferramenta primeiro para garantir a ordem dos locks (Ferramenta -> Empréstimo) e evitar Deadlocks
    SELECT ferramenta_id INTO v_ferramenta_id
    FROM public.emprestimos_ferramentas
    WHERE id = p_emprestimo_id;

    IF v_ferramenta_id IS NULL THEN
        RAISE EXCEPTION 'Empréstimo não encontrado.';
    END IF;

    -- Lock pessimista na ferramenta primeiro (Order of Locking)
    PERFORM id FROM public.ferramentas WHERE id = v_ferramenta_id FOR UPDATE;

    -- Lock pessimista no empréstimo em seguida
    SELECT data_devolucao INTO v_data_devolucao
    FROM public.emprestimos_ferramentas
    WHERE id = p_emprestimo_id
    FOR UPDATE;

    IF v_data_devolucao IS NOT NULL THEN
        RAISE EXCEPTION 'Esta ferramenta já foi devolvida.';
    END IF;

    IF p_condicao = 'DANIFICADA' AND (p_observacao IS NULL OR trim(p_observacao) = '') THEN
        RAISE EXCEPTION 'Observação é obrigatória quando a condição é DANIFICADA.';
    END IF;

    -- Atualiza o empréstimo
    UPDATE public.emprestimos_ferramentas
    SET data_devolucao = NOW(),
        operador_devolucao_id = v_operador_id,
        condicao_devolucao = p_condicao,
        observacao_devolucao = p_observacao
    WHERE id = p_emprestimo_id;

    -- Atualiza status (Trigger de auditoria vai registrar a DEVOLUCAO)
    UPDATE public.ferramentas
    SET status = 'ATIVA'
    WHERE id = v_ferramenta_id;

END;
$$ LANGUAGE plpgsql;

-- Marcar como em reparo
CREATE OR REPLACE FUNCTION public.marcar_reparo(
    p_ferramenta_id UUID,
    p_observacao TEXT DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operador_id UUID := auth.uid();
    v_status public.tool_status;
BEGIN
    IF v_operador_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    SELECT status INTO v_status
    FROM public.ferramentas
    WHERE id = p_ferramenta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ferramenta não encontrada.';
    END IF;

    IF v_status != 'ATIVA' THEN
        RAISE EXCEPTION 'Apenas ferramentas ATIVAS podem ser enviadas para reparo.';
    END IF;

    -- Atualiza status (Trigger de auditoria vai registrar o REPARO)
    UPDATE public.ferramentas
    SET status = 'EM_REPARO',
        observacoes = COALESCE(p_observacao, observacoes)
    WHERE id = p_ferramenta_id;

END;
$$ LANGUAGE plpgsql;

-- Marcar como perdida
CREATE OR REPLACE FUNCTION public.marcar_perdida(
    p_ferramenta_id UUID,
    p_observacao TEXT DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_operador_id UUID := auth.uid();
    v_status public.tool_status;
    v_emprestimo_id UUID;
BEGIN
    IF v_operador_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado.';
    END IF;

    -- Order of Locking: Ferramenta primeiro
    SELECT status INTO v_status
    FROM public.ferramentas
    WHERE id = p_ferramenta_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ferramenta não encontrada.';
    END IF;

    -- Se estiver emprestada, finaliza o empréstimo ativo (Order of Locking: Empréstimo em seguida)
    IF v_status = 'EMPRESTADA' THEN
        SELECT id INTO v_emprestimo_id
        FROM public.emprestimos_ferramentas
        WHERE ferramenta_id = p_ferramenta_id AND data_devolucao IS NULL
        FOR UPDATE;

        IF FOUND THEN
            UPDATE public.emprestimos_ferramentas
            SET data_devolucao = NOW(),
                operador_devolucao_id = v_operador_id,
                condicao_devolucao = 'DANIFICADA',
                observacao_devolucao = 'Ferramenta marcada como perdida.'
            WHERE id = v_emprestimo_id;
        END IF;
    END IF;

    -- Atualiza status (Trigger de auditoria vai registrar a PERDA)
    UPDATE public.ferramentas
    SET status = 'PERDIDA',
        observacoes = COALESCE(p_observacao, observacoes)
    WHERE id = p_ferramenta_id;

END;
$$ LANGUAGE plpgsql;
