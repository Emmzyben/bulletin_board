import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, UserPlus } from 'lucide-react';

const S = {
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
};

const initGrad = [
  'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
  'linear-gradient(135deg,#1B6EF3,#00B4D8)',
  'linear-gradient(135deg,#00C853,#00897B)',
  'linear-gradient(135deg,#FF8F00,#FF6D00)',
  'linear-gradient(135deg,#EF5350,#E53935)',
  'linear-gradient(135deg,#7C4DFF,#F472B6)',
];

const ADMIN_ROLES = [
  { value: 'user', label: 'Member', desc: 'Standard access' },
  { value: 'support_admin', label: 'Support Admin', desc: 'Handles user issues' },
  { value: 'billing_admin', label: 'Billing Admin', desc: 'Manages payments & refunds' },
  { value: 'sales_admin', label: 'Sales Admin', desc: 'Handles upgrades & enterprise deals' },
  { value: 'admin', label: 'Super Admin', desc: 'Full control' },
];

export default function UsersAdminTab({ currentUser }) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    
    try {
      // In a real Supabase setup, you'd use a service role edge function to invite users
      // or use supabase.auth.admin.inviteUserByEmail if you have the right permissions/setup.
      // For now, we'll simulate the invitation process.
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: inviteEmail.trim(), role: inviteRole }
      });

      if (error) throw error;

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('user');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    } catch (error) {
      console.error('Invite failed:', error);
      toast.error(error.message || 'Failed to send invite. Check if the invitation function is deployed.');
    } finally {
      setInviting(false);
    }
  };

  const filtered = users.filter(u =>
    !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role) => ADMIN_ROLES.find(r => r.value === role)?.label || role || 'Member';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#6B93C4' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#EEF4FF', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <button 
          onClick={() => setShowInvite(true)} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(27,110,243,.3)' }}
        >
          <UserPlus style={{ width: 16, height: 16 }} /> Invite User
        </button>
      </div>

      {/* Role legend */}
      <div style={{ ...S.card, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 10 }}>Admin Role Levels</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ADMIN_ROLES.map(r => (
            <div key={r.value} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#EEF4FF' }}>{r.label}</div>
              <div style={{ fontSize: 10, color: '#6B93C4' }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div style={{ ...S.card, overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 style={{ width: 24, height: 24, color: '#6B93C4' }} className="animate-spin" />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                {['User', 'Role', 'Plan', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const initials = u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : u.email?.slice(0, 2).toUpperCase() || '??';
                const isYou = u.email === currentUser?.email;
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: initGrad[i % initGrad.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initials}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{u.full_name || 'No name'}{isYou ? ' (you)' : ''}</div>
                          <div style={{ fontSize: 11, color: '#6B93C4' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: u.role === 'admin' ? '#7C4DFF' : '#6AADFF', background: u.role === 'admin' ? 'rgba(124,77,255,.12)' : 'rgba(27,110,243,.08)', border: `1px solid ${u.role === 'admin' ? 'rgba(124,77,255,.3)' : 'rgba(27,110,243,.2)'}`, borderRadius: 5, padding: '2px 8px' }}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#7FA8D4' }}>{u.plan || 'Free'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6B93C4' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {!isYou && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => toast.success('Upgrade sent to ' + u.email)} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#1B6EF3', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Upgrade</button>
                          <button onClick={() => toast.info('Manage ' + u.email)} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', cursor: 'pointer' }}>Manage</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>No users found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '28px', width: 400, maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setShowInvite(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', fontSize: 20 }}>×</button>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#EEF4FF', marginBottom: 4 }}>Invite User</h2>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 20 }}>Send an invitation to join the platform.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address"
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#EEF4FF', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: '#0E1828', color: '#EEF4FF', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                {ADMIN_ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
              </select>
              <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}
                style={{ padding: '11px', borderRadius: 8, border: 'none', background: inviteEmail.trim() ? 'linear-gradient(135deg,#1B6EF3,#0D5FDB)' : 'rgba(27,110,243,.3)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {inviting && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                {inviting ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}