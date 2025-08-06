-- Clean up database - remove all venues and associated data
-- Delete in correct order to respect foreign key constraints

-- Delete booking services first (references bookings)
DELETE FROM booking_services;

-- Delete bookings (references venues and users)
DELETE FROM bookings;

-- Delete notifications 
DELETE FROM notifications;

-- Delete reviews (references venues and users)
DELETE FROM reviews;

-- Delete user favorites (references venues and users)
DELETE FROM user_favorites;

-- Delete saved payment methods
DELETE FROM saved_payment_methods;

-- Delete venue services (references venues)
DELETE FROM venue_services;

-- Delete all venues
DELETE FROM venues;

-- Delete all user profiles (this will clean up all users)
DELETE FROM profiles;