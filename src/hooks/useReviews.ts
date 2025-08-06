import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Review {
  id: string;
  venue_id: string;
  user_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface CreateReviewData {
  venue_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
}

export const useVenueReviews = (venueId: string) => {
  return useQuery({
    queryKey: ['venue-reviews', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('venue_id', venueId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user names for reviews
      const reviewsWithUserNames = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', review.user_id)
            .single();
          
          return {
            ...review,
            user_name: profile?.full_name || 'Anonymous'
          };
        })
      );
      
      return reviewsWithUserNames as Review[];
    },
  });
};

export const useUserReviewForVenue = (venueId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-review', venueId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Review | null;
    },
    enabled: !!user?.id,
  });
};

// Check if user has completed bookings for this venue
export const useUserCompletedBookings = (venueId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-completed-bookings', venueId, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('venue_id', venueId)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .lt('booking_date', now.toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};

export const useCreateReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          ...reviewData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Review> & { id: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', data.venue_id] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['venue-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-review'] });
      queryClient.invalidateQueries({ queryKey: ['venues'] });
    },
  });
};