-- Create friend requests table
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, receiver_id)
);

-- Create friends table (mutual friendship)
CREATE TABLE public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Create lobbies table
CREATE TABLE public.lobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  name TEXT NOT NULL,
  venue_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lobby members table
CREATE TABLE public.lobby_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lobby_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;

-- Friend requests policies
CREATE POLICY "Users can view their own friend requests" 
ON public.friend_requests 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
ON public.friend_requests 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can respond to friend requests" 
ON public.friend_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Friends policies
CREATE POLICY "Users can view their friendships" 
ON public.friends 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" 
ON public.friends 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their friendships" 
ON public.friends 
FOR DELETE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Lobbies policies
CREATE POLICY "Users can view lobbies they're involved in" 
ON public.lobbies 
FOR SELECT 
USING (
  auth.uid() = creator_id OR 
  EXISTS (
    SELECT 1 FROM public.lobby_members 
    WHERE lobby_id = lobbies.id AND user_id = auth.uid()
  )
);

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

-- Lobby members policies
CREATE POLICY "Users can view lobby members for their lobbies" 
ON public.lobby_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE lobbies.id = lobby_members.lobby_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Lobby creators can invite members" 
ON public.lobby_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE lobbies.id = lobby_id AND creator_id = auth.uid()
  )
);

CREATE POLICY "Users can respond to their invitations" 
ON public.lobby_members 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Lobby creators can remove members" 
ON public.lobby_members 
FOR DELETE 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.lobbies 
    WHERE lobbies.id = lobby_id AND creator_id = auth.uid()
  )
);

-- Create function to automatically create friendship when request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Insert friendship with consistent ordering (smaller UUID first)
    INSERT INTO public.friends (user1_id, user2_id)
    VALUES (
      CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.sender_id ELSE NEW.receiver_id END,
      CASE WHEN NEW.sender_id < NEW.receiver_id THEN NEW.receiver_id ELSE NEW.sender_id END
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    
    -- Set responded_at timestamp
    NEW.responded_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for friend request acceptance
CREATE TRIGGER on_friend_request_accepted
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_friend_request_accepted();

-- Create function to update lobby updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_lobby_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lobby updates
CREATE TRIGGER update_lobbies_updated_at
  BEFORE UPDATE ON public.lobbies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lobby_updated_at();