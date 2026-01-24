-- Create a public storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow admins to upload event images
CREATE POLICY "Admins can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND (SELECT has_role(auth.uid(), 'admin'))
);

-- Allow admins to update/replace event images
CREATE POLICY "Admins can update event images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-images' 
  AND (SELECT has_role(auth.uid(), 'admin'))
);

-- Allow admins to delete event images
CREATE POLICY "Admins can delete event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND (SELECT has_role(auth.uid(), 'admin'))
);