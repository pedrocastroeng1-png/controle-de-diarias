CREATE TABLE IF NOT EXISTS public.historico_ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE RESTRICT,
    evento public.tool_event_type NOT NULL,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
