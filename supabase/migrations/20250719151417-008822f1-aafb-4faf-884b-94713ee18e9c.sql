-- Create venue categories table
CREATE TABLE IF NOT EXISTS public.venue_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO public.venue_categories (name) VALUES 
  ('Restaurant'),
  ('Spa'),
  ('Gym'),
  ('Salon'),
  ('Hotel'),
  ('Event Space'),
  ('Studio'),
  ('Clinic'),
  ('Outdoor Activity'),
  ('Entertainment')
ON CONFLICT (name) DO NOTHING;

-- Create amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default amenities
INSERT INTO public.amenities (name, icon) VALUES 
  ('WiFi', 'wifi'),
  ('Parking', 'car'),
  ('Air Conditioning', 'snowflake'),
  ('Heating', 'thermometer'),
  ('Disability Access', 'accessibility'),
  ('Security', 'shield'),
  ('Kitchen', 'chef-hat'),
  ('Sound System', 'volume-2'),
  ('Projector', 'projector'),
  ('Whiteboard', 'square'),
  ('Coffee/Tea', 'coffee'),
  ('Restroom', 'door-open')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.venue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view venue categories" 
ON public.venue_categories 
FOR SELECT 
USING (true);

-- Create policies for amenities
CREATE POLICY "Anyone can view amenities" 
ON public.amenities 
FOR SELECT 
USING (true);

-- Ensure the venues table has the time columns
DO $$
BEGIN
  -- Check and add opening_time column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='venues' AND column_name='opening_time') THEN
    ALTER TABLE public.venues ADD COLUMN opening_time TIME;
  END IF;
  
  -- Check and add closing_time column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='venues' AND column_name='closing_time') THEN
    ALTER TABLE public.venues ADD COLUMN closing_time TIME;
  END IF;
END $$;