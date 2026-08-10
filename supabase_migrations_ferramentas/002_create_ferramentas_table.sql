CREATE TABLE IF NOT EXISTS public.ferramentas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    foto_path TEXT,
    status public.tool_status DEFAULT 'ATIVA' NOT NULL,
    observacoes TEXT,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
