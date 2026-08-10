-- Complete migration for missing tables

-- 1. medical_certificates
CREATE TABLE IF NOT EXISTS public.medical_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    days INTEGER NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    photo_path TEXT,
    created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. communications
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

-- 3. communication_recipients
CREATE TABLE IF NOT EXISTS public.communication_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(communication_id, operator_id)
);

-- 4. communication_attachments
CREATE TABLE IF NOT EXISTS public.communication_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES public.communications(id) ON DELETE CASCADE,
    file_name TEXT,
    file_path TEXT,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_certificates_employee_id ON public.medical_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_communications_is_active ON public.communications(is_active);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON public.communications(created_at);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_communication_id ON public.communication_recipients(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_operator_id ON public.communication_recipients(operator_id);
CREATE INDEX IF NOT EXISTS idx_communication_attachments_communication_id ON public.communication_attachments(communication_id);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('communication-files', 'communication-files', false) ON CONFLICT (id) DO NOTHING;

-- RLS Enable
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_attachments ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming broad access for this context based on existing setup, but can be tailored)
CREATE POLICY "Enable all access for all users" ON public.medical_certificates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.communications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.communication_recipients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON public.communication_attachments FOR ALL USING (true) WITH CHECK (true);

-- Storage Policies for medical-certificates
CREATE POLICY "Give public access to medical-certificates" ON storage.objects FOR SELECT USING (bucket_id = 'medical-certificates');
CREATE POLICY "Give public insert to medical-certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-certificates');
CREATE POLICY "Give public update to medical-certificates" ON storage.objects FOR UPDATE USING (bucket_id = 'medical-certificates');
CREATE POLICY "Give public delete to medical-certificates" ON storage.objects FOR DELETE USING (bucket_id = 'medical-certificates');

-- Storage Policies for communication-files
CREATE POLICY "Give access to communication-files" ON storage.objects FOR SELECT USING (bucket_id = 'communication-files');
CREATE POLICY "Give insert to communication-files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'communication-files');
CREATE POLICY "Give update to communication-files" ON storage.objects FOR UPDATE USING (bucket_id = 'communication-files');
CREATE POLICY "Give delete to communication-files" ON storage.objects FOR DELETE USING (bucket_id = 'communication-files');


-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_medical_certificates_updated_at ON public.medical_certificates;
CREATE TRIGGER update_medical_certificates_updated_at
    BEFORE UPDATE ON public.medical_certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communications_updated_at ON public.communications;
CREATE TRIGGER update_communications_updated_at
    BEFORE UPDATE ON public.communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
