import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { audioAlert } from '@/utils/audioAlert';

export const useRealtimeBookings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time booking subscription for user:', user.id);

    const channel = supabase
      .channel('booking-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Booking status changed:', payload);
          
          const oldStatus = payload.old.status;
          const newStatus = payload.new.status;
          
          // Only handle status changes from pending to confirmed/rejected
          if (oldStatus === 'pending' && (newStatus === 'confirmed' || newStatus === 'rejected')) {
            // Fetch venue name for the notification
            const { data: venue } = await supabase
              .from('venues')
              .select('name')
              .eq('id', payload.new.venue_id)
              .single();

            const venueName = venue?.name || 'venue';
            
            if (newStatus === 'confirmed') {
              // Play success sound
              audioAlert.playNotificationSound(2500);
              
              toast({
                title: "🎉 Booking Confirmed!",
                description: `Your booking for ${venueName} has been approved!`,
                duration: 5000,
              });
            } else if (newStatus === 'rejected') {
              // Play notification sound
              audioAlert.playNotificationSound(2000);
              
              toast({
                title: "❌ Booking Rejected",
                description: `Your booking for ${venueName} was not approved.`,
                variant: "destructive",
                duration: 5000,
              });
            }

            // Update booking queries in cache
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from booking status changes');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, toast]);
};