-- Remove all friends and lobby functionality

-- Drop policies first
DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can respond to friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own sent friend requests" ON public.friend_requests;

DROP POLICY IF EXISTS "Users can view their friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friends;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friends;

DROP POLICY IF EXISTS "lobby_select_own" ON public.lobbies;
DROP POLICY IF EXISTS "lobby_select_member" ON public.lobbies;
DROP POLICY IF EXISTS "lobby_insert_own" ON public.lobbies;
DROP POLICY IF EXISTS "lobby_update_own" ON public.lobbies;
DROP POLICY IF EXISTS "lobby_delete_own" ON public.lobbies;

DROP POLICY IF EXISTS "member_select_own" ON public.lobby_members;
DROP POLICY IF EXISTS "member_select_creator" ON public.lobby_members;
DROP POLICY IF EXISTS "member_insert_creator" ON public.lobby_members;
DROP POLICY IF EXISTS "member_update_own" ON public.lobby_members;
DROP POLICY IF EXISTS "member_delete_creator" ON public.lobby_members;
DROP POLICY IF EXISTS "member_delete_own" ON public.lobby_members;

DROP POLICY IF EXISTS "Users can search profiles by email for friend requests" ON public.profiles;

-- Drop triggers
DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
DROP TRIGGER IF EXISTS update_lobbies_updated_at ON public.lobbies;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_friend_request_accepted();
DROP FUNCTION IF EXISTS public.update_lobby_updated_at();
DROP FUNCTION IF EXISTS public.is_lobby_creator(uuid);
DROP FUNCTION IF EXISTS public.is_lobby_member(uuid);

-- Drop tables
DROP TABLE IF EXISTS public.lobby_members;
DROP TABLE IF EXISTS public.lobbies;
DROP TABLE IF EXISTS public.friends;
DROP TABLE IF EXISTS public.friend_requests;