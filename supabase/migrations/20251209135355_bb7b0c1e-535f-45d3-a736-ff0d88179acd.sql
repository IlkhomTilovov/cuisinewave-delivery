-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload images
CREATE POLICY "Admins can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND
  (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'))
);

-- Allow authenticated admins to update images
CREATE POLICY "Admins can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND
  (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'))
);

-- Allow authenticated admins to delete images
CREATE POLICY "Admins can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND
  (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'manager'))
);

-- Allow public read access to images
CREATE POLICY "Images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');