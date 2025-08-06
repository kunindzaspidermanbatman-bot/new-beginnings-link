-- Add selected_games column to bookings table to store selected games data
ALTER TABLE public.bookings 
ADD COLUMN selected_games TEXT[] DEFAULT NULL;

-- Add an index for better performance when querying by games
CREATE INDEX idx_bookings_selected_games ON public.bookings USING GIN(selected_games);