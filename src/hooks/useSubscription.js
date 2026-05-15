import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

export function useSubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-trial-upgrade');
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Check every minute
    enabled: true,
  });

  return {
    plan: data?.plan || 'free',
    trialActive: data?.trial_active || false,
    daysLeft: data?.days_left || 0,
    isPro: data?.plan === 'pro',
    isLoading,
  };
}