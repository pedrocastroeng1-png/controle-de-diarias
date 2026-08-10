INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos_ferramentas', 'fotos_ferramentas', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Ler fotos ferramentas" ON storage.objects;
DROP POLICY IF EXISTS "Inserir fotos ferramentas" ON storage.objects;
DROP POLICY IF EXISTS "Atualizar fotos ferramentas" ON storage.objects;
DROP POLICY IF EXISTS "Deletar fotos ferramentas" ON storage.objects;

CREATE POLICY "Ler fotos ferramentas" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fotos_ferramentas' AND auth.role() = 'authenticated');

CREATE POLICY "Inserir fotos ferramentas" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'fotos_ferramentas' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

CREATE POLICY "Atualizar fotos ferramentas" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'fotos_ferramentas' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

CREATE POLICY "Deletar fotos ferramentas" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'fotos_ferramentas' 
    AND auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);
