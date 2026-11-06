import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { AlertTriangle, FileText, Loader2, RefreshCw, ShieldCheck, Users, Wallet, Building2 } from 'lucide-react';

const CARD_STYLE = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 14,
  padding: '18px 20px',
};

const formatDate = value => value ? new Date(value).toLocaleDateString() : '—';

export default function AdminOverviewTab() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/admin/overview'),
  });

  if (isLoading) {
    return <div role="status" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader2 className="animate-spin" />
    </div>;
  }

  if (isError) {
    return <div role="alert" style={{ ...CARD_STYLE, color: '#EF8A80' }}>
      <p>Unable to load the admin overview: {error.message}</p>
      <button onClick={() => refetch()} style={{ marginTop: 12, color: '#6AADFF', background: 'none', border: 0, cursor: 'pointer' }}>
        Try again
      </button>
    </div>;
  }

  const metrics = data?.metrics || {};
  const cards = [
    { label: 'Total users', value: metrics.totalUsers, Icon: Users, color: '#1B6EF3' },
    { label: 'Active users', value: metrics.activeUsers, Icon: ShieldCheck, color: '#00C853' },
    { label: 'Suspended users', value: metrics.suspendedUsers, Icon: AlertTriangle, color: '#EF5350' },
    { label: 'Posts', value: metrics.totalPosts, Icon: FileText, color: '#7C4DFF' },
    { label: 'Workspaces', value: metrics.totalWorkspaces, Icon: Building2, color: '#00B4D8' },
    { label: 'Open reports', value: metrics.openReports, Icon: AlertTriangle, color: '#FF8F00' },
    { label: 'Paid accounts', value: metrics.paidUsers, Icon: Wallet, color: '#22D4EE' },
    { label: 'Active admins', value: metrics.adminUsers, Icon: ShieldCheck, color: '#B39DDB' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF' }}>Platform overview</h2>
          <p style={{ marginTop: 4, fontSize: 12, color: '#6B93C4' }}>Current counts from the platform database</p>
        </div>
        <button onClick={() => refetch()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#BBD4F0', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 12 }}>
        {cards.map(({ label, value, Icon, color }) => (
          <div key={label} style={CARD_STYLE}>
            <Icon size={20} color={color} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 10, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px' }}>{label}</div>
            <div style={{ marginTop: 4, fontSize: 25, fontWeight: 800, color: '#EEF4FF' }}>{Number(value || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <section style={{ ...CARD_STYLE, padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>
          Recently joined users
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              {['User', 'Role', 'Status', 'Plan', 'Joined'].map(label => (
                <th key={label} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#6B93C4', textTransform: 'uppercase' }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.recentUsers || []).map(account => (
              <tr key={account.email} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <td style={{ padding: '11px 16px', color: '#EEF4FF', fontSize: 12 }}>{account.full_name || account.email}<div style={{ color: '#6B93C4' }}>{account.full_name ? account.email : ''}</div></td>
                <td style={{ padding: '11px 16px', color: '#BBD4F0', fontSize: 12 }}>{account.role || 'user'}</td>
                <td style={{ padding: '11px 16px', color: account.status === 'active' ? '#00C853' : '#EF8A80', fontSize: 12 }}>{account.status}</td>
                <td style={{ padding: '11px 16px', color: '#BBD4F0', fontSize: 12 }}>{account.plan || 'free'}</td>
                <td style={{ padding: '11px 16px', color: '#6B93C4', fontSize: 12 }}>{formatDate(account.createdAt)}</td>
              </tr>
            ))}
            {!data?.recentUsers?.length && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6B93C4' }}>No user accounts yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
