-- Create private bucket for course imports (SCORM, PDF, DOCX)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'course_imports', 
    'course_imports', 
    false, -- Private bucket
    52428800, -- 50MB limit (adjust if SCORM packages are larger)
    ARRAY['application/zip', 'application/x-zip-compressed', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS is handled by Supabase automatically for storage.objects
-- skipping ALTER TABLE...

-- Policies for 'course_imports'

-- 1. Users can upload their own files
CREATE POLICY "Users can upload own course imports" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'course_imports' 
    AND (storage.foldername(name))[1] = auth.uid()::text -- Enforce folder structure: user_id/filename
);

-- 2. Users can view/download their own files
CREATE POLICY "Users can view own course imports" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'course_imports' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Users can delete their own files
CREATE POLICY "Users can delete own course imports" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id = 'course_imports' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
