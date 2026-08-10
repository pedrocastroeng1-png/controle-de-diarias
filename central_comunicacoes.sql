CREATE TABLE IF NOT EXISTS public.push_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

CREATE TABLE IF NOT EXISTS public.central_sugestoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL,
    referencia_id TEXT,
    status TEXT DEFAULT 'PENDENTE',
    destinatarios JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.central_comunicacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    remetente_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.central_destinatarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comunicacao_id UUID NOT NULL REFERENCES public.central_comunicacoes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    lida BOOLEAN DEFAULT false,
    data_leitura TIMESTAMP WITH TIME ZONE,
    UNIQUE(comunicacao_id, usuario_id)
);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_comunicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.central_destinatarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.push_devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.central_sugestoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.central_comunicacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.central_destinatarios FOR ALL USING (true) WITH CHECK (true);
