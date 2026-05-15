import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement({ workspace }) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['workspace-users', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      // Assuming a simplified schema where users table has a workspace_id or there's a join
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('workspace_id', workspace.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const handleInviteUser = async () => {
    if (!inviteEmail || !workspace) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-to-workspace', {
        body: { email: inviteEmail, role: inviteRole, workspaceId: workspace.id }
      });
      
      if (error) throw error;

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('user');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['workspace-users', workspace.id] });
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error(error.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['workspace-users', workspace.id] });
      toast.success('Role updated');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: 'deactivated' })
          .eq('id', userId);
          
        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['workspace-users', workspace.id] });
        toast.success('User deactivated');
      } catch (error) {
        console.error('Failed to deactivate user:', error);
        toast.error('Failed to deactivate user');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF' }}>Users & Permissions</h3>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: '#1B6EF3', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
          }}
        >
          + Invite User
        </button>
      </div>

      {/* Users table */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.02)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#7FA8D4' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#7FA8D4' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#7FA8D4' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#7FA8D4' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#EEF4FF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <User style={{ width: 16, height: 16, color: '#6B93C4' }} />
                      {u.full_name || u.email?.split('@')[0]}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={u.role || 'user'}
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, background: '#0B1628',
                        border: '1px solid rgba(255,255,255,.15)', color: '#EEF4FF', fontSize: 12,
                        cursor: 'pointer', outline: 'none'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="support_admin">Support</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: 20,
                      background: u.role === 'deactivated' ? 'rgba(239,83,80,.15)' : 'rgba(0,200,83,.15)',
                      color: u.role === 'deactivated' ? '#EF5350' : '#00C853',
                      fontWeight: 600,
                    }}>
                      {u.role === 'deactivated' ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeactivateUser(u.id)}
                      style={{
                        background: 'none', border: 'none', color: '#EF5350', cursor: 'pointer',
                        padding: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, transition: '.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,83,80,.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>No users in this workspace.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#0E1828', border: '1px solid rgba(255,255,255,.11)', borderRadius: 14,
            padding: '24px', maxWidth: 400, width: '90%', boxShadow: '0 20px 50px rgba(0,0,0,.5)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF', marginBottom: 16 }}>Invite to Workspace</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.15)', color: '#EEF4FF', fontSize: 13, outline: 'none'
                }}
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, background: '#0E1828',
                  border: '1px solid rgba(255,255,255,.15)', color: '#EEF4FF', fontSize: 13, cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="user">User Access</option>
                <option value="admin">Admin Access</option>
              </select>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => setShowInvite(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.15)',
                    background: 'transparent', color: '#7FA8D4', cursor: 'pointer', fontWeight: 600, fontSize: 13
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteUser}
                  disabled={!inviteEmail || inviting}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    background: '#1B6EF3', color: '#fff', cursor: 'pointer', fontWeight: 700,
                    fontSize: 13, opacity: (!inviteEmail || inviting) ? 0.5 : 1
                  }}
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}