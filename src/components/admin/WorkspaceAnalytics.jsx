import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export default function WorkspaceAnalytics({ workspace }) {
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['workspace-messages', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ['workspace-all-channels', workspace?.id],
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

  // Calculate stats
  const totalMembers = workspace?.members?.filter(m => m.status === 'active').length || 0;
  const totalMessages = messages.length;
  const activeChannels = channels.length;
  const messagesByDay = {};

  messages.forEach(m => {
    const date = new Date(m.created_at).toLocaleDateString();
    messagesByDay[date] = (messagesByDay[date] || 0) + 1;
  });

  const chartData = Object.entries(messagesByDay)
    .slice(-7)
    .map(([date, count]) => ({ date, messages: count }));

  const isLoading = loadingMessages || loadingChannels;

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 24 }}>Workspace Analytics</h3>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: Users, label: 'Active Members', value: totalMembers, color: '#6AADFF' },
          { icon: MessageSquare, label: 'Total Messages', value: totalMessages, color: '#00C853' },
          { icon: Calendar, label: 'Channels', value: activeChannels, color: '#FF8F00' },
          { icon: TrendingUp, label: 'Avg Daily Messages', value: totalMessages > 0 ? Math.round(totalMessages / 7) : 0, color: '#00B4D8' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 12, padding: '18px', display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: `${stat.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <stat.icon style={{ width: 20, height: 20, color: stat.color }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B93C4', fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#EEF4FF' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '20px' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 16 }}>Messages per Day (Last 7 Days)</h4>
        {isLoading ? (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.1)" vertical={false} />
              <XAxis dataKey="date" stroke="#6B93C4" style={{ fontSize: 12 }} />
              <YAxis stroke="#6B93C4" style={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: '#0F1E35', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8 }}
                itemStyle={{ color: '#EEF4FF' }}
              />
              <Bar dataKey="messages" fill="#1B6EF3" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4' }}>
            No message data yet
          </div>
        )}
      </div>

      {/* Member list */}
      <div style={{ marginTop: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>Active Members</h4>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {workspace?.members?.filter(m => m.status === 'active').map((m, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.05)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {m.email?.[0].toUpperCase() || 'M'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#EEF4FF' }}>{m.email}</div>
                <div style={{ fontSize: 11, color: '#6B93C4' }}>Role: {m.role || 'member'}</div>
              </div>
            </div>
          ))}
          {(!workspace?.members || workspace.members.length === 0) && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>No members in this workspace yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}