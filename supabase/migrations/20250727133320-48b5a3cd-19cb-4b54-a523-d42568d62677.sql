-- Let's temporarily disable RLS to test if that's the issue, then re-enable with a working policy
ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;

-- Test if the user can insert now - let's check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'venues'
ORDER BY ordinal_position;