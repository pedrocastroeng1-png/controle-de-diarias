-- Operational Communications Schema

CREATE TABLE IF NOT EXISTS public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    expiration_date DATE,
    target_audience TEXT NOT NULL,
    target_operator_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.communication_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(communication_id, operator_id)
);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.communications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.communication_reads FOR ALL USING (true) WITH CHECK (true);
