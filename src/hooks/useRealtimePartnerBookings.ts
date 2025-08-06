import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { audioAlert } from '@/utils/audioAlert';

export const useRealtimePartnerBookings = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!profile) return;

    console.log('Setting up additional real-time booking subscription for partner:', profile.id);

    const channel = supabase
      .channel('partner-booking-global-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          console.log('Global booking notification - New booking request received:', payload);
          
          // Check if this booking is for one of the partner's venues
          const { data: venue } = await supabase
            .from('venues')
            .select('name, partner_id')
            .eq('id', payload.new.venue_id)
            .eq('partner_id', profile.id)
            .single();

          if (venue) {
            console.log('Booking is for this partner - playing global alert sound');
            
            // Play additional booking alert sound (longer, more urgent)
            audioAlert.playBookingSound();
            
            // Additional global toast notification
            toast({
              title: "🔔 New Booking Request!",
              description: `New booking request for ${venue.name}`,
              duration: 8000,
            });

            // Invalidate any other relevant queries
            queryClient.invalidateQueries({ queryKey: ['partner-venues'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from global partner booking notifications');
      supabase.removeChannel(channel);
    };
  }, [profile, queryClient, toast]);
};