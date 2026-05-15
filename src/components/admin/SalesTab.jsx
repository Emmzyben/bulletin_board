import React, { useState } from 'react';
import { toast } from 'sonner';

const S = {
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
};

const PIPELINE = [
  { stage: 'Lead', color: '#6B93C4', count: 24 },
  { stage: 'Interested', color: '#00B4D8', count: 11 },
  { stage: 'Demo / Trial', color: '#FF8F00', count: 6 },
  { stage: 'Negotiating', color: '#7C4DFF', count: 3 },
  { stage: 'Closed', color: '#00C853', count: 18 },
];

const LEADS = [
  { name: 'GlobalVentures LLC', email: 'ops@globalventures.com', type: 'Enterprise', seats: 40, stage: 'Negotiating', value: '$6,720/yr', owner: 'You', priority: 'high', last: '1h ago' },
  { name: 'BigCorp Ltd', email: 'ceo@bigcorp.com', type: 'Enterprise', seats: 120, stage: 'Demo / Trial', value: '$20,160/yr', owner: 'You', priority: 'high', last: '3h ago' },
  { name: 'Retail Co Ltd', email: 'diana@retailco.com', type: 'Assisted', seats: 15, stage: 'Closed', value: '$1,800/yr', owner: 'You', priority: 'medium', last: 'Apr 22' },
  { name: 'MedCare Group', email: 'info@medcaregroup.com', type: 'Assisted', seats: 22, stage: 'Interested', value: '$2,112/yr', owner: 'You', priority: 'medium', last: 'Apr 21' },
  { name: 'EduTech Solutions', email: 'admin@edutechsol.com', type: 'Enterprise', seats: 60, stage: 'Lead', value: 'TBD', owner: 'You', priority: 'low', last: 'Apr 20' },
  { name: 'FinancePros Inc', email: 'finance@fpros.com', type: 'Assisted', seats: 10, stage: 'Demo / Trial', value: '$960/yr', owner: 'You', priority: 'medium', last: 'Apr 19' },
];

const stageColor = { Lead: '#6B93C4', Interested: '#00B4D8', 'Demo / Trial': '#FF8F00', Negotiating: '#7C4DFF', Closed: '#00C853' };
const priorityColor = { high: '#EF5350', medium: '#FF8F00', low: '#00C853' };

export default function SalesTab() {
  const [activeStage, setActiveStage] = useState('all');

  const filtered = activeStage === 'all' ? LEADS : LEADS.filter(l => l.stage === activeStage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Pipeline funnel */}
      <div style={{ ...S.card, padding: '22px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 18 }}>🔄 Sales Pipeline</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {PIPELINE.map((p, i) => (
            <div key={p.stage} onClick={() => setActiveStage(activeStage === p.stage ? 'all' : p.stage)} style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color, marginBottom: 6 }}>{p.count}</div>
              <div style={{ height: Math.max(20, (p.count / 24) * 80), background: p.color, borderRadius: '4px 4px 0 0', opacity: activeStage === p.stage || activeStage === 'all' ? 1 : .3, transition: '.2s' }} />
              <div style={{ fontSize: 10, color: '#6B93C4', fontWeight: 600, marginTop: 6, lineHeight: 1.3 }}>{p.stage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin action guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { icon: '🟢', title: 'Self-Serve (Auto)', desc: 'User upgrades themselves. Payment processed instantly. No admin action needed.', action: null },
          { icon: '🔵', title: 'Assisted Sales', desc: 'User needs help. Explain plans, recommend option, and close deal with support.', action: 'View Leads' },
          { icon: '🟣', title: 'Enterprise Deals', desc: 'Large company needs custom pricing, onboarding, and contract. You negotiate directly.', action: 'Open Deals' },
        ].map(c => (
          <div key={c.title} style={{ ...S.card, padding: '18px 20px' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 8 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: '#6B93C4', lineHeight: 1.6, marginBottom: 12 }}>{c.desc}</div>
            {c.action && <button onClick={() => toast.info(c.action)} style={{ fontSize: 12, color: '#6AADFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>{c.action} →</button>}
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>💼 Active Deals & Leads</span>
          <button onClick={() => toast.success('New lead added')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#1B6EF3', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Add Lead</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.02)' }}>
              {['Company', 'Type', 'Seats', 'Value', 'Stage', 'Priority', 'Last Contact', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4' }}>{l.email}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#7FA8D4' }}>{l.type}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#7FA8D4' }}>{l.seats}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{l.value}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, color: stageColor[l.stage], background: `${stageColor[l.stage]}18`, border: `1px solid ${stageColor[l.stage]}33`, borderRadius: 5, padding: '2px 8px', fontWeight: 700 }}>{l.stage}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 11, color: priorityColor[l.priority], fontWeight: 700, textTransform: 'capitalize' }}>● {l.priority}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: '#6B93C4' }}>{l.last}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={() => toast.success('Email sent to ' + l.email)} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#1B6EF3', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Email</button>
                    {l.type === 'Enterprise' && <button onClick={() => toast.success('Quote sent')} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 6, border: 'none', background: '#7C4DFF', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Quote</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}