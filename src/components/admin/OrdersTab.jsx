import React, { useState } from 'react';
import { toast } from 'sonner';

const S = {
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
};

const ORDERS = [
  { id: 'ORD-001', user: 'marcus@techstartup.com', company: 'TechStartup Inc.', plan: 'Pro', seats: 8, amount: '$63.92/mo', type: 'self-serve', status: 'active', started: 'Apr 23, 2026', renewal: 'May 23, 2026' },
  { id: 'ORD-002', user: 'diana@retailco.com', company: 'Retail Co Ltd', plan: 'Pro Annual', seats: 15, amount: '$1,800/yr', type: 'assisted', status: 'active', started: 'Apr 22, 2026', renewal: 'Apr 22, 2027' },
  { id: 'ORD-003', user: 'ops@globalventures.com', company: 'Global Ventures', plan: 'Enterprise', seats: 40, amount: 'Custom', type: 'enterprise', status: 'negotiating', started: '—', renewal: '—' },
  { id: 'ORD-004', user: 'ali@medclinic.ng', company: 'MedClinic NG', plan: 'Pro', seats: 3, amount: '$23.97/mo', type: 'self-serve', status: 'active', started: 'Apr 21, 2026', renewal: 'May 21, 2026' },
  { id: 'ORD-005', user: 'james@fintech.io', company: 'FinTech IO', plan: 'Pro Annual', seats: 5, amount: '$600/yr', type: 'self-serve', status: 'failed', started: 'Apr 20, 2026', renewal: 'Apr 20, 2027' },
  { id: 'ORD-006', user: 'ceo@bigcorp.com', company: 'BigCorp Ltd', plan: 'Enterprise', seats: 120, amount: 'Pending', type: 'enterprise', status: 'pending', started: '—', renewal: '—' },
];

const typeColors = { 'self-serve': '#00C853', 'assisted': '#1B6EF3', 'enterprise': '#7C4DFF' };
const statusColors = { active: '#00C853', failed: '#EF5350', negotiating: '#FF8F00', pending: '#FF8F00' };
const statusBg = { active: 'rgba(0,200,83,.1)', failed: 'rgba(239,83,80,.1)', negotiating: 'rgba(255,143,0,.1)', pending: 'rgba(255,143,0,.1)' };

export default function OrdersTab() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const filtered = filter === 'all' ? ORDERS : ORDERS.filter(o => o.type === filter || o.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: '🟢 Self-Serve (Auto)', count: ORDERS.filter(o => o.type === 'self-serve').length, sub: 'No admin action needed', color: '#00C853' },
          { label: '🔵 Assisted Sales', count: ORDERS.filter(o => o.type === 'assisted').length, sub: 'Admin follow-up required', color: '#1B6EF3' },
          { label: '🟣 Enterprise Deals', count: ORDERS.filter(o => o.type === 'enterprise').length, sub: 'Custom negotiation', color: '#7C4DFF' },
        ].map(c => (
          <div key={c.label} style={{ ...S.card, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: c.color, letterSpacing: '-1px', marginBottom: 4 }}>{c.count}</div>
            <div style={{ fontSize: 11, color: '#6B93C4' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', 'self-serve', 'assisted', 'enterprise', 'failed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === f ? '#1B6EF3' : 'rgba(255,255,255,.1)'}`,
            background: filter === f ? 'rgba(27,110,243,.15)' : 'transparent',
            color: filter === f ? '#6AADFF' : '#7FA8D4', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
          }}>{f === 'all' ? 'All Orders' : f}</button>
        ))}
      </div>

      {/* Orders table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.02)' }}>
              {['Order ID', 'Company', 'Plan', 'Seats', 'Amount', 'Type', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.05)', cursor: 'pointer' }} onClick={() => setSelected(o)}>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6AADFF', fontFamily: 'monospace' }}>{o.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{o.company}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4' }}>{o.user}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#7FA8D4' }}>{o.plan}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#7FA8D4' }}>{o.seats}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{o.amount}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: typeColors[o.type], background: `${typeColors[o.type]}18`, border: `1px solid ${typeColors[o.type]}33`, borderRadius: 5, padding: '2px 8px' }}>{o.type}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColors[o.status], background: statusBg[o.status], border: `1px solid ${statusColors[o.status]}33`, borderRadius: 5, padding: '3px 8px', textTransform: 'capitalize' }}>{o.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {o.status === 'failed' && (
                      <button onClick={e => { e.stopPropagation(); toast.success('Retry payment triggered'); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#EF5350', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                    )}
                    {o.type === 'enterprise' && (
                      <button onClick={e => { e.stopPropagation(); toast.success('Quote sent to ' + o.user); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#7C4DFF', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Send Quote</button>
                    )}
                    {o.type === 'assisted' && (
                      <button onClick={e => { e.stopPropagation(); toast.success('Follow-up email sent'); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1B6EF3', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Follow Up</button>
                    )}
                    <button onClick={e => { e.stopPropagation(); setSelected(o); }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', cursor: 'pointer' }}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order detail panel */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, padding: '28px', width: 480, maxWidth: '90vw', position: 'relative' }}>
            <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', fontSize: 20 }}>×</button>
            <div style={{ fontSize: 11, color: '#6AADFF', fontFamily: 'monospace', marginBottom: 6 }}>{selected.id}</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 4 }}>{selected.company}</h2>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 20 }}>{selected.user}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[['Plan', selected.plan], ['Seats', selected.seats], ['Amount', selected.amount], ['Type', selected.type], ['Started', selected.started], ['Renewal', selected.renewal]].map(([k, v]) => (
                <div key={k} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#EEF4FF', textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {selected.status === 'failed' && <button onClick={() => { toast.success('Retry triggered'); setSelected(null); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#EF5350', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Retry Payment</button>}
              {selected.type === 'enterprise' && <button onClick={() => { toast.success('Quote sent'); setSelected(null); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#7C4DFF', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Send Custom Quote</button>}
              <button onClick={() => { toast.success('Refund issued'); setSelected(null); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid rgba(239,83,80,.4)', background: 'transparent', color: '#EF5350', fontWeight: 700, cursor: 'pointer' }}>Issue Refund</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}