import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Loader2, Check, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const C = { bg: '#07090F', surface: '#0E1420', card: '#131B2A', lift: '#192236', blue: '#4F8AF4', teal: '#22D4EE', green: '#2DD4A0', ink: '#F0F6FF', ink2: '#8BADD4', ink3: '#3D5578', b1: 'rgba(255,255,255,.055)', b2: 'rgba(255,255,255,.10)' };

const plans = [
  {
    id: 'free', icon: null, badge: null,
    name: 'Free', tagline: 'Browse, post, and connect across all 9 professional ecosystems.',
    price: '$0', period: '/ month', sub: 'No credit card required',
    cta: 'Get started free', ctaStyle: 'outline',
    features: [
      { label: 'Browse all 9 ecosystems', yes: true },
      { label: '3 posts per month to GP Feed', yes: true, bold: true },
      { label: 'Unlimited commenting & upvoting', yes: true },
      { label: 'Public profile page', yes: true },
      { label: 'Follow topics & professionals', yes: true },
      { label: 'Unlimited posting', yes: false },
      { label: 'Private workspace & channels', yes: false },
      { label: 'File sharing & storage', yes: false },
    ],
  },
  {
    id: 'pro', icon: '⭐', badge: 'Most popular',
    name: 'Pro', tagline: 'Your own private workspace with channels, DMs, and file sharing.',
    price: '$7.99', period: '/ user / month', sub: 'Billed monthly · 14-day free trial',
    cta: 'Start free trial', ctaStyle: 'primary',
    features: [
      { label: 'Unlimited GP Feed posting', yes: true, bold: true },
      { label: 'Private workspace & channels', yes: true },
      { label: 'End-to-end encrypted DMs', yes: true },
      { label: 'File sharing & 50 GB storage', yes: true },
      { label: 'Full message history', yes: true },
      { label: 'Roles, permissions & admin panel', yes: true },
      { label: 'iOS & Android mobile app', yes: true },
      { label: 'Priority email support', yes: true },
    ],
  },
  {
    id: 'annual', icon: '💚', badge: 'Best value',
    name: 'Pro Annual', tagline: 'Everything in Pro, billed annually. Two months free compared to monthly.',
    price: '$10', period: '/ user / month', sub: '$120 per user / year',
    cta: 'Get annual plan', ctaStyle: 'teal',
    features: [
      { label: 'Everything in Pro', yes: true, bold: true },
      { label: '2 months free vs monthly billing', yes: true },
      { label: '100 GB file storage per workspace', yes: true },
      { label: 'Custom workspace branding', yes: true },
      { label: 'Dedicated account manager', yes: true },
      { label: 'Early access to new features', yes: true },
      { label: 'Annual invoice for accounting', yes: true },
      { label: 'Priority phone & email support', yes: true },
    ],
  },
  {
    id: 'enterprise', icon: '🏢', badge: null,
    name: 'Enterprise', tagline: 'Multiple workspaces, SSO, and advanced controls for large organisations.',
    price: '$14', period: '/ user / month', sub: 'Multiple workspaces · custom contracts',
    cta: 'Contact sales', ctaStyle: 'outline', ctaLink: '/support',
    features: [
      { label: 'Up to 10 workspaces', yes: true, bold: true },
      { label: 'Single Sign-On (SSO / SAML)', yes: true },
      { label: 'Advanced audit logs', yes: true },
      { label: 'Custom data retention policies', yes: true },
      { label: '500 GB shared file storage', yes: true },
      { label: '99.9% uptime SLA', yes: true },
      { label: 'Dedicated success manager', yes: true },
      { label: 'Custom onboarding & training', yes: true },
    ],
  },
];

const tableFeatures = [
  { section: 'Public GP Feed' },
  { feature: 'Browse all 9 ecosystems', free: '✓', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Post to GP Feed', free: '3/month', pro: '✓ Unlimited', annual: '✓ Unlimited', ent: '✓ Unlimited' },
  { feature: 'Comments & upvotes', free: '✓', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Public profile', free: '✓', pro: '✓', annual: '✓', ent: '✓' },
  { section: 'Private Workspace' },
  { feature: 'Private workspace', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Private channels', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'E2E encrypted DMs', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Full message history', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Number of workspaces', free: '—', pro: '1', annual: '1', ent: 'Up to 10' },
  { section: 'Storage & Files' },
  { feature: 'File sharing', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Storage', free: '—', pro: '50 GB', annual: '100 GB', ent: '500 GB' },
  { section: 'Admin & Security' },
  { feature: 'Roles & permissions', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Admin dashboard', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Single Sign-On (SSO)', free: '—', pro: '—', annual: '—', ent: '✓' },
  { feature: 'Audit logs', free: '—', pro: '—', annual: '—', ent: '✓' },
  { section: 'Support' },
  { feature: 'Community support', free: '✓', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Priority email support', free: '—', pro: '✓', annual: '✓', ent: '✓' },
  { feature: 'Dedicated account manager', free: '—', pro: '—', annual: '✓', ent: '✓' },
  { feature: 'Custom onboarding', free: '—', pro: '—', annual: '—', ent: '✓' },
];

const faqs = [
  { q: 'How does per-user pricing work?', a: "You pay for each active member in your workspace. Add a new member and your bill adjusts automatically at the next billing cycle. Remove a member and you'll receive a prorated credit. Simple and fair." },
  { q: 'Is there a free trial for Pro?', a: "Yes. Every new Pro workspace comes with a 14-day free trial — no credit card required. You get full access to every Pro feature. Cancel before day 14 and you won't be charged." },
  { q: 'Can I switch from monthly to annual billing?', a: "Yes, at any time. When you switch to annual you'll receive a prorated credit for any unused days on your current monthly period." },
  { q: 'What is the GP Feed and is it free?', a: "The GP Feed is Bulletin Board's public professional community — 9 industry ecosystems where anyone can browse, post, comment, and vote. It is completely free." },
  { q: 'What payment methods do you accept?', a: "All major credit and debit cards via Stripe — Visa, Mastercard, American Express, and Discover. Enterprise customers can also pay by ACH, wire transfer, or purchase order." },
  { q: 'Can I cancel at any time?', a: "Absolutely. Monthly plans can be cancelled at any time and your workspace stays active until the end of the paid period. No lock-in." },
];

const ctaStyles = {
  primary: { background: 'linear-gradient(135deg,#4F8AF4,#2563EB)', color: '#fff', border: 'none', boxShadow: '0 2px 14px rgba(79,138,244,.4)' },
  teal: { background: 'linear-gradient(135deg,#22D4EE,#0099B8)', color: '#07090F', border: 'none', boxShadow: '0 2px 14px rgba(34,212,238,.35)' },
  outline: { background: 'transparent', color: C.ink2, border: `1px solid ${C.b2}` },
};

const planBorderColor = { free: C.b1, pro: 'rgba(79,138,244,.4)', annual: 'rgba(34,212,238,.4)', enterprise: C.b1 };
const planGlow = { pro: '0 0 32px rgba(79,138,244,.1)', annual: '0 0 32px rgba(34,212,238,.08)' };

export default function Pricing() {
  const { navigateToLogin } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const { plan, trialActive, daysLeft } = useSubscription();
  const [startingTrial, setStartingTrial] = useState(false);

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const { data, error } = await supabase.functions.invoke('startTrial', {});
      if (error) throw error;
      if (data.success) {
        alert(`✅ ${data.message}`);
      }
    } catch (err) {
      alert('Failed to start trial: ' + err.message);
    }
    setStartingTrial(false);
  };

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: '100%', height: '100%', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 20px 80px' }}>

        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,138,244,.1)', border: '1px solid rgba(79,138,244,.25)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 20 }}>
            Simple, transparent pricing
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16, background: 'linear-gradient(135deg,#F0F6FF,#8BADD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            The right plan<br />for every team
          </h1>
          <p style={{ fontSize: 17, color: C.ink2, maxWidth: 480, margin: '0 auto' }}>
            Start free and upgrade when your team is ready. No surprises at invoice time.
          </p>
        </div>

        {trialActive && (
          <div style={{ background: 'linear-gradient(135deg,rgba(0,200,83,.1),rgba(0,180,216,.1))', border: '1px solid rgba(0,200,83,.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#00C853', marginBottom: 4 }}>🎉 Free Trial Active</div>
            <div style={{ fontSize: 12, color: '#6B93C4' }}>{daysLeft} days remaining · You'll be upgraded to Pro automatically on day 15</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 80 }}>
          {plans.map(planItem => (
            <div key={planItem.id} style={{
              background: C.card, border: `1px solid ${planBorderColor[planItem.id] || C.b1}`,
              borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column',
              position: 'relative', boxShadow: planGlow[planItem.id] || 'none',
            }}>
              {planItem.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: planItem.id === 'annual' ? C.teal : C.blue, color: planItem.id === 'annual' ? '#07090F' : '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>
                  {planItem.icon} {planItem.badge}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 8 }}>{planItem.name}</div>
                <p style={{ fontSize: 12, color: C.ink3, lineHeight: 1.6, marginBottom: 16 }}>{planItem.tagline}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: C.ink, letterSpacing: '-1px' }}>{planItem.price}</span>
                  <span style={{ fontSize: 13, color: C.ink3 }}>{planItem.period}</span>
                </div>
                <div style={{ fontSize: 11, color: C.ink3 }}>{planItem.sub}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                {planItem.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                    {f.yes
                      ? <span style={{ color: C.green, flexShrink: 0, marginTop: 1 }}>✅</span>
                      : <span style={{ color: C.ink3, flexShrink: 0, marginTop: 1 }}>✗</span>}
                    <span style={{ color: f.yes ? C.ink : C.ink3, fontWeight: f.bold ? 600 : 400 }}>{f.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (planItem.id === 'pro' && !trialActive && plan !== 'pro') {
                    handleStartTrial();
                  } else if (planItem.ctaLink) {
                    window.location.href = planItem.ctaLink;
                  } else {
                    navigateToLogin();
                  }
                }}
                disabled={startingTrial || plan === 'pro' || (planItem.id === 'pro' && trialActive)}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: plan === 'pro' || (startingTrial && planItem.id === 'pro') ? 'not-allowed' : 'pointer', transition: '.15s',
                  ...(plan === 'pro' ? { ...ctaStyles.outline, opacity: 0.6 } : ctaStyles[planItem.ctaStyle]),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {startingTrial && planItem.id === 'pro' ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                {plan === 'pro' ? '✓ Your Plan' : planItem.id === 'pro' && !trialActive ? (startingTrial ? 'Starting...' : 'Start 14-Day Free Trial') : planItem.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 28, textAlign: 'center' }}>Compare all features</h2>
          <div style={{ background: C.card, border: `1px solid ${C.b1}`, borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.lift }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.ink2 }}>Feature</th>
                  {['Free', 'Pro', 'Annual', 'Enterprise'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.ink2, width: 110 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableFeatures.map((row, i) => row.section ? (
                  <tr key={i} style={{ background: 'rgba(79,138,244,.05)' }}>
                    <td colSpan={5} style={{ padding: '10px 20px', fontSize: 11, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: '.8px' }}>{row.section}</td>
                  </tr>
                ) : (
                  <tr key={i} style={{ borderTop: `1px solid ${C.b1}` }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: C.ink2 }}>{row.feature}</td>
                    {[row.free, row.pro, row.annual, row.ent].map((v, j) => (
                      <td key={j} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: v === '✓' ? C.green : v === '—' ? C.ink3 : C.ink }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginBottom: 80, maxWidth: 720, margin: '0 auto 80px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 28, textAlign: 'center' }}>Questions &amp; answers</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.b1}`, borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', color: C.ink, fontSize: 14, fontWeight: 600, textAlign: 'left', gap: 12 }}
                >
                  {faq.q}
                  <ChevronDown style={{ width: 16, height: 16, color: C.ink2, flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', fontSize: 14, color: C.ink2, lineHeight: 1.7 }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', background: 'linear-gradient(135deg,rgba(79,138,244,.12),rgba(34,212,238,.06))', border: `1px solid rgba(79,138,244,.2)`, borderRadius: 20, padding: '48px 32px' }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>Ready to get your team on board?</h2>
          <p style={{ fontSize: 15, color: C.ink2, marginBottom: 28 }}>Start free. Upgrade when you're ready. No credit card required.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigateToLogin()} style={{ padding: '13px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4F8AF4,#2563EB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 14px rgba(79,138,244,.4)' }}>Get started free</button>
            <button onClick={() => window.location.href = '/support'} style={{ padding: '13px 28px', borderRadius: 10, border: `1px solid ${C.b2}`, background: 'transparent', color: C.ink2, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Talk to sales</button>
          </div>
        </div>

      </div>
    </div>
  );
}