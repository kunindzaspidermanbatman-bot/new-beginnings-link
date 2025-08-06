-- Add booking_id column to reviews table if it doesn't exist
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- Update the review creation policy to include booking validation
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  (
    booking_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = reviews.booking_id 
      AND bookings.user_id = auth.uid()
      AND bookings.venue_id = reviews.venue_id
      AND bookings.status = 'confirmed'
    )
  )
);