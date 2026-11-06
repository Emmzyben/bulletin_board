import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';

export function useUserProfiles(emails = []) {
  const profileEmails = [...new Set(emails.filter(email => typeof email === 'string' && email.trim()))].sort();
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfiles', profileEmails],
    queryFn: () => api.post('/users/profiles', { emails: profileEmails }),
    enabled: profileEmails.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return Object.fromEntries(profiles.map(profile => [profile.email, profile]));
}
