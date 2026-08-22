import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useSubscription() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        const data = await api.get('/subscription/check-trial-upgrade');
        // If the edge function isn't deployed or returns an error, fail gracefully
        if (error) {
          console.warn('Subscription check unavailable, defaulting to trial active:', error.message);
          return { plan: 'free', trial_active: true, days_left: 14 };
        }
        return data;
      } catch (err) {
        console.warn('Subscription check failed, defaulting to trial active:', err.message);
        return { plan: 'free', trial_active: true, days_left: 14 };
      }
    },
    refetchInterval: 60000, // Check every minute
    retry: false, // Don't retry on failure
    enabled: true,
  });

  return {
    plan: data?.plan || 'free',
    trialActive: data?.trial_active ?? true, // Default to true so features are accessible
    daysLeft: data?.days_left || 14,
    isPro: data?.plan === 'pro',
    isLoading,
  };
}