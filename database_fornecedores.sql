-- 1. Create table fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(255),
    site VARCHAR(255),
    cep VARCHAR(20),
    logradouro VARCHAR(255),
    numero VARCHAR(50),
    complemento VARCHAR(255),
    bairro VARCHAR(255),
    cidade VARCHAR(255),
    estado VARCHAR(2),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Add foreign key to compras_materiais
ALTER TABLE public.compras_materiais
ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES public.fornecedores(id);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id ON public.fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON public.fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_ativo ON public.fornecedores(ativo);
CREATE INDEX IF NOT EXISTS idx_compras_materiais_fornecedor_id ON public.compras_materiais(fornecedor_id);

-- 4. Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
CREATE POLICY "Usuários podem ver fornecedores da sua empresa" 
ON public.fornecedores FOR SELECT 
USING (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem inserir fornecedores na sua empresa" 
ON public.fornecedores FOR INSERT 
WITH CHECK (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem atualizar fornecedores da sua empresa" 
ON public.fornecedores FOR UPDATE 
USING (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()))
WITH CHECK (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

CREATE POLICY "Usuários podem excluir fornecedores da sua empresa" 
ON public.fornecedores FOR DELETE 
USING (empresa_id = (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid()));

-- 6. Trigger for updated_at
CREATE TRIGGER set_timestamp_fornecedores
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 7. View update for vw_relatorio_compras_materiais (if it exists and depends on text 'fornecedor')
-- We need to check how the view is structured to include the real supplier name if available.

-- 7. Update vw_relatorio_compras_materiais to include fornecedor name from the relationship
CREATE OR REPLACE VIEW public.vw_relatorio_compras_materiais AS
SELECT 
    c.id AS compra_id,
    c.empresa_id,
    c.data_compra,
    c.obra_id,
    o.nome AS obra,
    o.parent_obra_id AS obra_principal_id,
    COALESCE(f.nome, c.fornecedor) AS fornecedor,
    c.fornecedor_id,
    c.registrado_por,
    i.id AS item_id,
    i.material_id,
    m.nome AS material,
    m.unidade,
    mc.nome AS categoria,
    i.quantidade,
    i.valor_unitario,
    i.valor_total
FROM public.compras_materiais c
JOIN public.compras_materiais_itens i ON i.compra_id = c.id
JOIN public.obras o ON o.id = c.obra_id
JOIN public.materiais m ON m.id = i.material_id
LEFT JOIN public.material_categories mc ON mc.id = m.categoria_id
LEFT JOIN public.fornecedores f ON f.id = c.fornecedor_id;

