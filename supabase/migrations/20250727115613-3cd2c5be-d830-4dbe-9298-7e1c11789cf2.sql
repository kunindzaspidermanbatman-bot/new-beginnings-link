-- Create games table that only admins can manage
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create venue_games junction table for many-to-many relationship
CREATE TABLE public.venue_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(venue_id, game_id)
);

-- Enable RLS on both tables
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_games ENABLE ROW LEVEL SECURITY;

-- RLS policies for games table
-- Anyone can view games
CREATE POLICY "Anyone can view games" 
ON public.games 
FOR SELECT 
USING (true);

-- Only admins can manage games
CREATE POLICY "Admins can manage games" 
ON public.games 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- RLS policies for venue_games table
-- Anyone can view venue-game relationships
CREATE POLICY "Anyone can view venue games" 
ON public.venue_games 
FOR SELECT 
USING (true);

-- Partners can manage games for their own venues
CREATE POLICY "Partners can manage venue games" 
ON public.venue_games 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.venues v
    JOIN public.profiles p ON v.partner_id = p.id
    WHERE v.id = venue_games.venue_id 
    AND p.id = auth.uid() 
    AND p.role = 'partner'::user_role
  )
);

-- Insert the same games that are available in the booking dialog
INSERT INTO public.games (name, category) VALUES
('Counter-Strike 2', 'FPS'),
('Fortnite', 'Battle Royale'),
('League of Legends', 'MOBA'),
('Valorant', 'FPS'),
('Call of Duty: Warzone', 'Battle Royale'),
('Apex Legends', 'Battle Royale'),
('Overwatch 2', 'FPS'),
('Rocket League', 'Sports'),
('FIFA 24', 'Sports'),
('Grand Theft Auto V', 'Open World'),
('Minecraft', 'Sandbox'),
('Among Us', 'Social Deduction'),
('Fall Guys', 'Party'),
('Cyberpunk 2077', 'RPG'),
('The Witcher 3', 'RPG');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_games_updated_at();