-- Update the user role to partner 
UPDATE profiles 
SET role = 'partner' 
WHERE id = 'fed86113-c00b-4814-aac2-1f2a4b304a68';

-- Update venues to belong to the current user (partner)
UPDATE venues 
SET partner_id = 'fed86113-c00b-4814-aac2-1f2a4b304a68' 
WHERE partner_id = '51ce6fb5-d119-4734-8b37-771e6c8e88a1';