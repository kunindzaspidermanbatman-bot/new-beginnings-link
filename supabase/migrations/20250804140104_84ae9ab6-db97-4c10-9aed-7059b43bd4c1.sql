-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images',
  'venue-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for venue images
CREATE POLICY "Anyone can view venue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-images');

CREATE POLICY "Authenticated users can upload venue images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'venue-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own venue images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'venue-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own venue images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'venue-images'
  AND auth.role() = 'authenticated'
);

-- Also add partner_id column to venues table (needed for partner venue management)
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_venues_partner_id ON public.venues(partner_id);

-- Update RLS policies for venues to allow partners to manage their venues
CREATE POLICY "Partners can view their own venues" ON public.venues
FOR SELECT USING (
  auth.uid() = partner_id OR partner_id IS NULL
);

CREATE POLICY "Partners can insert their own venues" ON public.venues
FOR INSERT WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update their own venues" ON public.venues
FOR UPDATE USING (auth.uid() = partner_id);

CREATE POLICY "Partners can delete their own venues" ON public.venues
FOR DELETE USING (auth.uid() = partner_id);