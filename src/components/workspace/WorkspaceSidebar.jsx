import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight, Settings, Clock, MoreHorizontal, Trash2, Radio } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEcosystem } from '@/lib/ecosystems';
import { usePresence } from '@/hooks/usePresence';
import { api, socket } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function WorkspaceSidebar({
  workspace, channels = [], activeChannelId, setActiveChannelId,
  activeDm, setActiveDm, b2bSpaces = [], onB2BClick, onResendB2BInvite, onDeleteB2BInvite,
  onManageB2BAccess, onEndB2BPartnership, userProfiles = {},
  onOpenSearch, onOpenStatus,
}) {
  const { user } = useAuth();
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [openB2B, setOpenB2B] = useState(null);
  const [showDmPicker, setShowDmPicker] = useState(false);
  const [selectedDmUsers, setSelectedDmUsers] = useState([]);
  const [hoveredChannel, setHoveredChannel] = useState(null);
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [channelMenuOpen, setChannelMenuOpen] = useState(null);
  const [managingChannel, setManagingChannel] = useState(null);
  const [selectedChannelMembers, setSelectedChannelMembers] = useState([]);
  const [activeHuddleChannels, setActiveHuddleChannels] = useState({}); // channelId -> participantCount
  const queryClient = useQueryClient();
  const eco = workspace ? getEcosystem(workspace.ecosystem) : null;
  const isOwner = user?.email === workspace?.owner_email;

  useEffect(() => {
    const handleStatus = ({ channelId, active, count }) => {
      setActiveHuddleChannels(prev => {
        if (!active || count === 0) {
          const next = { ...prev };
          delete next[channelId];
          return next;
        }
        return { ...prev, [channelId]: count };
      });
    };

    socket.on('huddle:channel_status', handleStatus);
    return () => {
      socket.off('huddle:channel_status', handleStatus);
    };
  }, []);

  const rawMembers = workspace?.members;
  const members = Array.isArray(rawMembers)
    ? rawMembers
    : typeof rawMembers === 'string'
      ? (() => { try { return JSON.parse(rawMembers); } catch { return []; } })()
      : [];
  const activeMembers = members.filter(member =>
    member?.email &&
    !['invited', 'removed', 'deactivated', 'inactive'].includes(member.status)
  );
  const {
    data: channelMembers = [],
    isLoading: loadingChannelMembers,
    isError: channelMembersError,
  } = useQuery({
    queryKey: ['channelMembers', managingChannel?.id],
    queryFn: async () => {
      const result = await api.get(`/channels/${managingChannel.id}/members`);
      if (!Array.isArray(result.members)) throw new Error('Invalid private channel member list');
      return result.members;
    },
    enabled: !!managingChannel,
  });

  useEffect(() => {
    if (managingChannel) setSelectedChannelMembers(channelMembers);
  }, [managingChannel?.id, channelMembers]);

  // Active vs pending B2B spaces
  const activeB2BSpaces = b2bSpaces.filter(s => s.status === 'active');
  const pendingB2BSpaces = b2bSpaces.filter(s => s.status === 'pending');

  const handleCreateChannel = async () => {
    if (!newChannelName || !workspace) return;
    try {
      await api.post('/channels', {
        name: newChannelName,
        workspace_id: workspace.id,
        type: newChannelType,
      });
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
      setShowNewChannel(false);
      setNewChannelName('');
    } catch (error) {
      console.error('Error creating channel:', error);
      toast.error('Failed to create channel');
    }
  };

  const handleRenameChannel = async (ch) => {
    if (!editChannelName.trim() || editChannelName === ch.name) {
      setEditingChannel(null);
      return;
    }
    try {
      await api.put(`/channels/${ch.id}`, { name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-') });
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    } catch (error) {
      toast.error('Failed to rename channel');
    }
    setEditingChannel(null);
  };

  const handleDeleteChannel = async (ch) => {
    if (!window.confirm(`Delete #${ch.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/channels/${ch.id}`);
      if (activeChannelId === ch.id) setActiveChannelId(null);
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
      toast.success(`#${ch.name} deleted`);
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const handleSaveChannelMembers = async () => {
    if (!managingChannel) return;
    try {
      const result = await api.put(`/channels/${managingChannel.id}/members`, {
        members: selectedChannelMembers,
      });
      setSelectedChannelMembers(result.members);
      queryClient.invalidateQueries({ queryKey: ['channelMembers', managingChannel.id] });
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
      toast.success('Private channel members updated');
      setManagingChannel(null);
    } catch (error) {
      console.error('Error updating private channel members:', error);
      toast.error(error.message || 'Failed to update private channel members');
    }
  };

  // Real-time subscription for channel updates
  useEffect(() => {
    if (!workspace?.id) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    };
    socket.on(`channel_update_${workspace.id}`, handleUpdate);
    
    return () => {
      socket.off(`channel_update_${workspace.id}`, handleUpdate);
    };
  }, [workspace?.id, queryClient]);

  // Close channel menu on outside click
  useEffect(() => {
    if (!channelMenuOpen) return;
    const close = () => setChannelMenuOpen(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [channelMenuOpen]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const { onlineMembers, lastReadMap } = usePresence({ user, workspaceId: workspace?.id, channelId: activeChannelId });
  const onlineEmails = new Set(onlineMembers.map(m => m.user_email));
  const onlineCount = onlineMembers.length;

  // Listen to new channel messages to update unread status in real-time
  useEffect(() => {
    if (!channels?.length) return;
    const handleMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    };
    channels.forEach(ch => {
      socket.on(`room_${ch.id}_message`, handleMessage);
    });
    return () => {
      channels.forEach(ch => {
        socket.off(`room_${ch.id}_message`, handleMessage);
      });
    };
  }, [channels, queryClient]);

  const allRegularChannels = channels.filter(c => c.type !== 'b2b');

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#0B1628' }}>
      {/* Workspace header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00C853', flexShrink: 0, boxShadow: '0 0 8px #00C853' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.3px' }}>
            {workspace?.name || 'My Workspace'}
          </span>
        </div>
        {eco && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6AADFF', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            {(() => { const Icon = eco.icon; return <Icon size={14} />; })()}
            {eco.label}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, background: '#00C853', borderRadius: '50%', boxShadow: '0 0 5px #00C853', flexShrink: 0, display: 'inline-block' }} />
          {onlineCount} member{onlineCount !== 1 ? 's' : ''} online
        </div>
      </div>

      {/* Search Trigger (Ctrl + K) */}
      <button
        onClick={onOpenSearch}
        title="Universal Search (Ctrl+K)"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: '10px 12px 2px', padding: '7px 11px',
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)',
          borderRadius: 8, fontSize: 12, color: '#7FA8D4', cursor: 'pointer',
          transition: '.15s', flexShrink: 0,
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.09)'; e.currentTarget.style.color = '#EEF4FF'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = '#7FA8D4'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13 }}>🔍</span> Search workspace
        </span>
        <kbd style={{ fontSize: 10, background: 'rgba(255,255,255,.08)', padding: '2px 5px', borderRadius: 4, color: '#9AB8DC', border: '1px solid rgba(255,255,255,.1)' }}>
          Ctrl+K
        </kbd>
      </button>

      {/* New Message button */}
      <button
        onClick={() => setShowDmPicker(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          margin: '4px 12px 4px', padding: '8px 14px',
          background: 'linear-gradient(135deg,rgba(27,110,243,.2),rgba(0,180,216,.1))',
          border: '1px solid rgba(27,110,243,.3)', borderRadius: 8,
          fontSize: 13, fontWeight: 700, color: '#6AADFF', cursor: 'pointer',
          transition: '.15s', flexShrink: 0,
        }}
        onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(27,110,243,.32),rgba(0,180,216,.18))'; e.currentTarget.style.color = '#fff'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(27,110,243,.2),rgba(0,180,216,.1))'; e.currentTarget.style.color = '#6AADFF'; }}
      >
        ✏️ New Message
      </button>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0 20px' }}>

        {/* Channels section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
          <span>Channels</span>
          {isOwner && (
            <button
              onClick={() => setShowNewChannel(true)}
              style={{ fontSize: 17, color: '#6B93C4', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer' }}
            >+</button>
          )}
        </div>

        {allRegularChannels.map(ch => (
          <div
            key={ch.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHoveredChannel(ch.id)}
            onMouseLeave={() => setHoveredChannel(null)}
          >
            {editingChannel === ch.id ? (
              <div style={{ padding: '4px 12px' }}>
                <input
                  autoFocus
                  value={editChannelName}
                  onChange={e => setEditChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameChannel(ch);
                    if (e.key === 'Escape') setEditingChannel(null);
                  }}
                  onBlur={() => handleRenameChannel(ch)}
                  style={{ width: '100%', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(27,110,243,.5)', borderRadius: 6, padding: '5px 8px', color: '#EEF4FF', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
            ) : (
              (() => {
                const lastRead = lastReadMap?.[ch.id] ? new Date(lastReadMap[ch.id]).getTime() : 0;
                const latestMsg = ch.latest_message_at ? new Date(ch.latest_message_at).getTime() : 0;
                const isActive = activeChannelId === ch.id && !activeDm;
                const hasUnread = !isActive && latestMsg > lastRead && latestMsg > 0;
                return (
                  <button
                    onClick={() => { setActiveChannelId(ch.id); setActiveDm(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 16px', cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: isActive || hasUnread ? 700 : 500,
                      color: isActive ? '#EEF4FF' : hasUnread ? '#FFFFFF' : '#7FA8D4',
                      background: isActive ? 'rgba(27,110,243,.14)' : 'transparent',
                      border: 'none', width: '100%', textAlign: 'left',
                      position: 'relative', transition: '.15s',
                    }}
                  >
                    {isActive && (
                      <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#1B6EF3', borderRadius: '0 3px 3px 0' }} />
                    )}
                    <span style={{ fontSize: 14, color: hasUnread ? '#AACFFF' : '#6B93C4', width: 16, flexShrink: 0, textAlign: 'center' }}>
                      {ch.type === 'private' ? '🔒' : '#'}
                    </span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</span>
                    {/* Live Huddle active badge */}
                    {activeHuddleChannels[ch.id] > 0 && (
                      <span
                        title={`Live Huddle (${activeHuddleChannels[ch.id]} participant${activeHuddleChannels[ch.id] > 1 ? 's' : ''})`}
                        style={{
                          fontSize: 10, fontWeight: 800, color: '#00C853',
                          background: 'rgba(0,200,83,.15)', border: '1px solid rgba(0,200,83,.3)',
                          borderRadius: 10, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        <Radio size={11} color="#00C853" />
                        <span>{activeHuddleChannels[ch.id]}</span>
                      </span>
                    )}
                    {/* Unread indicator dot */}
                    {hasUnread && hoveredChannel !== ch.id && !activeHuddleChannels[ch.id] && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#1B6EF3',
                        boxShadow: '0 0 6px rgba(27,110,243,.7)',
                        flexShrink: 0, marginLeft: 'auto',
                      }} />
                    )}
                    {/* Kebab menu — admin only */}
                    {isOwner && hoveredChannel === ch.id && (
                      <button
                        onClick={e => { e.stopPropagation(); setChannelMenuOpen(channelMenuOpen === ch.id ? null : ch.id); }}
                        style={{ marginLeft: 'auto', padding: '2px 4px', background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#7FA8D4', display: 'flex', alignItems: 'center' }}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    )}
                  </button>
                );
              })()
            )}

            {/* Channel context menu */}
            {channelMenuOpen === ch.id && (
              <div style={{
                position: 'absolute', right: 8, top: '100%', zIndex: 50,
                background: '#0F1E35', border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 8, padding: '4px', minWidth: 130,
                boxShadow: '0 8px 24px rgba(0,0,0,.4)',
              }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setEditingChannel(ch.id); setEditChannelName(ch.name); setChannelMenuOpen(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', color: '#EEF4FF', fontSize: 13, cursor: 'pointer', borderRadius: 5, textAlign: 'left' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >✏️ Rename</button>
                {ch.type === 'private' && (
                  <button
                    onClick={() => { setManagingChannel(ch); setChannelMenuOpen(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', color: '#EEF4FF', fontSize: 13, cursor: 'pointer', borderRadius: 5, textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >👥 Manage members</button>
                )}
                <button
                  onClick={() => { handleDeleteChannel(ch); setChannelMenuOpen(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', background: 'none', border: 'none', color: '#EF5350', fontSize: 13, cursor: 'pointer', borderRadius: 5, textAlign: 'left' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239,83,80,.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >🗑️ Delete</button>
              </div>
            )}
          </div>
        ))}

        {/* Active B2B Spaces */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
          <span>External · B2B</span>
          {isOwner && (
            <button
              onClick={onB2BClick}
              style={{ fontSize: 11, fontWeight: 700, color: '#00B4D8', background: 'rgba(0,180,216,.1)', border: '1px solid rgba(0,180,216,.25)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}
            >+ Invite</button>
          )}
        </div>

        {activeB2BSpaces.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(150,190,240,.4)', padding: '4px 16px 8px' }}>No active B2B spaces</div>
        ) : (
          activeB2BSpaces.map(space => {
            const isOpen = openB2B === space.id;
            const initB2B = space.company_name?.slice(0, 2).toUpperCase() || 'B2';
            return (
              <div key={space.id} style={{ margin: '2px 0', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenB2B(isOpen ? null : space.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 14px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 700, color: isOpen ? '#EEF4FF' : '#7FA8D4',
                    transition: '.15s', border: 'none', background: 'transparent', width: '100%', textAlign: 'left',
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 4, background: 'linear-gradient(135deg,#1B6EF3,#00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {initB2B}
                  </div>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{space.company_name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#00B4D8', background: 'rgba(0,180,216,.12)', border: '1px solid rgba(0,180,216,.25)', borderRadius: 3, padding: '1px 5px' }}>
                    {space.relationship_type || 'B2B'}
                  </span>
                  <ChevronRight style={{ width: 12, height: 12, color: '#6B93C4', transform: isOpen ? 'rotate(90deg)' : 'none', transition: '.2s' }} />
                </button>
                {isOpen && space.admin_email?.toLowerCase() === user?.email?.toLowerCase() && (
                  <button
                    onClick={() => onManageB2BAccess?.(space)}
                    style={{ display: 'block', margin: '0 14px 6px 48px', padding: '4px 8px', border: '1px solid rgba(0,180,216,.25)', borderRadius: 5, background: 'rgba(0,180,216,.08)', color: '#6AD6E8', fontSize: 11, cursor: 'pointer' }}
                  >Manage shared members</button>
                )}
                {isOpen && (isOwner || space.admin_email?.toLowerCase() === user?.email?.toLowerCase()) && (
                  <button
                    onClick={() => onEndB2BPartnership?.(space)}
                    style={{ display: 'block', margin: '0 14px 6px 48px', padding: '4px 8px', border: '1px solid rgba(239,83,80,.25)', borderRadius: 5, background: 'rgba(239,83,80,.08)', color: '#F28B82', fontSize: 11, cursor: 'pointer' }}
                  >End partnership</button>
                )}
                {isOpen && space.shared_channels?.map((chName, i) => (
                  <button key={i} 
                  onClick={() => {
                    const b2bChannel = channels.find(c => c.name === chName && c.type === 'b2b' && c.workspace_id === space.workspace_id);
                    if (b2bChannel) {
                      setActiveChannelId(b2bChannel.id);
                      setActiveDm(null);
                    } else {
                      toast.error('Channel not found or not accessible');
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 14px 6px 22px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#7FA8D4',
                    transition: '.15s', border: 'none', background: 'transparent', width: '100%', textAlign: 'left',
                  }}>
                    <span style={{ fontSize: 13, color: '#6B93C4', width: 15 }}>#</span>
                    <span>{chName}</span>
                  </button>
                ))}
              </div>
            );
          })
        )}

        {/* Pending B2B Invites — admin only */}
        {isOwner && pendingB2BSpaces.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(255,143,0,.6)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
              <Clock size={11} />
              <span>Pending Invites</span>
            </div>
            {pendingB2BSpaces.map(space => (
              <div key={space.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', opacity: 0.7 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,143,0,.2)', border: '1px solid rgba(255,143,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#FF8F00', flexShrink: 0 }}>
                  {space.company_name?.slice(0, 2).toUpperCase() || 'B2'}
                </div>
                <span style={{ fontSize: 12, color: '#FF8F00', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{space.company_name}</span>
                <button
                  onClick={() => onResendB2BInvite && onResendB2BInvite(space)}
                  title="Resend invite"
                  style={{ fontSize: 10, fontWeight: 700, color: '#FF8F00', background: 'rgba(255,143,0,.1)', border: '1px solid rgba(255,143,0,.25)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >↩ Resend</button>
                <button
                  onClick={() => onDeleteB2BInvite && onDeleteB2BInvite(space)}
                  title="Delete pending invite"
                  aria-label={`Delete pending invite for ${space.company_name}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, color: '#EF5350', background: 'rgba(239,83,80,.1)', border: '1px solid rgba(239,83,80,.25)', borderRadius: 4, cursor: 'pointer', flexShrink: 0 }}
                ><Trash2 size={13} /></button>
              </div>
            ))}
          </>
        )}

        {/* Direct Messages */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
          <span>Direct Messages</span>
        </div>
        {(() => {
          if (members.length <= 1) {
            return <div style={{ fontSize: 12, color: 'rgba(150,190,240,.35)', padding: '2px 16px 8px' }}>No other members</div>;
          }
          return members.filter(m => m.email !== user?.email).map(m => {
            const isOnline = onlineEmails.has(m.email);
            const statusColor = isOnline ? '#00C853' : '#4B5563';
            const isActive = activeDm === m.email;
            return (
            <button key={m.email} onClick={() => { setActiveDm(m.email); setActiveChannelId(null); }} style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', 
              background: isActive ? 'rgba(27,110,243,.14)' : 'transparent',
              border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer',
              position: 'relative', transition: '.15s'
            }}
            onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
            onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#1B6EF3', borderRadius: '0 3px 3px 0' }} />
              )}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarImage src={userProfiles[m.email]?.avatar_url || undefined} alt={m.email} className="object-cover" />
                  <AvatarFallback className="rounded-md" style={{ background: `hsl(${(m.email.charCodeAt(0) * 37) % 360},55%,40%)`, color: '#fff', fontSize: 9, fontWeight: 800 }}>
                    {m.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, background: statusColor, borderRadius: '50%', border: '2px solid #0B1628', boxShadow: isOnline ? '0 0 4px #00C853' : 'none' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? '#EEF4FF' : '#7FA8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.email.split('@')[0]}
                  </span>
                  {userProfiles[m.email]?.status_emoji && (
                    <span style={{ fontSize: 12 }} title={userProfiles[m.email]?.status_text || ''}>
                      {userProfiles[m.email]?.status_emoji}
                    </span>
                  )}
                </div>
                {m.status === 'invited' && <div style={{ fontSize: 10, color: '#FF8F00', fontWeight: 600 }}>Invited</div>}
              </div>
            </button>
          )})
        })()}

        {/* Active Group DM if selected */}
        {activeDm && activeDm.includes(',') && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px',
            background: 'rgba(27,110,243,.14)', position: 'relative', marginTop: 4,
          }}>
            <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#1B6EF3', borderRadius: '0 3px 3px 0' }} />
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff',
            }}>
              👥
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeDm.split(',').filter(e => e !== user?.email).map(e => e.split('@')[0]).join(', ')}
              </div>
              <div style={{ fontSize: 10, color: '#6AADFF' }}>Group conversation</div>
            </div>
          </div>
        )}
      </div>

      {/* User status bar */}
      <div
        onClick={onOpenStatus}
        title="Click to set custom status"
        style={{
          borderTop: '1px solid rgba(255,255,255,.07)', padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          cursor: 'pointer', transition: '.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={userProfiles[user?.email]?.avatar_url || undefined} alt={user?.full_name || 'Your profile'} className="object-cover" />
            <AvatarFallback className="rounded-lg" style={{ background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)', color: '#fff', fontSize: 11, fontWeight: 800 }}>{initials}</AvatarFallback>
          </Avatar>
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, background: '#00C853', borderRadius: '50%', border: '2px solid #0B1628', boxShadow: '0 0 5px #00C853' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'You'}
            </span>
            {userProfiles[user?.email]?.status_emoji && (
              <span style={{ fontSize: 13 }} title={userProfiles[user?.email]?.status_text || 'Status'}>
                {userProfiles[user?.email]?.status_emoji}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: userProfiles[user?.email]?.status_text ? '#6AADFF' : '#00C853', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userProfiles[user?.email]?.status_text ? userProfiles[user?.email]?.status_text : '● Online · Set status'}
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7FA8D4', padding: 4 }}>
          <Settings style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* New channel dialog */}
      <Dialog open={!!managingChannel} onOpenChange={open => { if (!open) setManagingChannel(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage #{managingChannel?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Choose which active workspace members can see and use this private channel.</p>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {loadingChannelMembers ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Loading members…</p>
            ) : channelMembersError ? (
              <p className="py-4 text-center text-sm text-destructive">Unable to load channel members. Close and reopen this dialog to retry.</p>
            ) : activeMembers.map(member => {
              const isOwnerMember = member.email === workspace?.owner_email;
              return (
                <label key={member.email} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={isOwnerMember || selectedChannelMembers.includes(member.email)}
                    disabled={isOwnerMember}
                    onChange={event => setSelectedChannelMembers(current =>
                      event.target.checked
                        ? [...new Set([...current, member.email])]
                        : current.filter(email => email !== member.email)
                    )}
                  />
                  <span className="text-sm">{member.name || member.full_name || member.email}</span>
                  {isOwnerMember && <span className="ml-auto text-xs text-muted-foreground">Owner</span>}
                </label>
              );
            })}
          </div>
          <button
            onClick={handleSaveChannelMembers}
            disabled={loadingChannelMembers || channelMembersError}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >Save members</button>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewChannel} onOpenChange={setShowNewChannel}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <input
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="channel-name"
              style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.11)', borderRadius: 8, padding: '10px 12px', color: 'inherit', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewChannelType('public')}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: newChannelType === 'public' ? '#1B6EF3' : 'transparent', borderColor: newChannelType === 'public' ? '#1B6EF3' : 'rgba(255,255,255,.15)', color: newChannelType === 'public' ? '#fff' : '#7FA8D4' }}
              ># Public</button>
              <button
                onClick={() => setNewChannelType('private')}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: newChannelType === 'private' ? '#1B6EF3' : 'transparent', borderColor: newChannelType === 'private' ? '#1B6EF3' : 'rgba(255,255,255,.15)', color: newChannelType === 'private' ? '#fff' : '#7FA8D4' }}
              >🔒 Private</button>
            </div>
            <button
              onClick={handleCreateChannel}
              disabled={!newChannelName}
              style={{ width: '100%', padding: '10px', background: '#1B6EF3', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: newChannelName ? 'pointer' : 'not-allowed', opacity: newChannelName ? 1 : 0.5 }}
            >Create Channel</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DM Picker dialog */}
      <Dialog open={showDmPicker} onOpenChange={open => { setShowDmPicker(open); if (!open) setSelectedDmUsers([]); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Direct Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {members.filter(m => m.email !== user?.email && m.status !== 'invited').length === 0 ? (
              <div style={{ textAlign: 'center', color: '#7FA8D4', fontSize: 14, padding: '20px 0' }}>No other active members yet. Invite someone first!</div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: '#7FA8D4', marginBottom: 4 }}>
                  Select one member or multiple members for a group chat:
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {members.filter(m => m.email !== user?.email && m.status !== 'invited').map(m => {
                    const isOnline = onlineEmails.has(m.email);
                    const isSelected = selectedDmUsers.includes(m.email);
                    return (
                      <div
                        key={m.email}
                        onClick={() => {
                          setSelectedDmUsers(prev =>
                            prev.includes(m.email) ? prev.filter(e => e !== m.email) : [...prev, m.email]
                          );
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px',
                          background: isSelected ? 'rgba(27,110,243,.18)' : 'rgba(255,255,255,.04)',
                          border: isSelected ? '1px solid rgba(27,110,243,.4)' : '1px solid rgba(255,255,255,.08)',
                          borderRadius: 8, cursor: 'pointer', transition: '.15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `hsl(${(m.email.charCodeAt(0) * 37) % 360},55%,40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                            {m.email[0].toUpperCase()}
                          </div>
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, background: isOnline ? '#00C853' : '#4B5563', borderRadius: '50%', border: '2px solid #1a1a2e' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{m.email.split('@')[0]}</div>
                          <div style={{ fontSize: 11, color: isOnline ? '#00C853' : '#4B5563' }}>{isOnline ? 'Online' : 'Offline'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  disabled={selectedDmUsers.length === 0}
                  onClick={() => {
                    if (selectedDmUsers.length === 1) {
                      setActiveDm(selectedDmUsers[0]);
                    } else if (selectedDmUsers.length > 1) {
                      setActiveDm([...selectedDmUsers, user?.email].sort().join(','));
                    }
                    setActiveChannelId(null);
                    setShowDmPicker(false);
                    setSelectedDmUsers([]);
                  }}
                  style={{
                    width: '100%', padding: '9px', marginTop: 10,
                    background: '#1B6EF3', border: 'none', borderRadius: 8,
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: selectedDmUsers.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: selectedDmUsers.length > 0 ? 1 : 0.45,
                  }}
                >
                  {selectedDmUsers.length <= 1 ? 'Start Conversation' : `Start Group Message (${selectedDmUsers.length} members)`}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}