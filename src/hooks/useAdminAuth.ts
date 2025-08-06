import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'customer' | 'partner' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminAuth = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as AdminProfile;
    },
    enabled: !!user?.id,
  });

  const isAdmin = profile?.role === 'admin';
  const loading = authLoading || profileLoading;

  return {
    user,
    session,
    profile,
    loading,
    isAdmin,
    signOut,
  };
};