-- Create feriados table
CREATE TABLE IF NOT EXISTS public.feriados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unidade_compra to compras_materiais_itens
ALTER TABLE public.compras_materiais_itens ADD COLUMN IF NOT EXISTS unidade_compra TEXT;

-- For historic purchases, this column will be null, and the views will use COALESCE(unidade_compra, material.unidade)
-- However, since views cannot be easily altered if they have dependencies, we might need to recreate them.
-- To keep it safe, we instruct the user to update the view `vw_estoque_materiais` etc to group by COALESCE(unidade_compra, materiais.unidade)

-- Recreate RPC to include unidade_compra
CREATE OR REPLACE FUNCTION public.registrar_compra_material(
    p_empresa_id uuid,
    p_fornecedor_id uuid,
    p_obra_id uuid,
    p_usuario_id uuid,
    p_itens jsonb,
    p_data_compra date DEFAULT NULL::date,
    p_numero_recibo text DEFAULT NULL::text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_compra_id uuid;
    v_item jsonb;
BEGIN
    INSERT INTO public.compras_materiais (
        empresa_id,
        obra_id,
        fornecedor_id,
        numero_recibo,
        data_compra,
        registrado_por
    ) VALUES (
        p_empresa_id,
        p_obra_id,
        p_fornecedor_id,
        p_numero_recibo,
        COALESCE(p_data_compra, CURRENT_DATE),
        p_usuario_id
    ) RETURNING id INTO v_compra_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        INSERT INTO public.compras_materiais_itens (
            empresa_id,
            compra_id,
            material_id,
            quantidade,
            valor_unitario,
            funcionario_id,
            unidade_compra
        ) VALUES (
            p_empresa_id,
            v_compra_id,
            (v_item->>'material_id')::uuid,
            (v_item->>'quantidade')::numeric,
            (v_item->>'valor_unitario')::numeric,
            NULLIF(v_item->>'funcionario_id', '')::uuid,
            v_item->>'unidade_compra'
        );
    END LOOP;

    RETURN v_compra_id;
END;
$$;

-- For full adherence to "group by material AND unit", the views (like vw_estoque_materiais and vw_estoque_materiais_consolidado)
-- must be recreated to group by COALESCE(compras_materiais_itens.unidade_compra, materiais.unidade) as their unit instead of just materiais.unidade.
-- This is complex to do automatically without dropping dependents, so here we provide the conceptual change:
-- 
-- CREATE OR REPLACE VIEW vw_estoque_materiais AS
-- SELECT ...
--        COALESCE(cmi.unidade_compra, m.unidade) AS unidade,
-- ...
-- GROUP BY ..., COALESCE(cmi.unidade_compra, m.unidade)
-- 
-- Due to existing view dependencies, please execute this schema update carefully via Supabase SQL Editor.
