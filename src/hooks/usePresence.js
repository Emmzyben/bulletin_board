import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, socket } from '../api';

/**
 * Manages online presence for a user in a workspace.
 * - Upserts a Presence record every 30s (heartbeat)
 * - Marks offline on unmount
 * - Returns list of online members in the workspace
 */
export function usePresence({ user, workspaceId, channelId }) {
  const queryClient = useQueryClient();
  const heartbeatRef = useRef(null);

  const upsertPresence = useCallback(async (status = 'online') => {
    if (!user?.email || !workspaceId) return;
    const now = new Date().toISOString();
    
    try {
      await api.post('/presence', {
        workspace_id: workspaceId,
        status,
        channel_id: channelId || null,
      });
      queryClient.invalidateQueries({ queryKey: ['presence', workspaceId] });
    } catch (error) {
      console.error('Presence upsert failed:', error);
    }
    
    queryClient.invalidateQueries({ queryKey: ['presence', workspaceId] });
  }, [user?.email, user?.full_name, workspaceId, channelId, queryClient]);

  // Mark a channel as read (store timestamp)
  const markChannelRead = useCallback(async (cid) => {
    if (!user?.email || !workspaceId || !cid) return;
    const now = new Date().toISOString();
    
    try {
      // Note: Assuming a backend endpoint is implemented for this
      await api.put(`/presence/last_read`, {
        workspace_id: workspaceId,
        channel_id: cid,
      });
    } catch (err) {
      console.error('Error marking channel read:', err);
    }
  }, [user?.email, workspaceId]);

  useEffect(() => {
    if (!user?.email || !workspaceId) return;
    upsertPresence('online');

    // Heartbeat every 30 seconds
    heartbeatRef.current = setInterval(() => upsertPresence('online'), 30000);

    const handleVisibility = () => {
      upsertPresence(document.hidden ? 'away' : 'online');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      // Mark offline
      api.post('/presence/offline', { workspace_id: workspaceId }).catch(() => {});
    };
  }, [user?.email, workspaceId, upsertPresence]);

  // Re-upsert when channelId changes
  useEffect(() => {
    if (user?.email && workspaceId && channelId) {
      upsertPresence('online');
    }
  }, [channelId, user?.email, workspaceId, upsertPresence]);

  // Fetch all presence records for this workspace
  const { data: presenceList = [] } = useQuery({
    queryKey: ['presence', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      try {
        const data = await api.get(`/presence/${workspaceId}`);
        return data || [];
      } catch (error) {
        throw error;
      }
    },
    enabled: !!workspaceId,
    refetchInterval: 15000,
  });

  // Real-time subscription using socket.io
  useEffect(() => {
    if (!workspaceId) return;
    
    // Connect socket if not already
    if (!socket.connected) {
      socket.connect();
    }

    // Join workspace room
    socket.emit('joinWorkspace', workspaceId);

    const handlePresenceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['presence', workspaceId] });
    };

    socket.on('presenceUpdate', handlePresenceUpdate);

    return () => {
      socket.off('presenceUpdate', handlePresenceUpdate);
      socket.emit('leaveWorkspace', workspaceId);
    };
  }, [workspaceId, queryClient]);

  // Consider online = last_seen within 60 seconds
  const onlineThreshold = Date.now() - 60000;
  const onlineMembers = presenceList.filter(p => {
    if (p.status === 'offline') return false;
    if (!p.last_seen) return false;
    return new Date(p.last_seen).getTime() > onlineThreshold;
  });

  // My own last_read map
  const myPresence = presenceList.find(p => p.user_email === user?.email);
  const lastReadMap = myPresence?.last_read || {};

  return { onlineMembers, presenceList, lastReadMap, markChannelRead };
}