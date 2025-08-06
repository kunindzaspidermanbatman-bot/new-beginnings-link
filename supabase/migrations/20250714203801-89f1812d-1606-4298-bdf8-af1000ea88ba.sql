-- Add DELETE policy for friend_requests table so users can delete their own sent requests
CREATE POLICY "Users can delete their own sent friend requests" 
ON public.friend_requests 
FOR DELETE 
USING (auth.uid() = sender_id);