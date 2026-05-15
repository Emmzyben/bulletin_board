import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CreditCard, Download, ChevronRight, CheckCircle2, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
  label: { fontSize: 11, fontWeight: 700, color: 'rgba(150,190,240,.55)', textTransform: 'uppercase', letterSpacing: '.8px' },
};

const PLANS = [
  { id: 'free', name: 'Free', price: '$0', period: '/month', desc: 'Browse and post to GP Feed', color: '#6B93C4', current: true },
  { id: 'pro', name: 'Pro', price: '$7.99', period: '/user/mo', desc: 'Private workspace + all features', color: '#4F8AF4', current: false },
  { id: 'annual', name: 'Pro Annual', price: '$10', period: '/user/mo', desc: 'Everything in Pro · billed yearly', color: '#22D4EE', current: false },
  { id: 'enterprise', name: 'Enterprise', price: '$14', period: '/user/mo', desc: 'Multiple workspaces + SSO', color: '#7C4DFF', current: false },
];

const INVOICES = [
  { id: 'INV-2026-004', date: 'Apr 1, 2026', amount: '$0.00', status: 'paid', plan: 'Free' },
  { id: 'INV-2026-003', date: 'Mar 1, 2026', amount: '$0.00', status: 'paid', plan: 'Free' },
  { id: 'INV-2026-002', date: 'Feb 1, 2026', amount: '$0.00', status: 'paid', plan: 'Free' },
  { id: 'INV-2026-001', date: 'Jan 1, 2026', amount: '$0.00', status: 'paid', plan: 'Free' },
];

const PAYMENT_METHODS = [
  { type: 'Visa', last4: '4242', expires: '12/27', isDefault: true },
];

const TABS = ['Overview', 'Plans', 'Invoices', 'Payment Methods'];

export default function Billing() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = () => {
    toast.success(`Upgraded to ${selectedPlan.name}! You'll receive a confirmation email shortly.`);
    setShowUpgradeModal(false);
  };

  const handleDownloadInvoice = (inv) => {
    toast.success(`Invoice ${inv.id} downloaded.`);
  };

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Billing & Subscription</h1>
          <p style={{ fontSize: 14, color: '#6B93C4' }}>Manage your plan, invoices, and payment methods.</p>
        </div>

        {/* Current Plan Banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(79,138,244,.12),rgba(34,212,238,.06))', border: '1px solid rgba(79,138,244,.25)', borderRadius: 16, padding: '24px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79,138,244,.2)', border: '1px solid rgba(79,138,244,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🆓</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6AADFF', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.7px' }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF' }}>Free</div>
              <div style={{ fontSize: 13, color: '#6B93C4', marginTop: 2 }}>3 posts/month · Browse all ecosystems</div>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('Plans'); }}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4F8AF4,#2563EB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 14px rgba(79,138,244,.4)', whiteSpace: 'nowrap' }}
          >
            ⚡ Upgrade Plan
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#EEF4FF' : '#7FA8D4',
              borderBottom: activeTab === tab ? '2px solid #4F8AF4' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: '.15s',
            }}>{tab}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Usage Stats */}
            <div style={S.card}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>📊 Usage This Month</span>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20 }}>
                {[
                  { label: 'Posts Used', value: '1 / 3', pct: 33, color: '#4F8AF4' },
                  { label: 'Comments', value: 'Unlimited', pct: 100, color: '#22D4EE' },
                  { label: 'Storage', value: '0 GB / Free', pct: 0, color: '#2DD4A0' },
                  { label: 'Workspaces', value: '0 / 0', pct: 0, color: '#7C4DFF' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B93C4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.7px' }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF', marginBottom: 8 }}>{s.value}</div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Billing */}
            <div style={{ ...S.card, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={S.label}>Next Invoice</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginTop: 6 }}>$0.00</div>
                  <div style={{ fontSize: 13, color: '#6B93C4', marginTop: 2 }}>Due May 1, 2026 · Free plan</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: '#00C853' }} />
                  <span style={{ fontSize: 13, color: '#00C853', fontWeight: 600 }}>Account in good standing</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div style={S.card}>
              {[
                { icon: '⚡', label: 'Upgrade to Pro', sub: 'Unlock workspace, unlimited posts & more', action: () => setActiveTab('Plans') },
                { icon: '📄', label: 'View Invoices', sub: 'Download past receipts and billing history', action: () => setActiveTab('Invoices') },
                { icon: '💳', label: 'Payment Methods', sub: 'Add or update your payment card', action: () => setActiveTab('Payment Methods') },
                { icon: '🛟', label: 'Billing Support', sub: 'Have a billing question? Contact us', action: () => window.location.href = '/support' },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.05)' : 'none', textAlign: 'left' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#EEF4FF' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: '#3D5578' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PLANS */}
        {activeTab === 'Plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 4 }}>Select a plan to upgrade your account. Changes take effect immediately.</p>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ ...S.card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, border: plan.current ? `1px solid ${plan.color}55` : '1px solid rgba(255,255,255,.07)', background: plan.current ? `rgba(79,138,244,.06)` : 'rgba(255,255,255,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${plan.color}22`, border: `1px solid ${plan.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {plan.id === 'free' ? '🆓' : plan.id === 'pro' ? '⭐' : plan.id === 'annual' ? '💚' : '🏢'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#EEF4FF' }}>{plan.name}</span>
                      {plan.current && <span style={{ fontSize: 10, fontWeight: 800, color: plan.color, background: `${plan.color}22`, border: `1px solid ${plan.color}44`, borderRadius: 20, padding: '2px 8px' }}>CURRENT</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B93C4', marginTop: 2 }}>{plan.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF' }}>{plan.price}</span>
                    <span style={{ fontSize: 12, color: '#6B93C4', marginLeft: 4 }}>{plan.period}</span>
                  </div>
                  {!plan.current && (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${plan.color},${plan.color}cc)`, color: plan.id === 'annual' ? '#07090F' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: '#3D5578', textAlign: 'center', marginTop: 8 }}>All paid plans include a 14-day free trial · Cancel anytime · No lock-in</p>
          </div>
        )}

        {/* INVOICES */}
        {activeTab === 'Invoices' && (
          <div style={{ ...S.card, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>📄 Invoice History</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,.02)' }}>
                  {['Invoice', 'Date', 'Plan', 'Amount', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', letterSpacing: '.6px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv, i) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#6AADFF' }}>{inv.id}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7FA8D4' }}>{inv.date}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#7FA8D4' }}>{inv.plan}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{inv.amount}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00C853', background: 'rgba(0,200,83,.1)', border: '1px solid rgba(0,200,83,.2)', borderRadius: 20, padding: '3px 10px' }}>Paid</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleDownloadInvoice(inv)} style={{ fontSize: 12, color: '#6AADFF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download style={{ width: 13, height: 13 }} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENT METHODS */}
        {activeTab === 'Payment Methods' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PAYMENT_METHODS.map((pm, i) => (
              <div key={i} style={{ ...S.card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 32, background: 'linear-gradient(135deg,#1A3A6E,#264A8E)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '1px' }}>VISA</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#EEF4FF' }}>•••• •••• •••• {pm.last4}</div>
                    <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 2 }}>Expires {pm.expires}</div>
                  </div>
                  {pm.isDefault && <span style={{ fontSize: 10, fontWeight: 800, color: '#4F8AF4', background: 'rgba(79,138,244,.12)', border: '1px solid rgba(79,138,244,.25)', borderRadius: 20, padding: '2px 8px' }}>DEFAULT</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toast.info('Card editor coming soon')} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => toast.error('Cannot remove your only payment method')} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(239,83,80,.25)', background: 'rgba(239,83,80,.08)', color: '#EF5350', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                </div>
              </div>
            ))}
            <button
              onClick={() => toast.info('Secure card form coming soon — powered by Stripe')}
              style={{ padding: '14px', borderRadius: 12, border: '1px dashed rgba(255,255,255,.15)', background: 'transparent', color: '#6B93C4', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(79,138,244,.4)'; e.currentTarget.style.color = '#6AADFF'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; e.currentTarget.style.color = '#6B93C4'; }}
            >
              <CreditCard style={{ width: 16, height: 16 }} /> + Add Payment Method
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: '#3D5578' }}>🔒 Payments secured by Stripe · PCI DSS compliant</span>
            </div>
          </div>
        )}

      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '32px', width: 400, maxWidth: '90vw' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF', textAlign: 'center', marginBottom: 8 }}>Upgrade to {selectedPlan.name}</h2>
            <p style={{ fontSize: 14, color: '#6B93C4', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              You'll be charged <strong style={{ color: '#EEF4FF' }}>{selectedPlan.price} {selectedPlan.period}</strong> starting today. 14-day free trial included — cancel anytime.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowUpgradeModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={selectedPlan.id === 'enterprise' ? () => { setShowUpgradeModal(false); window.location.href = '/support'; } : confirmUpgrade}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${selectedPlan.color},${selectedPlan.color}bb)`, color: selectedPlan.id === 'annual' ? '#07090F' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {selectedPlan.id === 'enterprise' ? 'Contact Sales' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}