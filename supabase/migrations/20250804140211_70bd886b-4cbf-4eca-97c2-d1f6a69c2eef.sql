-- Create storage policies for service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-images'
  AND auth.role() = 'authenticated'
);