-- Drop all existing lobby-related policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own lobbies" ON public.lobbies;
DROP POLICY IF EXISTS "Users can view lobbies they are members of" ON public.lobbies;
DROP POLICY IF EXISTS "Lobby creators can view all members" ON public.lobby_members;
DROP POLICY IF EXISTS "Users can view their own lobby memberships" ON public.lobby_members;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_lobby_creator(lobby_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE id = lobby_id AND creator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_lobby_member(lobby_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lobby_members 
    WHERE lobby_id = lobby_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create simple, non-recursive policies for lobbies
CREATE POLICY "Users can view their created lobbies" 
ON public.lobbies 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view lobbies where they are members" 
ON public.lobbies 
FOR SELECT 
USING (public.is_lobby_member(id));

CREATE POLICY "Users can create their own lobbies" 
ON public.lobbies 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their lobbies" 
ON public.lobbies 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their lobbies" 
ON public.lobbies 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create simple policies for lobby_members
CREATE POLICY "Users can view their own memberships" 
ON public.lobby_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Lobby creators can view their lobby members" 
ON public.lobby_members 
FOR SELECT 
USING (public.is_lobby_creator(lobby_id));

CREATE POLICY "Lobby creators can invite members" 
ON public.lobby_members 
FOR INSERT 
WITH CHECK (public.is_lobby_creator(lobby_id));

CREATE POLICY "Users can respond to their invitations" 
ON public.lobby_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Lobby creators can remove members" 
ON public.lobby_members 
FOR DELETE 
USING (public.is_lobby_creator(lobby_id));

CREATE POLICY "Users can leave lobbies" 
ON public.lobby_members 
FOR DELETE 
USING (auth.uid() = user_id);