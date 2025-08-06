-- Add service_games column to venue_services table
ALTER TABLE public.venue_services 
ADD COLUMN service_games text[] DEFAULT '{}';

-- Insert predefined games for each service category
INSERT INTO public.games (name, category) VALUES
-- PC Gaming games
('Counter-Strike 2', 'PC Gaming'),
('Valorant', 'PC Gaming'),
('Dota 2', 'PC Gaming'),
('League of Legends', 'PC Gaming'),

-- PlayStation 5 games
('FIFA 24', 'PlayStation 5'),
('Mortal Kombat 11', 'PlayStation 5'),
('Call of Duty: Modern Warfare III', 'PlayStation 5'),
('Gran Turismo 7', 'PlayStation 5'),

-- Billiards games
('8-Ball Pool', 'Billiards'),
('9-Ball Pool', 'Billiards'),
('Cutthroat', 'Billiards'),
('One Pocket', 'Billiards')

ON CONFLICT (name) DO NOTHING;