import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const inputStyle = {
  padding: '7px 9px',
  borderRadius: 6,
  background: '#0B1628',
  border: '1px solid rgba(255,255,255,.15)',
  color: '#EEF4FF',
  fontSize: 12,
};

export default function UsersAdminTab({ currentUser }) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users?limit=200&search=${encodeURIComponent(search)}`),
  });

  const updateUser = async (account, changes) => {
    try {
      await api.put(`/admin/users/${encodeURIComponent(account.email)}`, changes);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] }),
      ]);
      toast.success('User account updated');
    } catch (updateError) {
      toast.error(updateError.message || 'Failed to update user');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B93C4' }} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            style={{ ...inputStyle, width: '100%', padding: '10px 12px 10px 38px' }}
          />
        </div>
        <span style={{ color: '#6B93C4', fontSize: 12 }}>{users.length} shown (up to 200)</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, overflowX: 'auto' }}>
        {isLoading ? (
          <div role="status" style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : isError ? (
          <div role="alert" style={{ padding: 24, color: '#EF8A80' }}>
            Could not load users: {error.message}
            <button onClick={() => refetch()} style={{ marginLeft: 12, background: 'none', border: 0, color: '#6AADFF', cursor: 'pointer' }}>Retry</button>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                {['Account', 'Role', 'Status', 'Plan', 'Joined', 'Actions'].map(label => (
                  <th key={label} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(account => {
                const isCurrentUser = account.email === currentUser?.email;
                const joined = account.createdAt || account.created_at;
                return (
                  <tr key={account.email} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    <td style={{ padding: '12px 16px', color: '#EEF4FF', fontSize: 12 }}>
                      {account.full_name || 'No name'}{isCurrentUser ? ' (you)' : ''}
                      <div style={{ marginTop: 3, color: '#6B93C4' }}>{account.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: account.role === 'admin' ? '#B39DDB' : '#BBD4F0', fontSize: 12 }}>
                      {account.role || 'user'}
                    </td>
                    <td style={{ padding: '12px 16px', color: account.status === 'active' ? '#00C853' : '#EF8A80', fontSize: 12 }}>{account.status || 'active'}</td>
                    <td style={{ padding: '12px 16px', color: '#BBD4F0', fontSize: 12 }}>{account.plan || 'free'}</td>
                    <td style={{ padding: '12px 16px', color: '#6B93C4', fontSize: 12 }}>{joined ? new Date(joined).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {!isCurrentUser && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              const role = account.role === 'admin' ? 'user' : 'admin';
                              const verb = role === 'admin' ? 'grant administrator access to' : 'remove administrator access from';
                              if (window.confirm(`Are you sure you want to ${verb} ${account.email}?`)) updateUser(account, { role });
                            }}
                            style={{ ...inputStyle, cursor: 'pointer', color: account.role === 'admin' ? '#B39DDB' : '#6AADFF' }}
                          >
                            {account.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                          </button>
                          <button
                            onClick={() => {
                              const nextStatus = account.status === 'active' ? 'banned' : 'active';
                              if (nextStatus === 'banned' && !window.confirm(`Suspend ${account.email}? They will be signed out and blocked from using the platform.`)) return;
                              updateUser(account, { status: nextStatus });
                            }}
                            style={{ ...inputStyle, cursor: 'pointer', color: account.status === 'active' ? '#EF8A80' : '#00C853' }}
                          >
                            {account.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!users.length && (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#6B93C4' }}>No matching users.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
