-- Add policy to allow users to find other users by email for friend requests
CREATE POLICY "Users can search profiles by email for friend requests"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND email IS NOT NULL);