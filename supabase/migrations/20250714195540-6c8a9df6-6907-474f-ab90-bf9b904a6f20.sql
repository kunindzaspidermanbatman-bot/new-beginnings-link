-- Fix RLS policies to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view lobbies they're involved in" ON public.lobbies;
DROP POLICY IF EXISTS "Users can view lobby members for their lobbies" ON public.lobby_members;

-- Create fixed policies for lobbies
CREATE POLICY "Users can view their own lobbies" 
ON public.lobbies 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view lobbies they are members of" 
ON public.lobbies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lobby_members 
    WHERE lobby_members.lobby_id = lobbies.id 
    AND lobby_members.user_id = auth.uid()
  )
);

-- Create fixed policies for lobby members
CREATE POLICY "Lobby creators can view all members" 
ON public.lobby_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE lobbies.id = lobby_members.lobby_id 
    AND lobbies.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own lobby memberships" 
ON public.lobby_members 
FOR SELECT 
USING (auth.uid() = user_id);