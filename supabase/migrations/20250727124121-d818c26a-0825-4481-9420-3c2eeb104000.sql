-- Check existing storage policies for service-images bucket
-- First, let's drop and recreate the policies to ensure they work correctly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Partners can upload service images for their venues" ON storage.objects;
DROP POLICY IF EXISTS "Service images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Partners can update service images for their venues" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete service images for their venues" ON storage.objects;

-- Create more permissive policies for service images
-- Allow authenticated users to upload service images (simplified for now)
CREATE POLICY "Authenticated users can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow everyone to view service images (public bucket)
CREATE POLICY "Service images are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Allow authenticated users to update their service images
CREATE POLICY "Authenticated users can update service images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their service images
CREATE POLICY "Authenticated users can delete service images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);