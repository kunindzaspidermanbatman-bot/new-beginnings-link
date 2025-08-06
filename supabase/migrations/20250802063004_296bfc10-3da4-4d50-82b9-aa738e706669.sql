-- Create a new table to store individual service bookings
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  service_id UUID NOT NULL,
  arrival_time TIME NOT NULL,
  departure_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  price_per_hour NUMERIC NOT NULL,
  duration_hours NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  selected_games TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_services
CREATE POLICY "Users can view their own booking services" 
ON public.booking_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_services.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Partners can view booking services for their venues" 
ON public.booking_services 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.venues v ON b.venue_id = v.id
    JOIN public.profiles p ON v.partner_id = p.id
    WHERE b.id = booking_services.booking_id 
    AND p.id = auth.uid() 
    AND p.role = 'partner'
  )
);

CREATE POLICY "Service role can insert booking services" 
ON public.booking_services 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update booking services" 
ON public.booking_services 
FOR UPDATE 
USING (true);

-- Add foreign key constraints
ALTER TABLE public.booking_services 
ADD CONSTRAINT fk_booking_services_booking_id 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.booking_services 
ADD CONSTRAINT fk_booking_services_service_id 
FOREIGN KEY (service_id) REFERENCES public.venue_services(id) ON DELETE CASCADE;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_booking_services_updated_at
BEFORE UPDATE ON public.booking_services
FOR EACH ROW
EXECUTE FUNCTION public.update_games_updated_at();

-- Create index for performance
CREATE INDEX idx_booking_services_booking_id ON public.booking_services(booking_id);
CREATE INDEX idx_booking_services_service_id ON public.booking_services(service_id);