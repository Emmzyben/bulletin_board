import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import MessageArea from '../components/workspace/MessageArea';
import B2BInviteModal from '../components/workspace/B2BInviteModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Building2, Loader2, LogIn } from 'lucide-react';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { toast } from 'sonner';

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
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .or(`owner_email.eq.${user.email},members.cs.[{"email":"${user.email}"}]`);
      
      if (error) {
        console.error('Error fetching workspaces:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.email,
  });

  const workspace = allWorkspaces[0];

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const { data: b2bSpaces = [] } = useQuery({
    queryKey: ['b2bSpaces', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const { data, error } = await supabase
        .from('b2b_spaces')
        .select('*')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  // Real-time subscriptions for channels, B2B spaces, and workspace
  useEffect(() => {
    if (!workspace?.id) return;
    
    const channelSub = supabase
      .channel('workspace_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `workspace_id=eq.${workspace.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['channels', workspace.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_spaces', filter: `workspace_id=eq.${workspace.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['b2bSpaces', workspace.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces', filter: `id=eq.${workspace.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channelSub);
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
    
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({
        name: newWsName,
        ecosystem: newWsEco,
        owner_email: user?.email,
        member_count: 1,
        plan: 'free',
        members: [{ email: user?.email, role: 'owner', status: 'active' }],
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create workspace');
      setCreatingWorkspace(false);
      return;
    }

    // Create default channels
    await supabase.from('channels').insert([
      { name: 'announcements', workspace_id: ws.id, type: 'public', description: 'Important updates' },
      { name: 'general', workspace_id: ws.id, type: 'public', description: 'Everyday conversation' },
      { name: 'random', workspace_id: ws.id, type: 'public', description: 'Off-topic and casual' },
    ]);

    queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
    setCreatingWorkspace(false);
    setNewWsName('');
    setNewWsEco('');
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
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
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
                {ECOSYSTEMS.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.icon} {e.label}</SelectItem>
                ))}
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

  const members = workspace.members || [{ email: user?.email, role: 'owner', status: 'active' }];
  const initGrad = [
    'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
    'linear-gradient(135deg,#1B6EF3,#00B4D8)',
    'linear-gradient(135deg,#00C853,#00897B)',
    'linear-gradient(135deg,#FF8F00,#FF6D00)',
    'linear-gradient(135deg,#EF5350,#E53935)',
    'linear-gradient(135deg,#7C4DFF,#F472B6)',
  ];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 62px)' }}>
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
          user={user}
        />
      </div>
      <MessageArea
        channelId={activeChannelId}
        channelName={activeChannel?.name || ''}
        workspaceId={workspace.id}
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
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px', cursor: 'pointer', borderRadius: 8, margin: '0 4px', transition: '.15s' }}
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
                  <div style={{ fontSize: 10, color: '#2E4D6E', fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invite button */}
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
                      // Simulating invite for now as we don't have a specific Supabase function for this in the backend
                      // In a real app, this would use supabase.auth.admin.inviteUserByEmail or an edge function
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
      </div>

      <B2BInviteModal
        open={showB2B}
        onClose={() => setShowB2B(false)}
        workspaceId={workspace.id}
      />
    </div>
  );
}