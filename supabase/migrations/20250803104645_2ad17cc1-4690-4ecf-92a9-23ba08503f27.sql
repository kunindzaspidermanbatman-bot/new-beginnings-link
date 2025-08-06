-- Create table to track review notification opt-outs
CREATE TABLE public.review_notification_optouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  opted_out_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, booking_id, venue_id)
);

-- Enable RLS
ALTER TABLE public.review_notification_optouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own review opt-outs" 
ON public.review_notification_optouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own review opt-outs" 
ON public.review_notification_optouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_review_optouts_user_booking ON public.review_notification_optouts(user_id, booking_id);
CREATE INDEX idx_review_optouts_user_venue ON public.review_notification_optouts(user_id, venue_id);