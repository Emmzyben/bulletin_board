import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useEffect } from 'react';

export function useNotifications(userEmail) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userEmail,
    refetchInterval: 15000,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userEmail) return;
    
    const channel = supabase
      .channel(`notifications:${userEmail}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_email=eq.${userEmail}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadNotifications.map(n => n.id));
      
    queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}