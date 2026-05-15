import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hash, Lock, Plus, Globe, ChevronDown, Settings, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getEcosystem } from '@/lib/ecosystems';
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';

export default function WorkspaceSidebar({
  workspace, channels = [], activeChannelId, setActiveChannelId,
  activeDm, setActiveDm, b2bSpaces = [], onB2BClick
}) {
  const { user } = useAuth();
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState('public');
  const [openB2B, setOpenB2B] = useState(null);
  const queryClient = useQueryClient();
  const eco = workspace ? getEcosystem(workspace.ecosystem) : null;

  const handleCreateChannel = async () => {
    if (!newChannelName || !workspace) return;
    const { error } = await supabase
      .from('channels')
      .insert({
        name: newChannelName,
        workspace_id: workspace.id,
        type: newChannelType,
      });
    
    if (error) {
      console.error('Error creating channel:', error);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    setShowNewChannel(false);
    setNewChannelName('');
  };

  // Real-time subscription for channel updates
  useEffect(() => {
    if (!workspace?.id) return;
    const channelSub = supabase
      .channel(`sidebar_${workspace.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `workspace_id=eq.${workspace.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [workspace?.id, queryClient]);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const { onlineMembers } = usePresence({ user, workspaceId: workspace?.id, channelId: activeChannelId });
  const onlineEmails = new Set(onlineMembers.map(m => m.user_email));
  const onlineCount = onlineMembers.length;

  const groupedChannels = {
    announcements: channels.filter(c => c.name?.includes('announcement')),
    general: channels.filter(c => ['general', 'random', 'hiring'].includes(c.name)),
    other: channels.filter(c =>
      !c.name?.includes('announcement') &&
      !['general', 'random', 'hiring'].includes(c.name)
    ),
  };

  const allRegularChannels = channels;

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
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6AADFF', marginBottom: 4 }}>
            {eco.icon} {eco.label}
          </div>
        )}
        <div style={{ fontSize: 12, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, background: '#00C853', borderRadius: '50%', boxShadow: '0 0 5px #00C853', flexShrink: 0, display: 'inline-block' }} />
          {onlineCount} member{onlineCount !== 1 ? 's' : ''} online
        </div>
      </div>

      {/* New Post button */}
      <button
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          margin: '10px 12px 4px', padding: '9px 14px',
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
          <button
            onClick={() => setShowNewChannel(true)}
            style={{ fontSize: 17, color: '#6B93C4', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: 'none', background: 'none', cursor: 'pointer' }}
          >+</button>
        </div>

        {allRegularChannels.map(ch => (
          <button
            key={ch.id}
            onClick={() => { setActiveChannelId(ch.id); setActiveDm(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 16px', cursor: 'pointer',
              fontSize: 14, fontWeight: activeChannelId === ch.id && !activeDm ? 600 : 500,
              color: activeChannelId === ch.id && !activeDm ? '#EEF4FF' : '#7FA8D4',
              background: activeChannelId === ch.id && !activeDm ? 'rgba(27,110,243,.14)' : 'transparent',
              border: 'none', width: '100%', textAlign: 'left',
              position: 'relative', transition: '.15s',
            }}
          >
            {activeChannelId === ch.id && !activeDm && (
              <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#1B6EF3', borderRadius: '0 3px 3px 0' }} />
            )}
            <span style={{ fontSize: 14, color: '#6B93C4', width: 16, flexShrink: 0, textAlign: 'center' }}>
              {ch.type === 'private' ? '🔒' : '#'}
            </span>
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</span>
          </button>
        ))}

        {/* B2B Spaces */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
          <span>External · B2B</span>
          <button
            onClick={onB2BClick}
            style={{ fontSize: 11, fontWeight: 700, color: '#00B4D8', background: 'rgba(0,180,216,.1)', border: '1px solid rgba(0,180,216,.25)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}
          >+ Invite</button>
        </div>

        {b2bSpaces.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(150,190,240,.4)', padding: '4px 16px 8px' }}>No B2B spaces yet</div>
        ) : (
          b2bSpaces.map(space => {
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
                {isOpen && space.shared_channels?.map((chName, i) => (
                  <button key={i} style={{
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

        {/* Direct Messages — show online workspace members */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 5px', fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
          <span>Team · Online</span>
        </div>
        {onlineMembers.length === 0 ? (
          <div style={{ fontSize: 12, color: 'rgba(150,190,240,.35)', padding: '2px 16px 8px' }}>No one else online</div>
        ) : (
          onlineMembers.filter(m => m.user_email !== user?.email).map(m => (
            <div key={m.user_email} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 16px' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: `hsl(${(m.user_email.charCodeAt(0) * 37) % 360},55%,40%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: '#fff',
                }}>
                  {(m.user_name || m.user_email)[0].toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, background: m.status === 'away' ? '#FF8F00' : '#00C853', borderRadius: '50%', border: '2px solid #0B1628' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7FA8D4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.user_name || m.user_email.split('@')[0]}
                </div>
              </div>
              <div style={{ fontSize: 10, color: m.status === 'away' ? '#FF8F00' : '#00C853', fontWeight: 700 }}>
                {m.status === 'away' ? 'Away' : 'Online'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* User status bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff',
          }}>{initials}</div>
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, background: '#00C853', borderRadius: '50%', border: '2px solid #0B1628', boxShadow: '0 0 5px #00C853' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name || 'You'}</div>
          <div style={{ fontSize: 11, color: '#00C853' }}>● Online</div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7FA8D4', padding: 4 }}>
          <Settings style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* New channel dialog */}
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
    </div>
  );
}