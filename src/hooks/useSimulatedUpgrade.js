import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';

export function useSimulatedUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async purchase => {
      const planId = typeof purchase === 'string' ? purchase : purchase.planId;
      const seatCount = typeof purchase === 'string' ? 1 : purchase.seatCount;
      const workspaceId = typeof purchase === 'string' ? undefined : purchase.workspaceId;
      const result = await api.post('/subscription/simulate-payment', {
        plan_id: planId,
        seat_count: seatCount,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
      });
      if (!result.success) throw new Error(result.message || 'Simulated payment failed');
      return result;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
