-- Fix database schema issues from external modifications

-- Create reviews table if it doesn't exist (referenced in logs but missing)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    venue_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews table
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can read reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add missing columns that are referenced in the logs but don't exist
-- Add is_visible column to venues if it doesn't exist
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Add service_type column to venue_services if it doesn't exist  
ALTER TABLE public.venue_services 
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add foreign key constraints that might be missing
ALTER TABLE public.reviews 
ADD CONSTRAINT IF NOT EXISTS reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
ADD CONSTRAINT IF NOT EXISTS reviews_venue_id_fkey 
FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE CASCADE;