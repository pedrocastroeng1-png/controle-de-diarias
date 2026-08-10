CREATE TABLE IF NOT EXISTS public.emprestimos_ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE RESTRICT,
    funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE RESTRICT,
    obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE RESTRICT,
    operador_emprestimo_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    data_emprestimo TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    data_devolucao TIMESTAMP WITH TIME ZONE,
    operador_devolucao_id UUID REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    condicao_devolucao public.return_condition,
    observacao_devolucao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT chk_observacao_danificada CHECK (
        condicao_devolucao IS NULL OR
        condicao_devolucao != 'DANIFICADA' OR 
        (condicao_devolucao = 'DANIFICADA' AND observacao_devolucao IS NOT NULL AND trim(observacao_devolucao) <> '')
    )
);
