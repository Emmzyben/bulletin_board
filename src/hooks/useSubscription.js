import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

export function useSubscription(enabled = true) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      try {
        return await api.get('/subscription/check-trial-upgrade');
      } catch (err) {
        console.error('Subscription check failed:', err.message);
        throw err;
      }
    },
    refetchInterval: 60000,
    retry: false,
    enabled,
  });

  return {
    plan: data?.plan || 'free',
    trialActive: data?.trial_active ?? false,
    daysLeft: data?.days_left ?? 0,
    seatCount: data?.seat_count ?? 1,
    seatsUsed: data?.seats_used ?? 0,
    workspaceCount: data?.workspace_count ?? 0,
    maxWorkspaces: data?.max_workspaces ?? 1,
    workspaces: data?.workspaces ?? [],
    hasWorkspaceAccess: data?.workspace_access ?? false,
    isPro: ['pro', 'annual', 'pro_multi', 'annual_multi'].includes(data?.plan || 'free'),
    isLoading,
    isError,
  };
}