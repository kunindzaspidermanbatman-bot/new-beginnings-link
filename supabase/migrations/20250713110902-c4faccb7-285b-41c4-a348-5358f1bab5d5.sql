
-- Add more test venues for interactive map testing
INSERT INTO public.venues (name, description, location, price, rating, review_count, category, images, amenities) VALUES
('Cyber Arena Pro', 'State-of-the-art esports facility with streaming setup', 'Tech Valley', 40.00, 4.9, 78, 'Gaming Arena', 
 ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'Streaming', 'Tournament Setup']),

('VR Universe', 'Next-gen virtual reality experiences and multiplayer games', 'Innovation District', 30.00, 4.8, 95, 'VR Zone', 
 ARRAY['https://images.unsplash.com/photo-1592478411213-6153e4ebc696?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'VR Headsets', 'Group Sessions']),

('Pixel Paradise', 'Cozy gaming lounge with indie and AAA titles', 'Creative Quarter', 18.00, 4.6, 142, 'Gaming Lounge', 
 ARRAY['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800'], 
 ARRAY['WiFi', 'Snacks', 'Comfortable Seating']),

('Retro Blast Arcade', 'Authentic 80s arcade with pinball and classic games', 'Heritage District', 15.00, 4.7, 203, 'Arcade', 
 ARRAY['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800'], 
 ARRAY['Pinball', 'Classic Games', 'Tokens']),

('Console Champions', 'Latest generation consoles in private gaming pods', 'Entertainment Zone', 22.00, 4.5, 167, 'Console Room', 
 ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800'], 
 ARRAY['PS5', 'Xbox Series X', 'Nintendo Switch']),

('Pro Gamer Hub', 'Professional gaming setup for serious competitors', 'Esports Complex', 45.00, 4.9, 89, 'Gaming Arena', 
 ARRAY['https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800'], 
 ARRAY['High-end PCs', 'Mechanical Keyboards', 'Gaming Chairs']),

('Virtual Reality Lounge', 'Immersive VR experiences for all ages', 'Family Entertainment Center', 28.00, 4.6, 134, 'VR Zone', 
 ARRAY['https://images.unsplash.com/photo-1617802690992-15d93263d3a9?auto=format&fit=crop&w=800'], 
 ARRAY['Family Friendly', 'Multiple VR Systems', 'Safety Equipment']),

('Neon Nights Gaming', '24/7 gaming center with energy drinks and snacks', 'Nightlife District', 20.00, 4.4, 178, 'Gaming Lounge', 
 ARRAY['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=800'], 
 ARRAY['24/7 Open', 'Energy Drinks', 'Night Gaming']),

('Arcade Kingdom', 'Massive arcade with over 100 classic and modern games', 'Mall Central', 12.00, 4.8, 256, 'Arcade', 
 ARRAY['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800'], 
 ARRAY['100+ Games', 'Prize Redemption', 'Birthday Parties']),

('Elite Console Lounge', 'Premium console gaming with luxury amenities', 'Uptown Gaming', 35.00, 4.7, 91, 'Console Room', 
 ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800'], 
 ARRAY['Luxury Seating', 'Premium Sound', 'VIP Service']);

-- Add corresponding services for the new venues
INSERT INTO public.venue_services (venue_id, name, price, duration, description) VALUES
-- Cyber Arena Pro services
((SELECT id FROM public.venues WHERE name = 'Cyber Arena Pro'), 'Pro Gaming Session', 40.00, '1 hour', 'High-end gaming with streaming capability'),
((SELECT id FROM public.venues WHERE name = 'Cyber Arena Pro'), 'Tournament Package', 150.00, '4 hours', 'Full tournament setup with streaming'),

-- VR Universe services
((SELECT id FROM public.venues WHERE name = 'VR Universe'), 'VR Experience', 30.00, '1 hour', 'Premium VR gaming session'),
((SELECT id FROM public.venues WHERE name = 'VR Universe'), 'Group VR Party', 100.00, '2 hours', 'Multiplayer VR experience for groups'),

-- Pixel Paradise services
((SELECT id FROM public.venues WHERE name = 'Pixel Paradise'), 'Casual Gaming', 18.00, '1 hour', 'Relaxed gaming session'),
((SELECT id FROM public.venues WHERE name = 'Pixel Paradise'), 'All-Day Pass', 60.00, '8 hours', 'Full day gaming access'),

-- Retro Blast Arcade services
((SELECT id FROM public.venues WHERE name = 'Retro Blast Arcade'), 'Arcade Pass', 15.00, '1 hour', 'Unlimited classic arcade games'),
((SELECT id FROM public.venues WHERE name = 'Retro Blast Arcade'), 'Pinball Tournament', 25.00, '2 hours', 'Competitive pinball gaming'),

-- Console Champions services
((SELECT id FROM public.venues WHERE name = 'Console Champions'), 'Console Gaming', 22.00, '1 hour', 'Latest console gaming in private pods'),
((SELECT id FROM public.venues WHERE name = 'Console Champions'), 'Pod Rental', 80.00, '4 hours', 'Extended private pod gaming');
