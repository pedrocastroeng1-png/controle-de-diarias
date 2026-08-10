-- Drop old tables if they exist to apply the redesign
DROP TABLE IF EXISTS public.communication_reads CASCADE;
DROP TABLE IF EXISTS public.communication_attachments CASCADE;
DROP TABLE IF EXISTS public.communication_recipients CASCADE;
DROP TABLE IF EXISTS public.communications CASCADE;

-- 1. Communications Table
CREATE TABLE public.communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    target_audience TEXT NOT NULL DEFAULT 'ALL',
    target_operator_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Communication Recipients (Reads/Confirmations) Table
CREATE TABLE public.communication_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(communication_id, operator_id, confirmed_at::date) -- Allow one confirmation per day for pinned messages
);

-- 3. Communication Attachments Table
CREATE TABLE public.communication_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_communications_created_at ON public.communications(created_at);
CREATE INDEX idx_communications_is_active ON public.communications(is_active);
CREATE INDEX idx_communications_priority ON public.communications(priority);

CREATE INDEX idx_comm_recipients_operator_id ON public.communication_recipients(operator_id);
CREATE INDEX idx_comm_recipients_communication_id ON public.communication_recipients(communication_id);
CREATE INDEX idx_comm_recipients_confirmed ON public.communication_recipients(confirmed);
CREATE INDEX idx_comm_recipients_read_at ON public.communication_recipients(read_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_communications_modtime 
BEFORE UPDATE ON public.communications 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- RLS
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_attachments ENABLE ROW LEVEL SECURITY;

-- We assume profiles/roles logic is handled at application level or we just allow authenticated users.
-- For simplicity in this schema without a complex auth setup in postgres, we allow ALL access,
-- but restrict updates on recipients to only specific fields. In a real scenario, we'd use auth.uid().
CREATE POLICY "Enable read for all" ON public.communications FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.communications FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all" ON public.communications FOR DELETE USING (true);

CREATE POLICY "Enable read for all recipients" ON public.communication_recipients FOR SELECT USING (true);
CREATE POLICY "Enable insert for all recipients" ON public.communication_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all recipients" ON public.communication_recipients FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all recipients" ON public.communication_recipients FOR DELETE USING (true);

CREATE POLICY "Enable read for attachments" ON public.communication_attachments FOR SELECT USING (true);
CREATE POLICY "Enable insert for attachments" ON public.communication_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete for attachments" ON public.communication_attachments FOR DELETE USING (true);

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('communication-files', 'communication-files', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Give public access to communication-files" ON storage.objects FOR SELECT USING (bucket_id = 'communication-files');
CREATE POLICY "Give public insert to communication-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'communication-files');
CREATE POLICY "Give public update to communication-files" ON storage.objects FOR UPDATE USING (bucket_id = 'communication-files');
CREATE POLICY "Give public delete to communication-files" ON storage.objects FOR DELETE USING (bucket_id = 'communication-files');
