-- Add missing status_updated_at column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN status_updated_at TIMESTAMPTZ;

-- Create a trigger to automatically update status_updated_at when status changes
CREATE OR REPLACE FUNCTION public.update_booking_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update status_updated_at if the status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status updates
CREATE TRIGGER update_booking_status_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_status_timestamp();