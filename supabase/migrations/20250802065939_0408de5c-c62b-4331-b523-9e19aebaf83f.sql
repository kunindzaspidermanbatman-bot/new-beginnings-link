-- Create notifications log table for deleted notifications
CREATE TABLE public.notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_notification_id uuid NOT NULL,
  user_id uuid NOT NULL,
  booking_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL,
  scheduled_for timestamp with time zone,
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications log
CREATE POLICY "Admins can view all notifications log" 
ON public.notifications_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert into log
CREATE POLICY "Service role can insert notifications log" 
ON public.notifications_log 
FOR INSERT 
WITH CHECK (true);

-- Create function to move notification to log instead of deleting
CREATE OR REPLACE FUNCTION public.delete_notification_with_log(notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  notification_record public.notifications%ROWTYPE;
BEGIN
  -- Get the notification to be deleted
  SELECT * INTO notification_record 
  FROM public.notifications 
  WHERE id = notification_id AND user_id = auth.uid();
  
  -- If notification doesn't exist or doesn't belong to user, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Insert into log table
  INSERT INTO public.notifications_log (
    original_notification_id,
    user_id,
    booking_id,
    type,
    title,
    message,
    read,
    created_at,
    scheduled_for,
    deleted_by
  ) VALUES (
    notification_record.id,
    notification_record.user_id,
    notification_record.booking_id,
    notification_record.type,
    notification_record.title,
    notification_record.message,
    notification_record.read,
    notification_record.created_at,
    notification_record.scheduled_for,
    auth.uid()
  );
  
  -- Delete the original notification
  DELETE FROM public.notifications WHERE id = notification_id;
  
  RETURN true;
END;
$$;