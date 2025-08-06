-- Clear existing venue categories and insert only the gaming categories from the client homepage
DELETE FROM venue_categories;

INSERT INTO venue_categories (name) VALUES 
('Gaming Arena'),
('Gaming Lounge'),
('Console Room'),
('VR Zone'),
('Arcade');