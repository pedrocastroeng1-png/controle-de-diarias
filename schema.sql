-- Create medical_certificates table
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

-- Enable RLS
ALTER TABLE public.medical_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming admin has full access and we might need read access for operator)
CREATE POLICY "Enable all access for all users" ON public.medical_certificates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add to storage bucket (ensure 'medical-certificates' exists or use an existing one, wait, the prompt doesn't say. Let's use 'medical-certificates' bucket)
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give public access to medical-certificates" ON storage.objects FOR SELECT USING (bucket_id = 'medical-certificates');
CREATE POLICY "Give public insert to medical-certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'medical-certificates');
CREATE POLICY "Give public update to medical-certificates" ON storage.objects FOR UPDATE USING (bucket_id = 'medical-certificates');
CREATE POLICY "Give public delete to medical-certificates" ON storage.objects FOR DELETE USING (bucket_id = 'medical-certificates');
