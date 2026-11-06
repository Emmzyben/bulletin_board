import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';

function normalizeFeatures(features) {
  let value = features;
  for (let attempt = 0; typeof value === 'string' && attempt < 2; attempt += 1) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? value.filter(feature => typeof feature === 'string') : [];
}

export function usePricingPlans() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async () => {
      const response = await api.get('/pricing');
      const plans = Array.isArray(response) ? response : response?.plans;
      return Array.isArray(plans)
        ? plans.map(plan => ({ ...plan, features: normalizeFeatures(plan.features) }))
        : [];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return { plans: Array.isArray(data) ? data : [], isLoading, isError };
}
