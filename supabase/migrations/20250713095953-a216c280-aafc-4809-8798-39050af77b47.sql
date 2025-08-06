
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create venues table to replace mock data
CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on venues (public read, admin write for now)
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read venues" ON public.venues
  FOR SELECT TO anon, authenticated
  USING (true);

-- Create services table for venue services
CREATE TABLE public.venue_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on venue services
ALTER TABLE public.venue_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read venue services" ON public.venue_services
  FOR SELECT TO anon, authenticated
  USING (true);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.venue_services(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update profiles on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample venue data
INSERT INTO public.venues (name, description, location, price, rating, review_count, category, images, amenities) VALUES
('GameZone Central', 'Premium gaming lounge with latest consoles and PCs', 'Downtown Gaming District', 25.00, 4.8, 124, 'Gaming Lounge', 
 ARRAY['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'Parking', 'Food']),
('Elite Gaming Arena', 'Professional esports facility with tournament setup', 'Gaming Plaza', 35.00, 4.9, 87, 'Gaming Arena', 
 ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'Parking', 'Professional Setup']),
('Retro Arcade Haven', 'Classic arcade games and retro consoles', 'Nostalgic Corner', 20.00, 4.7, 156, 'Arcade', 
 ARRAY['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'Retro Games', 'Food']);

-- Insert sample services
INSERT INTO public.venue_services (venue_id, name, price, duration, description) VALUES
((SELECT id FROM public.venues WHERE name = 'GameZone Central'), 'Gaming Session', 25.00, '1 hour', 'Standard gaming session'),
((SELECT id FROM public.venues WHERE name = 'GameZone Central'), 'Premium Package', 45.00, '2 hours', 'Extended gaming with snacks'),
((SELECT id FROM public.venues WHERE name = 'Elite Gaming Arena'), 'Tournament Practice', 35.00, '1 hour', 'Professional gaming setup'),
((SELECT id FROM public.venues WHERE name = 'Elite Gaming Arena'), 'Team Training', 120.00, '3 hours', 'Full team coaching session'),
((SELECT id FROM public.venues WHERE name = 'Retro Arcade Haven'), 'Arcade Pass', 20.00, '1 hour', 'Unlimited arcade games'),
((SELECT id FROM public.venues WHERE name = 'Retro Arcade Haven'), 'Retro Party', 80.00, '2 hours', 'Group retro gaming experience');
