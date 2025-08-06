-- Add working hours to venues table
ALTER TABLE public.venues 
ADD COLUMN opening_time TIME,
ADD COLUMN closing_time TIME;