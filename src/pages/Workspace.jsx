import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, socket } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import MessageArea from '../components/workspace/MessageArea';
import B2BInviteModal from '../components/workspace/B2BInviteModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Building2, Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { toast } from 'sonner';
import { sendWorkspaceInviteEmail, sendB2BInviteEmail } from '@/hooks/email';

export default function Workspace() {
  const { user, navigateToLogin } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activeDm, setActiveDm] = useState(null);
  const [showB2B, setShowB2B] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsEco, setNewWsEco] = useState('');

  const { data: allWorkspaces = [], isLoading: loadingWs } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const data = await api.get('/workspaces');
        return data || [];
      } catch (err) {
        console.error('Error fetching workspaces:', err);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const workspace = allWorkspaces[0];

  const { data: b2bSpaces = [] } = useQuery({
    queryKey: ['b2bSpaces', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      try {
        const data = await api.get(`/b2b?workspace_id=${workspace.id}&admin_email=${user.email}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!workspace?.id,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', workspace?.id, b2bSpaces.length],
    queryFn: async () => {
      if (!workspace?.id) return [];

      // Fetch channels for our workspace AND any active B2B partner workspaces
      const workspaceIds = [workspace.id];
      b2bSpaces.forEach(s => {
        if (s.status === 'active' && s.workspace_id) {
          workspaceIds.push(s.workspace_id);
        }
      });

      try {
        const data = await api.get(`/channels?workspace_ids=${workspaceIds.join(',')}`);
        return data.filter(c => c.workspace_id === workspace.id || c.type === 'b2b');
      } catch (err) {
        return [];
      }

      // Keep our own channels PLUS b2b channels from partner workspaces
      return data.filter(c => c.workspace_id === workspace.id || c.type === 'b2b');
    },
    enabled: !!workspace?.id,
  });

  const { data: incomingB2BRequests = [] } = useQuery({
    queryKey: ['incomingB2BRequests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const data = await api.get(`/b2b?admin_email=${user.email}&status=pending`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // Real-time subscriptions for channels, B2B spaces, and workspace
  useEffect(() => {
    if (!workspace?.id) return;

    const handleWsUpdate = () => queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
    const handleChUpdate = () => queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    const handleB2bUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['b2bSpaces', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests', user?.email] });
    };

    socket.on(`workspace_update_${user?.email}`, handleWsUpdate);
    socket.on(`workspace_members_update_${workspace.id}`, handleWsUpdate);
    socket.on(`channel_update_${workspace.id}`, handleChUpdate);
    socket.on(`b2b_update`, handleB2bUpdate);

    return () => {
      socket.off(`workspace_update_${user?.email}`, handleWsUpdate);
      socket.off(`workspace_members_update_${workspace.id}`, handleWsUpdate);
      socket.off(`channel_update_${workspace.id}`, handleChUpdate);
      socket.off(`b2b_update`, handleB2bUpdate);
    };
  }, [workspace?.id, user?.email, queryClient]);

  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId]);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const handleCreateWorkspace = async () => {
    if (!newWsName || !newWsEco) return;
    setCreatingWorkspace(true);

    try {
      await api.post('/workspaces', {
        name: newWsName,
        ecosystem: newWsEco,
        owner_email: user?.email,
        member_count: 1,
        plan: 'free',
        members: [{ email: user?.email, role: 'owner', status: 'active' }],
      });
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      setCreatingWorkspace(false);
      setNewWsName('');
      setNewWsEco('');
    } catch (error) {
      if (error.response?.status === 409 || error.message?.includes('conflict')) {
        toast.error('You already have a workspace. You can only own one workspace at a time.');
      } else {
        toast.error('Failed to create workspace: ' + (error.message || 'Unknown error'));
      }
      setCreatingWorkspace(false);
    }
  };

  const isOwner = workspace?.owner_email === user?.email;

  const handleRemoveMember = async (memberEmail) => {
    if (!window.confirm(`Remove ${memberEmail} from the workspace?`)) return;
    const rawMbrs = workspace.members;
    const currentMembers = Array.isArray(rawMbrs) ? rawMbrs : (typeof rawMbrs === 'string' ? JSON.parse(rawMbrs) : []);

    const newMembers = currentMembers.filter(m => m.email !== memberEmail);
    try {
      await api.put(`/workspaces/${workspace.id}/members`, { members: newMembers });
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      toast.success(`${memberEmail} removed from workspace`);
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleResendB2BInvite = async (space) => {
    try {
      const success = await sendB2BInviteEmail(space.admin_email, user?.full_name, workspace.name);
      if (success) {
        toast.success(`Invite resent to ${space.company_name}`);
      } else {
        toast.error('Failed to resend invite');
      }
    } catch (e) {
      toast.error('Failed to resend invite');
    }
  };

  const handleAcceptB2BInvite = async (space) => {
    try {
      await api.put(`/b2b/${space.id}/status`, { status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests'] });
      queryClient.invalidateQueries({ queryKey: ['b2bSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Invite accepted! You now have access to the shared channels.');
    } catch (error) {
      toast.error('Failed to accept invite');
    }
  };

  if (loadingWs) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Card className="p-8 max-w-md w-full text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Members Only</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in or create a free account to access your workspace and collaborate with your team.</p>
          <Button className="w-full gap-2" onClick={() => navigateToLogin()}>
            <LogIn className="w-4 h-4" /> Sign In / Join Free
          </Button>
        </Card>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-6 overflow-y-auto py-10">

        {incomingB2BRequests.length > 0 && (
          <Card className="p-6 max-w-md w-full border-[#00B4D8] bg-[#00B4D8]/10 shadow-[0_0_20px_rgba(0,180,216,0.15)]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#00B4D8]">
              <Building2 className="w-5 h-5" /> Pending B2B Invitations
            </h2>
            <p className="text-sm text-muted-foreground mb-4">You have been invited to collaborate. Accept to join their shared channels.</p>
            <div className="space-y-3">
              {incomingB2BRequests.map(space => (
                <div key={space.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="font-semibold text-sm truncate">{space.company_name}</div>
                    <div className="text-xs text-muted-foreground truncate">Role: {space.relationship_type || 'Partner'}</div>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptB2BInvite(space)} className="bg-[#00B4D8] hover:bg-[#00B4D8]/90 text-white shrink-0">
                    Accept
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 opacity-70">
              💡 You can accept a B2B invite <strong>or</strong> create your own workspace below — or both!
            </p>
          </Card>
        )}

        <Card className="p-8 max-w-md w-full text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Create Your Workspace</h2>
          <p className="text-sm text-muted-foreground mb-6">Set up a private workspace for your team to communicate and collaborate.</p>
          <div className="space-y-3">
            <Input
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              placeholder="Workspace name"
            />
            <Select value={newWsEco} onValueChange={setNewWsEco}>
              <SelectTrigger><SelectValue placeholder="Choose ecosystem" /></SelectTrigger>
              <SelectContent>
                {ECOSYSTEMS.map(e => {
                  const EcoIcon = e.icon;
                  return (
                    <SelectItem key={e.id} value={e.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EcoIcon size={14} />
                        {e.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWsName || !newWsEco || creatingWorkspace}
              className="w-full"
            >
              {creatingWorkspace ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Workspace
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const rawMembers = workspace.members;
  const members = Array.isArray(rawMembers)
    ? rawMembers
    : typeof rawMembers === 'string'
      ? (() => { try { return JSON.parse(rawMembers); } catch { return []; } })()
      : [{ email: user?.email, role: 'owner', status: 'active' }];

  const initGrad = [
    'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
    'linear-gradient(135deg,#1B6EF3,#00B4D8)',
    'linear-gradient(135deg,#00C853,#00897B)',
    'linear-gradient(135deg,#FF8F00,#FF6D00)',
    'linear-gradient(135deg,#EF5350,#E53935)',
    'linear-gradient(135deg,#7C4DFF,#F472B6)',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 62px)' }}>

      {/* Top Banner for Incoming B2B Requests */}
      {incomingB2BRequests.length > 0 && (
        <div style={{ background: 'linear-gradient(90deg, rgba(0,180,216,0.15), rgba(27,110,243,0.15))', borderBottom: '1px solid rgba(0,180,216,0.3)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} color="#00B4D8" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>
              You have {incomingB2BRequests.length} pending B2B invitation{incomingB2BRequests.length !== 1 ? 's' : ''}.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {incomingB2BRequests.map(space => (
              <button
                key={space.id}
                onClick={() => handleAcceptB2BInvite(space)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#00B4D8', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,180,216,0.3)' }}
              >
                <CheckCircle2 size={14} /> Accept {space.company_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: 224, flexShrink: 0 }}>
          <WorkspaceSidebar
            workspace={workspace}
            channels={channels}
            activeChannelId={activeChannelId}
            setActiveChannelId={setActiveChannelId}
            activeDm={activeDm}
            setActiveDm={setActiveDm}
            b2bSpaces={b2bSpaces}
            onB2BClick={() => setShowB2B(true)}
            onResendB2BInvite={handleResendB2BInvite}
            user={user}
          />
        </div>
        <MessageArea
          channelId={activeChannelId}
          channelName={activeChannel?.name || ''}
          activeDm={activeDm}
          workspaceId={activeChannel?.workspace_id || workspace.id}
          user={user}
        />

        {/* Directory panel */}
        <div style={{ width: 220, flexShrink: 0, background: '#0B1628', borderLeft: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.55)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8 }}>Directory</div>
            <div style={{ fontSize: 12, color: '#6B93C4' }}>
              <span style={{ color: '#00C853', marginRight: 5 }}>●</span>
              {members.filter(m => m.status === 'active').length} online · {members.length} total
            </div>
          </div>

          {/* Members */}
          <div style={{ flex: 1, padding: '8px 0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(150,190,240,.4)', textTransform: 'uppercase', letterSpacing: '.7px', padding: '6px 16px 4px' }}>Members</div>
            {members.map((m, i) => {
              const initials = m.email ? m.email.slice(0, 2).toUpperCase() : '??';
              const isYou = m.email === user?.email;
              const roleBadgeColor = m.role === 'owner' ? '#7C4DFF' : m.status === 'invited' ? '#FF8F00' : '#1B6EF3';
              const roleLabel = m.role === 'owner' ? 'Owner' : m.status === 'invited' ? 'Invited' : 'Member';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px', cursor: 'default', borderRadius: 8, margin: '0 4px', transition: '.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: initGrad[i % initGrad.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                      {initials}
                    </div>
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: m.status === 'active' ? '#00C853' : '#4B5563', border: '1.5px solid #0B1628', boxShadow: m.status === 'active' ? '0 0 4px #00C853' : 'none' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.email?.split('@')[0]}{isYou ? ' (you)' : ''}
                    </div>
                    <div style={{ fontSize: 10, color: roleBadgeColor, fontWeight: 700, textTransform: 'capitalize' }}>{roleLabel}</div>
                  </div>
                  {/* Remove button — owner only, not for self */}
                  {isOwner && !isYou && (
                    <button
                      onClick={() => handleRemoveMember(m.email)}
                      title="Remove member"
                      style={{ padding: '2px 6px', background: 'rgba(239,83,80,.1)', border: '1px solid rgba(239,83,80,.2)', borderRadius: 4, color: '#EF5350', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,83,80,.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(239,83,80,.1)'}
                    >✕</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Invite button — owner only */}
          {isOwner && (
            <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
              {showInvite ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    autoFocus
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteMsg(''); }}
                    placeholder="Email address"
                    type="email"
                    style={{ width: '100%', background: '#111E33', border: '1px solid rgba(255,255,255,.15)', borderRadius: 7, padding: '7px 10px', color: '#EEF4FF', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                  />
                  {inviteMsg && <div style={{ fontSize: 11, color: inviteMsg.includes('Sent') ? '#00C853' : '#EF5350' }}>{inviteMsg}</div>}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      disabled={inviting || !inviteEmail.includes('@')}
                      onClick={async () => {
                        setInviting(true);
                        try {
                          // Send the real email via our PHP backend
                          const success = await sendWorkspaceInviteEmail(inviteEmail, user?.full_name, workspace.name);

                          if (!success) {
                            throw new Error('Failed to send invite email');
                          }

                          if (!members.find(m => m.email === inviteEmail)) {
                            const newMembers = [...members, { email: inviteEmail, role: 'member', status: 'invited' }];
                            await api.put(`/workspaces/${workspace.id}/members`, { members: newMembers });
                          }

                          setInviteMsg('✅ Invite sent!');
                          setInviteEmail('');
                          setTimeout(() => { setShowInvite(false); setInviteMsg(''); }, 1500);
                        } catch (e) {
                          setInviteMsg('❌ ' + (e.message || 'Failed to send invite'));
                        } finally {
                          setInviting(false);
                        }
                      }}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', background: '#1B6EF3', color: '#fff', fontSize: 12, fontWeight: 700, cursor: inviting ? 'not-allowed' : 'pointer', opacity: inviting ? 0.6 : 1 }}
                    >
                      {inviting ? 'Sending…' : 'Send Invite'}
                    </button>
                    <button
                      onClick={() => { setShowInvite(false); setInviteEmail(''); setInviteMsg(''); }}
                      style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#6B93C4', fontSize: 12, cursor: 'pointer' }}
                    >✕</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowInvite(true)}
                  style={{ width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid rgba(27,110,243,.3)', background: 'rgba(27,110,243,.1)', color: '#6AADFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  + Invite Member
                </button>
              )}
            </div>
          )}
        </div>

        <B2BInviteModal
          open={showB2B}
          onClose={() => setShowB2B(false)}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          inviterName={user?.full_name}
        />
      </div>
    </div>
  );
}