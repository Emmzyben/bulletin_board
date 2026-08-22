import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, socket } from '../api';
import { useEffect } from 'react';

export function useNotifications(userEmail) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      try {
        const data = await api.get('/notifications');
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!userEmail,
    refetchInterval: 15000,
  });

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!userEmail) return;
    
    if (!socket.connected) {
      socket.connect();
    }
    
    // Assume backend places user in a personal room for notifications
    socket.emit('joinNotifications', userEmail);

    const handleNewNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, [userEmail, queryClient]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      await api.put(`/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;
    
    await api.put('/notifications/read-all');
      
    queryClient.invalidateQueries({ queryKey: ['notifications', userEmail] });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}