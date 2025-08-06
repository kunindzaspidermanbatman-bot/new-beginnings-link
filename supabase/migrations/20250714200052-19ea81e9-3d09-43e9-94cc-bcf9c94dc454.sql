-- Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "Users can create their own lobbies" ON public.lobbies;
DROP POLICY IF EXISTS "Creators can update their lobbies" ON public.lobbies;
DROP POLICY IF EXISTS "Creators can delete their lobbies" ON public.lobbies;
DROP POLICY IF EXISTS "Lobby creators can invite members" ON public.lobby_members;
DROP POLICY IF EXISTS "Users can respond to their invitations" ON public.lobby_members;
DROP POLICY IF EXISTS "Lobby creators can remove members" ON public.lobby_members;

-- Get a clean slate by dropping any remaining policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND (tablename = 'lobbies' OR tablename = 'lobby_members'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ';';
    END LOOP;
END
$$;

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

-- Create clean, simple policies for lobbies
CREATE POLICY "lobby_select_own" 
ON public.lobbies 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "lobby_select_member" 
ON public.lobbies 
FOR SELECT 
USING (public.is_lobby_member(id));

CREATE POLICY "lobby_insert_own" 
ON public.lobbies 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "lobby_update_own" 
ON public.lobbies 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "lobby_delete_own" 
ON public.lobbies 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create clean policies for lobby_members
CREATE POLICY "member_select_own" 
ON public.lobby_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "member_select_creator" 
ON public.lobby_members 
FOR SELECT 
USING (public.is_lobby_creator(lobby_id));

CREATE POLICY "member_insert_creator" 
ON public.lobby_members 
FOR INSERT 
WITH CHECK (public.is_lobby_creator(lobby_id));

CREATE POLICY "member_update_own" 
ON public.lobby_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "member_delete_creator" 
ON public.lobby_members 
FOR DELETE 
USING (public.is_lobby_creator(lobby_id));

CREATE POLICY "member_delete_own" 
ON public.lobby_members 
FOR DELETE 
USING (auth.uid() = user_id);