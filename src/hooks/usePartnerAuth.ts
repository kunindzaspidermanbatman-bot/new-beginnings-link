import { useAuth } from './useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PartnerProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'customer' | 'partner' | 'admin';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const usePartnerAuth = () => {
  const { user, session, loading: authLoading, signInWithEmail, signUpWithEmail, signOut } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['partner-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as PartnerProfile;
    },
    enabled: !!user?.id,
  });

  const signUpAsPartner = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/partner/dashboard`,
        data: {
          full_name: fullName,
          role: 'partner'
        }
      }
    });
    return { error };
  };

  const isPartner = profile?.role === 'partner';
  const loading = authLoading || profileLoading;

  return {
    user,
    session,
    profile,
    loading,
    isPartner,
    signInWithEmail,
    signUpAsPartner,
    signOut,
  };
};