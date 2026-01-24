-- Create storage bucket for ticket PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tickets',
  'tickets',
  true,  -- Make public so users can view their tickets
  10485760,  -- 10MB file size limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tickets bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can upload ticket PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all ticket PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Members can view claimed tickets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete ticket PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view ticket PDFs" ON storage.objects;

-- Allow admins to upload ticket PDFs
CREATE POLICY "Admins can upload ticket PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tickets'
    AND auth.role() = 'authenticated'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to update ticket PDFs
CREATE POLICY "Admins can update ticket PDFs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'tickets'
    AND auth.role() = 'authenticated'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow admins to delete ticket PDFs
CREATE POLICY "Admins can delete ticket PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tickets'
    AND auth.role() = 'authenticated'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Allow anyone (public) to view ticket PDFs since bucket is public
CREATE POLICY "Anyone can view ticket PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tickets');
