import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, socket } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import MessageArea from '../components/workspace/MessageArea';
import B2BInviteModal from '../components/workspace/B2BInviteModal';
import B2BAccessDialog from '../components/workspace/B2BAccessDialog';
import WorkspaceSearchModal from '../components/workspace/WorkspaceSearchModal';
import StatusModal from '../components/workspace/StatusModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Building2, Loader2, LogIn, CheckCircle2 } from 'lucide-react';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { toast } from 'sonner';
import { sendWorkspaceInviteEmail, sendB2BInviteEmail } from '@/hooks/email';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSubscription } from '@/hooks/useSubscription';

const parseMembers = (workspace, fallbackEmail) => {
  if (Array.isArray(workspace?.members)) return workspace.members;
  if (typeof workspace?.members === 'string') {
    try {
      const parsed = JSON.parse(workspace.members);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return fallbackEmail ? [{ email: fallbackEmail, role: 'owner', status: 'active' }] : [];
};

export default function Workspace() {
  const navigate = useNavigate();
  const { user, navigateToLogin } = useAuth();
  const {
    hasWorkspaceAccess,
    isLoading: loadingSubscription,
    isError: subscriptionError,
    workspaceCount,
    maxWorkspaces,
  } = useSubscription(Boolean(user));
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [activeDm, setActiveDm] = useState(null);
  const [showB2B, setShowB2B] = useState(false);
  const [respondingB2BInvite, setRespondingB2BInvite] = useState(null);
  const [managingB2BAccess, setManagingB2BAccess] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsEco, setNewWsEco] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [showCreateWorkspaceForm, setShowCreateWorkspaceForm] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    enabled: !!user?.email && hasWorkspaceAccess,
  });

  useEffect(() => {
    if (allWorkspaces.length && !allWorkspaces.some(item => item.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(allWorkspaces[0].id);
    }
  }, [allWorkspaces, selectedWorkspaceId]);

  const workspace = allWorkspaces.find(item => item.id === selectedWorkspaceId) || allWorkspaces[0];
  const members = parseMembers(workspace, user?.email);
  const userProfiles = useUserProfiles([...members.map(member => member.email), user?.email]);
  const isOwner = workspace?.owner_email?.toLowerCase() === user?.email?.toLowerCase();
  const currentMembership = members.find(member => member.email?.toLowerCase() === user?.email?.toLowerCase());
  const isSubAdmin = !isOwner && currentMembership?.role === 'subadmin' &&
    !['invited', 'removed', 'deactivated', 'inactive'].includes(currentMembership.status);
  const canManageMembers = isOwner || isSubAdmin;

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

    const handleWsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    };
    const handleChUpdate = () => queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
    const handleB2bUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['b2bSpaces', workspace.id] });
      queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
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
    if (!isMobile && channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId, isMobile]);

  useEffect(() => {
    if (activeChannelId && !channels.some(channel => channel.id === activeChannelId)) {
      setActiveChannelId(null);
    }
  }, [channels, activeChannelId]);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const handleCreateWorkspace = async () => {
    if (!newWsName || !newWsEco) return;
    setCreatingWorkspace(true);

    try {
      const createdWorkspace = await api.post('/workspaces', {
        name: newWsName,
        ecosystem: newWsEco,
        member_count: 1,
        plan: 'free',
        members: [{ email: user?.email, role: 'owner', status: 'active' }],
      });
      if (createdWorkspace?.id) {
        queryClient.setQueryData(['workspaces', user?.email], current => [
          ...(current || []).filter(item => item.id !== createdWorkspace.id),
          createdWorkspace,
        ]);
        setSelectedWorkspaceId(createdWorkspace.id);
      }
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      setShowCreateWorkspaceForm(false);
      setCreatingWorkspace(false);
      setNewWsName('');
      setNewWsEco('');
    } catch (error) {
      toast.error(error.message || 'Failed to create workspace');
      setCreatingWorkspace(false);
    }
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!window.confirm(`Remove ${memberEmail} from the workspace?`)) return;
    try {
      await api.delete(`/workspaces/${workspace.id}/members/${encodeURIComponent(memberEmail)}`);
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      toast.success(`${memberEmail} removed from workspace`);
    } catch (error) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  const handleMemberRoleChange = async (memberEmail, role) => {
    const updatedMembers = members.map(member =>
      member.email?.toLowerCase() === memberEmail.toLowerCase() ? { ...member, role } : member
    );
    try {
      await api.put(`/workspaces/${workspace.id}/members`, { members: updatedMembers });
      queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      toast.success(`${memberEmail} is now ${role === 'subadmin' ? 'a sub-admin' : 'a member'}`);
    } catch (error) {
      toast.error(error.message || 'Failed to update member role');
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

  const handleDeleteB2BInvite = async (space) => {
    if (!window.confirm(`Delete the pending invitation to ${space.company_name}?`)) return;
    try {
      await api.delete(`/b2b/${space.id}`);
      queryClient.invalidateQueries({ queryKey: ['b2bSpaces', workspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests'] });
      toast.success(`Pending invitation to ${space.company_name} deleted`);
    } catch (error) {
      toast.error(error.message || 'Failed to delete B2B invitation');
    }
  };

  const handleEndB2BPartnership = async (space) => {
    if (!window.confirm(`End the B2B partnership with ${space.company_name}? Shared channel access will be revoked.`)) return;
    try {
      await api.put(`/b2b/${space.id}/end`, {});
      queryClient.invalidateQueries({ queryKey: ['b2bSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests'] });
      toast.success(`B2B partnership with ${space.company_name} ended`);
    } catch (error) {
      let message = error.message || 'Failed to end B2B partnership';
      try { message = JSON.parse(message).error || message; } catch {}
      toast.error(message);
    }
  };

  const handleAcceptB2BInvite = space => setRespondingB2BInvite(space);

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
          <p className="text-sm text-muted-foreground mb-6">Sign in or create a free account to join the community. Private workspace access is included with Pro.</p>
          <Button className="w-full gap-2" onClick={() => navigateToLogin()}>
            <LogIn className="w-4 h-4" /> Sign In / Join Free
          </Button>
        </Card>
      </div>
    );
  }

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-2">Could not verify workspace access</h2>
          <p className="text-sm text-muted-foreground">Please refresh and try again.</p>
        </Card>
      </div>
    );
  }

  if (!hasWorkspaceAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Private workspaces are a Pro feature</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your Free plan includes unlimited GP Feed posting, browsing, comments, and a public profile. Upgrade to Pro to create or join private workspaces.
          </p>
          <Button className="w-full" onClick={() => navigate('/pricing')}>
            View Pro plans
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
            <p className="text-sm text-muted-foreground mb-4">Create a workspace first, then return here to choose which of your members can access shared channels.</p>
            <div className="space-y-3">
              {incomingB2BRequests.map(space => (
                <div key={space.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="font-semibold text-sm truncate">{space.company_name}</div>
                    <div className="text-xs text-muted-foreground truncate">Role: {space.relationship_type || 'Partner'}</div>
                  </div>
                  <Button size="sm" disabled className="shrink-0">
                    Create workspace first
                  </Button>
                </div>
              ))}
            </div>
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

  const initGrad = [
    'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
    'linear-gradient(135deg,#1B6EF3,#00B4D8)',
    'linear-gradient(135deg,#00C853,#00897B)',
    'linear-gradient(135deg,#FF8F00,#FF6D00)',
    'linear-gradient(135deg,#EF5350,#E53935)',
    'linear-gradient(135deg,#7C4DFF,#F472B6)',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

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

      {(allWorkspaces.length > 1 ||
        (workspace.owner_email?.toLowerCase() === user?.email?.toLowerCase() && workspaceCount < maxWorkspaces)) && (
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {allWorkspaces.length > 1 && (
            <Select value={workspace.id} onValueChange={id => {
              setSelectedWorkspaceId(id);
              setActiveChannelId(null);
              setActiveDm(null);
            }}>
              <SelectTrigger aria-label="Select workspace" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allWorkspaces.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {workspace.owner_email?.toLowerCase() === user?.email?.toLowerCase() &&
            workspaceCount < maxWorkspaces && (
              <Button size="sm" onClick={() => setShowCreateWorkspaceForm(value => !value)}>
                {showCreateWorkspaceForm ? 'Cancel' : 'New workspace'}
              </Button>
            )}
        </div>
      )}
      {showCreateWorkspaceForm && (
          <Card className="mx-3 my-2 w-80 space-y-3 p-4">
            <h2 className="font-semibold">Create another workspace</h2>
            <Input value={newWsName} onChange={event => setNewWsName(event.target.value)} placeholder="Workspace name" />
            <Select value={newWsEco} onValueChange={setNewWsEco}>
              <SelectTrigger><SelectValue placeholder="Choose ecosystem" /></SelectTrigger>
              <SelectContent>
                {ECOSYSTEMS.map(item => {
                  const EcoIcon = item.icon;
                  return <SelectItem key={item.id} value={item.id}><span className="flex items-center gap-2"><EcoIcon size={14} />{item.label}</span></SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleCreateWorkspace} disabled={!newWsName || !newWsEco || creatingWorkspace}>
              {creatingWorkspace ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create workspace
            </Button>
          </Card>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: isMobile ? '100%' : 224, flexShrink: 0, display: isMobile && (activeChannelId || activeDm) ? 'none' : 'block' }}>
          <WorkspaceSidebar
            workspace={workspace}
            userProfiles={userProfiles}
            channels={channels}
            activeChannelId={activeChannelId}
            setActiveChannelId={setActiveChannelId}
            activeDm={activeDm}
            setActiveDm={setActiveDm}
            b2bSpaces={b2bSpaces}
            onB2BClick={() => setShowB2B(true)}
            onResendB2BInvite={handleResendB2BInvite}
            onDeleteB2BInvite={handleDeleteB2BInvite}
            onManageB2BAccess={setManagingB2BAccess}
            onEndB2BPartnership={handleEndB2BPartnership}
            user={user}
            onOpenSearch={() => setSearchModalOpen(true)}
            onOpenStatus={() => setStatusModalOpen(true)}
          />
        </div>
        <MessageArea
          channelId={activeChannelId}
          channelName={activeChannel?.name || ''}
          activeDm={activeDm}
          workspaceId={activeChannel?.workspace_id || workspace.id}
          user={user}
          members={members}
          isMobile={isMobile}
          onBack={() => { setActiveChannelId(null); setActiveDm(null); }}
        />

        {/* Directory panel */}
        <div style={{ width: 220, flexShrink: 0, background: '#0B1628', borderLeft: '1px solid rgba(255,255,255,.07)', display: isMobile ? 'none' : 'flex', flexDirection: 'column', overflowY: 'auto' }}>
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
              const isWorkspaceAdmin = m.email?.toLowerCase() === workspace?.owner_email?.toLowerCase();
              const isSubAdminMember = m.role === 'subadmin';
              const roleBadgeColor = isWorkspaceAdmin ? '#7C4DFF' : isSubAdminMember ? '#00B4D8' : m.status === 'invited' ? '#FF8F00' : '#1B6EF3';
              const roleLabel = isWorkspaceAdmin ? 'Admin' : m.status === 'invited' ? 'Invited' : isSubAdminMember ? 'Sub-admin' : 'Member';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px', cursor: 'default', borderRadius: 8, margin: '0 4px', transition: '.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.04)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/user-profile?userId=${encodeURIComponent(m.email)}`)}
                    title={`View ${m.email}'s profile`}
                    disabled={m.status === 'invited'}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1, padding: 0, border: 'none', background: 'transparent', textAlign: 'left', cursor: m.status === 'invited' ? 'default' : 'pointer' }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar className="h-7 w-7 rounded-[7px]">
                        <AvatarImage src={userProfiles[m.email]?.avatar_url || undefined} alt={m.email} className="object-cover" />
                        <AvatarFallback style={{ background: initGrad[i % initGrad.length], color: '#fff', fontSize: 10, fontWeight: 800 }}>{initials}</AvatarFallback>
                      </Avatar>
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: m.status === 'active' ? '#00C853' : '#4B5563', border: '1.5px solid #0B1628', boxShadow: m.status === 'active' ? '0 0 4px #00C853' : 'none' }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#EEF4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.email?.split('@')[0]}{isYou ? ' (you)' : ''}
                      </div>
                      <div style={{ fontSize: 10, color: roleBadgeColor, fontWeight: 700, textTransform: 'capitalize' }}>{roleLabel}</div>
                    </div>
                  </button>
                  {isOwner && !isYou && m.status !== 'invited' && (
                    <select
                      value={isSubAdminMember ? 'subadmin' : 'member'}
                      onChange={event => handleMemberRoleChange(m.email, event.target.value)}
                      aria-label={`Role for ${m.email}`}
                      title="Change member role"
                      style={{ maxWidth: 82, background: '#111E33', border: '1px solid rgba(255,255,255,.15)', borderRadius: 5, color: '#AFC7E3', fontSize: 10, padding: '4px 2px' }}
                    >
                      <option value="member">Member</option>
                      <option value="subadmin">Sub-admin</option>
                    </select>
                  )}
                  {canManageMembers && !isYou && (isOwner || !isSubAdminMember) && (
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
          {canManageMembers && (
            <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
              {showInvite ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: '#8BADD4' }}>
                    Seats: {workspace.seats_used ?? members.filter(member =>
                    !['invited', 'removed', 'deactivated', 'inactive'].includes(member.status)
                  ).length} / {workspace.seat_limit ?? 1} · Invites use a seat only after acceptance
                  </div>
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
                          const invitation = await api.post(`/workspaces/${workspace.id}/invites`, { email: inviteEmail });
                          const success = await sendWorkspaceInviteEmail(
                            invitation.email,
                            user?.full_name,
                            workspace.name,
                            invitation.token
                          );

                          if (!success) {
                            throw new Error('Failed to send invite email');
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
        <B2BAccessDialog
          space={respondingB2BInvite}
          mode="accept"
          onClose={() => setRespondingB2BInvite(null)}
        />
        <B2BAccessDialog
          space={managingB2BAccess}
          mode="manage"
          onClose={() => setManagingB2BAccess(null)}
        />
        <WorkspaceSearchModal
          open={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          workspaceId={workspace.id}
          channels={channels}
          onSelectChannel={(chId) => { setActiveChannelId(chId); setActiveDm(null); }}
          onSelectDm={(dmEmail) => { setActiveDm(dmEmail); setActiveChannelId(null); }}
        />
        <StatusModal
          open={statusModalOpen}
          onClose={() => setStatusModalOpen(false)}
          user={user}
          onStatusUpdated={() => queryClient.invalidateQueries({ queryKey: ['userProfiles'] })}
        />
      </div>
    </div>
  );
}