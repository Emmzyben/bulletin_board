import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function WorkspaceAnalytics({ workspace }) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-workspace-analytics', workspace?.id],
    queryFn: () => api.get(`/admin/workspaces/${encodeURIComponent(workspace.id)}/analytics`),
    enabled: !!workspace?.id,
  });

  const metrics = data?.metrics || {};
  let members = [];
  if (Array.isArray(workspace?.members)) {
    members = workspace.members;
  } else if (typeof workspace?.members === 'string') {
    try {
      const parsed = JSON.parse(workspace.members);
      if (Array.isArray(parsed)) members = parsed;
    } catch {
      members = [];
    }
  }
  const activeMembers = members.filter(member =>
    member?.email && !['invited', 'removed', 'deactivated', 'inactive'].includes(member.status)
  );
  if (workspace?.owner_email && !activeMembers.some(member => member.email === workspace.owner_email)) {
    activeMembers.push({ email: workspace.owner_email, role: 'owner', status: 'active' });
  }
  const chartData = (data?.dailyMessages || []).map(day => ({
    date: new Date(`${day.date}T00:00:00`).toLocaleDateString(),
    messages: day.messages,
  }));

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 8 }}>Workspace Analytics</h3>
      <p style={{ fontSize: 12, color: '#6B93C4', marginBottom: 20 }}>{workspace?.name || 'Workspace'} · Live database counts</p>
      {isError && (
        <div role="alert" style={{ marginBottom: 20, padding: 14, border: '1px solid rgba(239,83,80,.3)', borderRadius: 9, color: '#EF8A80' }}>
          Could not load analytics: {error.message}
          <button onClick={() => refetch()} style={{ marginLeft: 10, background: 'none', border: 0, color: '#6AADFF', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: Users, label: 'Active Members', value: metrics.activeMembers, color: '#6AADFF' },
          { icon: MessageSquare, label: 'Total Messages', value: metrics.totalMessages, color: '#00C853' },
          { icon: Calendar, label: 'Channels', value: metrics.activeChannels, color: '#FF8F00' },
          { icon: TrendingUp, label: 'Avg Daily Messages', value: metrics.averageDailyMessages, color: '#00B4D8' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon style={{ width: 20, height: 20, color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B93C4', fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#EEF4FF' }}>{isLoading ? '…' : (stat.value ?? 0).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 16 }}>Messages per Day (Last 7 Days)</h4>
        {isLoading ? (
          <div role="status" style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" />
          </div>
        ) : isError ? (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF8A80' }}>Activity chart unavailable.</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" vertical={false} />
              <XAxis dataKey="date" stroke="#6B93C4" style={{ fontSize: 12 }} />
              <YAxis stroke="#6B93C4" style={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8 }} itemStyle={{ color: '#EEF4FF' }} />
              <Bar dataKey="messages" fill="#1B6EF3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ marginTop: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>Active Members</h4>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {activeMembers.map((member, i) => (
            <div key={member.email} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {member.email?.[0]?.toUpperCase() || 'M'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#EEF4FF' }}>{member.email}</div>
                <div style={{ fontSize: 11, color: '#6B93C4' }}>Role: {member.role || (member.email === workspace?.owner_email ? 'owner' : 'member')}</div>
              </div>
            </div>
          ))}
          {activeMembers.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>No active members in this workspace yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
