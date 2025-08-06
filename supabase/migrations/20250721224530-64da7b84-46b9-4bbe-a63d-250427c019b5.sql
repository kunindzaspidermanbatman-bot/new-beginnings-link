-- Add images column to venue_services table to store service images
ALTER TABLE public.venue_services 
ADD COLUMN images text[] DEFAULT '{}';

-- Create service-images storage bucket for service pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Create storage policies for service images
-- Allow anyone to view service images
CREATE POLICY "Service images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Allow partners to upload service images for their venues
CREATE POLICY "Partners can upload service images for their venues" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'service-images' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM venues v
    JOIN venue_services vs ON vs.venue_id = v.id
    WHERE v.partner_id = auth.uid() 
    AND (storage.foldername(objects.name))[1] = vs.id::text
  )
);

-- Allow partners to update service images for their venues
CREATE POLICY "Partners can update service images for their venues" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'service-images' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM venues v
    JOIN venue_services vs ON vs.venue_id = v.id
    WHERE v.partner_id = auth.uid() 
    AND (storage.foldername(objects.name))[1] = vs.id::text
  )
);

-- Allow partners to delete service images for their venues
CREATE POLICY "Partners can delete service images for their venues" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'service-images' AND 
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM venues v
    JOIN venue_services vs ON vs.venue_id = v.id
    WHERE v.partner_id = auth.uid() 
    AND (storage.foldername(objects.name))[1] = vs.id::text
  )
);