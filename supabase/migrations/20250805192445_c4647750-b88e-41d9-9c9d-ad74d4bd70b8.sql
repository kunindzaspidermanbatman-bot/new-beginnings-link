-- Create booking_services table to store individual service bookings
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES venue_services(id) ON DELETE CASCADE,
  arrival_time TIME NOT NULL,
  departure_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  price_per_hour NUMERIC NOT NULL DEFAULT 0,
  duration_hours NUMERIC NOT NULL DEFAULT 1,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  selected_games TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_services
CREATE POLICY "Users can view their own booking services" 
ON public.booking_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own booking services" 
ON public.booking_services 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own booking services" 
ON public.booking_services 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_services_updated_at
  BEFORE UPDATE ON public.booking_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();