-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public) VALUES ('venue-images', 'venue-images', true);

-- Create policies for venue image uploads
CREATE POLICY "Anyone can view venue images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'venue-images');

CREATE POLICY "Partners can upload venue images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'venue-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Partners can update their venue images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'venue-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Partners can delete their venue images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'venue-images' AND auth.uid() IS NOT NULL);