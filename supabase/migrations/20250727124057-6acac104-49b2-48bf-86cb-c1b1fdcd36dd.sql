-- Create RLS policies for service-images bucket to allow partners to manage service images

-- Allow partners to insert images for their venue services
CREATE POLICY "Partners can upload service images for their venues" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM venues v
    JOIN profiles p ON v.partner_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'partner'
  )
);

-- Allow everyone to view service images (public bucket)
CREATE POLICY "Service images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Allow partners to update service images for their venues
CREATE POLICY "Partners can update service images for their venues" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM venues v
    JOIN profiles p ON v.partner_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'partner'
  )
);

-- Allow partners to delete service images for their venues
CREATE POLICY "Partners can delete service images for their venues" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' 
  AND EXISTS (
    SELECT 1 FROM venues v
    JOIN profiles p ON v.partner_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'partner'
  )
);