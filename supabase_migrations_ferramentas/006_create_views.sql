CREATE OR REPLACE VIEW public.vw_ferramentas_disponiveis AS
SELECT 
    id,
    codigo_interno,
    nome,
    marca,
    modelo,
    foto_path,
    status,
    observacoes,
    created_by,
    created_at,
    updated_at
FROM public.ferramentas
WHERE status = 'ATIVA';

CREATE OR REPLACE VIEW public.vw_ferramentas_localizacao AS
SELECT 
    f.id,
    f.codigo_interno,
    f.nome,
    f.status,
    CASE 
        WHEN f.status = 'EMPRESTADA' THEN func.nome
        ELSE NULL
    END AS responsavel_atual,
    CASE 
        WHEN f.status = 'EMPRESTADA' THEN o.nome
        ELSE 'Estoque'
    END AS localizacao_atual,
    e.data_emprestimo
FROM public.ferramentas f
LEFT JOIN public.emprestimos_ferramentas e 
    ON f.id = e.ferramenta_id AND e.data_devolucao IS NULL
LEFT JOIN public.funcionarios func 
    ON e.funcionario_id = func.id
LEFT JOIN public.obras o 
    ON e.obra_id = o.id;
