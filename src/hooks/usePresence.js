import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';

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
    
    const { error } = await supabase.from('presence').upsert({
      user_email: user.email,
      workspace_id: workspaceId,
      user_name: user.full_name || user.email || user.user_metadata?.full_name,
      status,
      last_seen: now,
      channel_id: channelId || null,
    }, { onConflict: 'user_email, workspace_id' });

    if (error) console.error('Presence upsert failed:', error);
    
    queryClient.invalidateQueries({ queryKey: ['presence', workspaceId] });
  }, [user?.email, user?.full_name, workspaceId, channelId, queryClient]);

  // Mark a channel as read (store timestamp)
  const markChannelRead = useCallback(async (cid) => {
    if (!user?.email || !workspaceId || !cid) return;
    const now = new Date().toISOString();
    
    // Fetch current last_read map
    const { data: recs } = await supabase
      .from('presence')
      .select('last_read')
      .eq('user_email', user.email)
      .eq('workspace_id', workspaceId);
    
    const current = recs?.[0]?.last_read || {};
    
    await supabase.from('presence').update({
      last_read: { ...current, [cid]: now },
    }).eq('user_email', user.email).eq('workspace_id', workspaceId);
    
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
      supabase.from('presence').update({ 
        status: 'offline', 
        last_seen: new Date().toISOString() 
      }).eq('user_email', user.email).eq('workspace_id', workspaceId).catch(() => {});
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
      const { data, error } = await supabase
        .from('presence')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspaceId,
    refetchInterval: 15000,
  });

  // Real-time subscription using Supabase Channels
  useEffect(() => {
    if (!workspaceId) return;
    
    const channel = supabase
      .channel(`presence:${workspaceId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'presence',
        filter: `workspace_id=eq.${workspaceId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['presence', workspaceId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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