import React from 'react';

const S = {
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
};

const MRR_BARS = [42, 58, 71, 65, 88, 94, 107];
const MRR_LABELS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const STAT_CARDS = [
  { icon: '💰', label: 'MRR', value: '$4,820', delta: '+18% vs last month', color: '#00C853' },
  { icon: '👥', label: 'Total Users', value: '2,418', delta: '+124 this month', color: '#1B6EF3' },
  { icon: '📈', label: 'Conversion Rate', value: '6.4%', delta: '+1.2% vs last month', color: '#7C4DFF' },
  { icon: '🏢', label: 'Active Workspaces', value: '312', delta: '+28 this month', color: '#00B4D8' },
  { icon: '💳', label: 'Pro Subscribers', value: '487', delta: '+41 this month', color: '#FF8F00' },
  { icon: '⚠️', label: 'Failed Payments', value: '7', delta: 'Needs attention', color: '#EF5350' },
];

const RECENT_ORDERS = [
  { user: 'marcus@techstartup.com', plan: 'Pro', seats: 8, amount: '$63.92', type: 'self-serve', status: 'paid', time: '2m ago' },
  { user: 'diana@retailco.com', plan: 'Pro Annual', seats: 15, amount: '$1,800', type: 'assisted', status: 'paid', time: '18m ago' },
  { user: 'ops@globalventures.com', plan: 'Enterprise', seats: 40, amount: 'Custom', type: 'enterprise', status: 'pending', time: '1h ago' },
  { user: 'ali@medclinic.ng', plan: 'Pro', seats: 3, amount: '$23.97', type: 'self-serve', status: 'paid', time: '2h ago' },
  { user: 'james@fintech.io', plan: 'Pro Annual', seats: 5, amount: '$600', type: 'self-serve', status: 'failed', time: '3h ago' },
];

const typeColors = { 'self-serve': '#00C853', 'assisted': '#1B6EF3', 'enterprise': '#7C4DFF' };
const statusColors = { paid: '#00C853', pending: '#FF8F00', failed: '#EF5350' };

export default function AdminOverviewTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
        {STAT_CARDS.map((s, i) => (
          <div key={i} style={{ ...S.card, padding: '18px 20px' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* MRR Chart + Order pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* MRR bar chart */}
        <div style={{ ...S.card, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>📈 Monthly Recurring Revenue</div>
              <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 2 }}>Last 7 months</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#00C853' }}>$4,820</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
            {MRR_BARS.map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', background: i === 6 ? 'linear-gradient(180deg,#00C853,#009624)' : 'linear-gradient(180deg,#1B6EF3,#0D5FDB)', borderRadius: '4px 4px 0 0', height: `${(h / 107) * 100}%`, minHeight: 4, opacity: i === 6 ? 1 : .6 }} />
                <span style={{ fontSize: 10, color: '#6B93C4', fontWeight: 600 }}>{MRR_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Order pipeline breakdown */}
        <div style={{ ...S.card, padding: '22px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 18 }}>🔄 Order Pipeline</div>
          {[
            { label: 'Self-Serve (auto)', count: 41, pct: 82, color: '#00C853', desc: 'No action needed' },
            { label: 'Assisted Sales', count: 6, pct: 12, color: '#1B6EF3', desc: 'Admin follow-up' },
            { label: 'Enterprise Deals', count: 3, pct: 6, color: '#7C4DFF', desc: 'Custom negotiation' },
          ].map(p => (
            <div key={p.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#EEF4FF' }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: '#6B93C4' }}>{p.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{p.count}</div>
                  <div style={{ fontSize: 10, color: '#6B93C4' }}>{p.pct}%</div>
                </div>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 99 }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>🧾 Recent Orders</span>
          <span style={{ fontSize: 11, color: '#6B93C4' }}>Last 24 hours</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.02)' }}>
              {['User', 'Plan', 'Seats', 'Amount', 'Type', 'Status', 'Time'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_ORDERS.map((o, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#EEF4FF' }}>{o.user}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#7FA8D4' }}>{o.plan}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#7FA8D4' }}>{o.seats}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{o.amount}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[o.type], background: `${typeColors[o.type]}18`, border: `1px solid ${typeColors[o.type]}33`, borderRadius: 5, padding: '2px 8px' }}>{o.type}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColors[o.status] }}>● {o.status}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: '#2E4D6E' }}>{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}