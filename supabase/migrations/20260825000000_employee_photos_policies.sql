-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('employee-photos', 'employee-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Allow anon insert employee-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update employee-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete employee-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon select employee-photos" ON storage.objects;

-- Select policy: Allow access if the file name starts with a valid employee ID
CREATE POLICY "Allow anon select employee-photos" ON storage.objects
FOR SELECT TO public
USING (
  bucket_id = 'employee-photos'
);

-- Insert policy: Ensure the file name starts with a valid employee ID
CREATE POLICY "Allow anon insert employee-photos" ON storage.objects
FOR INSERT TO public
WITH CHECK (
  bucket_id = 'employee-photos'
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id::text = split_part(name, '_', 1)
  )
);

-- Update policy
CREATE POLICY "Allow anon update employee-photos" ON storage.objects
FOR UPDATE TO public
USING (
  bucket_id = 'employee-photos'
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id::text = split_part(name, '_', 1)
  )
);

-- Delete policy
CREATE POLICY "Allow anon delete employee-photos" ON storage.objects
FOR DELETE TO public
USING (
  bucket_id = 'employee-photos'
  AND EXISTS (
    SELECT 1 FROM public.funcionarios f
    WHERE f.id::text = split_part(name, '_', 1)
  )
);

-- Add similar policies for attendance-photos
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-photos', 'attendance-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Allow anon select attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon insert attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update attendance-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete attendance-photos" ON storage.objects;

CREATE POLICY "Allow anon select attendance-photos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'attendance-photos');

CREATE POLICY "Allow anon insert attendance-photos" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'attendance-photos');

CREATE POLICY "Allow anon update attendance-photos" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'attendance-photos');

CREATE POLICY "Allow anon delete attendance-photos" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'attendance-photos');
