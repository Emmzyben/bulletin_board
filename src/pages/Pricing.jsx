import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useSimulatedUpgrade } from '@/hooks/useSimulatedUpgrade';
import { Loader2, Check, ChevronDown, Sparkles } from 'lucide-react';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { getPlanBillingDescription, getPlanPriceLabel, getPlanSeatTotal } from '@/lib/pricing';

const C = { bg: '#07090F', surface: '#0E1420', card: '#131B2A', lift: '#192236', blue: '#4F8AF4', teal: '#22D4EE', green: '#2DD4A0', ink: '#F0F6FF', ink2: '#8BADD4', ink3: '#3D5578', b1: 'rgba(255,255,255,.055)', b2: 'rgba(255,255,255,.10)' };

const faqs = [
  { q: 'How does per-user pricing work?', a: 'The workspace owner chooses the number of seats, including their own. Pro costs $9 per seat each month; Pro Annual is $84 per seat for a year. Accepted members use seats; pending invitations do not count until accepted.' },
  { q: 'Is there a free trial for Pro?', a: "Pro's free-trial duration is shown on its plan card. The Free plan remains free forever and does not require a trial." },
  { q: 'What is the GP Feed and is it free?', a: "The GP Feed is Bulletin Board's public professional community across 9 industry ecosystems. Browsing, posting, commenting, and public profiles are available on the Free plan." },
  { q: 'How do I pay for a plan?', a: 'Subscription checkout is not available yet. The prices shown are the current planned rates; no payment is taken through this page.' },
];

const ctaStyles = {
  primary: { background: 'linear-gradient(135deg,#4F8AF4,#2563EB)', color: '#fff', border: 'none', boxShadow: '0 2px 14px rgba(79,138,244,.4)' },
  outline: { background: 'transparent', color: C.ink2, border: `1px solid ${C.b2}` },
};

const planBorderColor = { free: C.b1, pro: 'rgba(79,138,244,.4)', annual: 'rgba(34,212,238,.4)' };
const planGlow = { pro: '0 0 32px rgba(79,138,244,.1)', annual: '0 0 32px rgba(34,212,238,.08)' };

export default function Pricing() {
  const { navigateToLogin, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const simulatedUpgrade = useSimulatedUpgrade();
  const [openFaq, setOpenFaq] = useState(null);
  const {
    plan,
    trialActive,
    daysLeft,
    seatCount: purchasedSeatCount,
    workspaces,
    isError: subscriptionError,
  } = useSubscription();
  const { plans, isLoading: plansLoading, isError: plansError } = usePricingPlans();
  const [startingTrial, setStartingTrial] = useState(false);
  const [seatCount, setSeatCount] = useState(1);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  useEffect(() => {
    const defaultWorkspace = workspaces[0];
    setSelectedWorkspaceId(defaultWorkspace?.id || '');
    setSeatCount(Math.max(
      1,
      defaultWorkspace?.seat_count || purchasedSeatCount,
      defaultWorkspace?.seats_used || 0,
    ));
  }, [purchasedSeatCount, workspaces]);

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    setStartingTrial(true);
    try {
      const data = await api.post('/subscription/start-trial', { seat_count: seatCount });
      if (data.success) {
        await queryClient.invalidateQueries({ queryKey: ['subscription'] });
        alert(`✅ ${data.message}`);
      }
    } catch (err) {
      alert('Failed to start trial: ' + err.message);
    }
    setStartingTrial(false);
  };

  const handlePlanSelection = async planItem => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }

    if (planItem.id === 'pro' && !trialActive && plan === 'free') {
      await handleStartTrial();
      return;
    }

    if (['pro', 'annual', 'pro_multi', 'annual_multi'].includes(planItem.id)) {
      try {
        const result = await simulatedUpgrade.mutateAsync({
          planId: planItem.id,
          seatCount,
          workspaceId: selectedWorkspaceId || undefined,
        });
        toast.success(result.message);
      } catch (error) {
        toast.error(error.message || 'Simulated payment failed');
      }
    }
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

        {trialActive && plan === 'pro' && (
          <div style={{ background: 'linear-gradient(135deg,rgba(0,200,83,.1),rgba(0,180,216,.1))', border: '1px solid rgba(0,200,83,.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#00C853', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} /> Free Trial Active</div>
            <div style={{ fontSize: 12, color: '#6B93C4' }}>{daysLeft} days remaining · No automatic charge; paid checkout is not available yet.</div>
          </div>
        )}
        {subscriptionError && (
          <p style={{ textAlign: 'center', color: '#EF5350', marginBottom: 20 }}>
            Could not load your current subscription. Refresh before starting a trial or purchasing seats.
          </p>
        )}

        <div style={{ maxWidth: 420, margin: '0 auto 28px', padding: 18, background: C.surface, border: `1px solid ${C.b2}`, borderRadius: 12 }}>
          {workspaces.length > 0 && (
            <label htmlFor="pricing-workspace" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
              Workspace
              <select
                id="pricing-workspace"
                value={selectedWorkspaceId}
                onChange={event => {
                  const selectedWorkspace = workspaces.find(item => item.id === event.target.value);
                  setSelectedWorkspaceId(event.target.value);
                  setSeatCount(Math.max(1, selectedWorkspace?.seat_count || 1, selectedWorkspace?.seats_used || 0));
                }}
                style={{ display: 'block', width: '100%', marginTop: 6, padding: 10, borderRadius: 8, border: `1px solid ${C.b2}`, background: C.bg, color: C.ink }}
              >
                {workspaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
          <label htmlFor="pricing-seat-count" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            Seats in this workspace (including you)
          </label>
          <input
            id="pricing-seat-count"
            type="number"
            min={Math.max(1, workspaces.find(item => item.id === selectedWorkspaceId)?.seats_used || 0)}
            step="1"
            value={seatCount}
            onChange={event => {
              const minimum = Math.max(1, workspaces.find(item => item.id === selectedWorkspaceId)?.seats_used || 0);
              const count = Number.parseInt(event.target.value, 10);
              setSeatCount(Number.isNaN(count) ? minimum : Math.max(minimum, count));
            }}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${C.b2}`, background: C.bg, color: C.ink }}
          />
          <div style={{ fontSize: 12, color: C.ink2, marginTop: 8 }}>
            {plans.filter(item => ['pro', 'annual', 'pro_multi', 'annual_multi'].includes(item.id)).map(item =>
              `${item.name}: ${getPlanSeatTotal(item, seatCount)} per selected workspace`
            ).join(' · ')}
          </div>
        </div>

        {plansLoading && <p style={{ textAlign: 'center', color: C.ink2 }}>Loading current plans…</p>}
        {plansError && <p style={{ textAlign: 'center', color: C.ink2 }}>Pricing is temporarily unavailable. Please try again later.</p>}
        {!plansLoading && !plansError && plans.length === 0 && <p style={{ textAlign: 'center', color: C.ink2 }}>No pricing plans are currently available.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 80 }}>
          {plans.map(planItem => (
            <div key={planItem.id} style={{
              background: C.card, border: `1px solid ${planBorderColor[planItem.id] || C.b1}`,
              borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column',
              position: 'relative', boxShadow: planGlow[planItem.id] || 'none',
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink2, marginBottom: 8 }}>{planItem.name}</div>
                <p style={{ fontSize: 12, color: C.ink3, lineHeight: 1.6, marginBottom: 16 }}>{planItem.description}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: '-1px' }}>{getPlanPriceLabel(planItem)}</span>
                </div>
                <div style={{ fontSize: 11, color: C.ink3 }}>{getPlanBillingDescription(planItem)}</div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                {planItem.features.map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13 }}>
                    <Check size={18} style={{ color: C.green, flexShrink: 0 }} />
                    <span style={{ color: C.ink, fontWeight: feature.includes('Unlimited GP Feed posting') ? 600 : 400 }}>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handlePlanSelection(planItem)}
                disabled={subscriptionError || startingTrial || simulatedUpgrade.isPending || (plan === planItem.id && !(planItem.id === 'pro' && trialActive))}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: planItem.id === 'pro' && (plan === 'pro' || trialActive) ? 'not-allowed' : 'pointer', transition: '.15s',
                  ...(planItem.id === 'pro' || planItem.id === 'pro_multi' ? ctaStyles.primary : ctaStyles.outline),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {(startingTrial || simulatedUpgrade.isPending) && planItem.id !== 'free' ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : null}
                {plan === planItem.id && !(planItem.id === 'pro' && trialActive) ? '✓ Your Plan' : planItem.id === 'pro' && trialActive ? (simulatedUpgrade.isPending ? 'Processing...' : 'Choose seats & activate Pro') : planItem.id === 'pro' && plan === 'free' ? (startingTrial ? 'Starting...' : `Start ${planItem.trial_days}-Day Free Trial`) : ['pro', 'annual', 'pro_multi', 'annual_multi'].includes(planItem.id) ? (simulatedUpgrade.isPending ? 'Processing...' : `Choose ${seatCount} seats`) : 'Get started free'}
              </button>
            </div>
          ))}
        </div>

        {!plansLoading && !plansError && plans.length > 0 && <div style={{ marginBottom: 80 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 28, textAlign: 'center' }}>Compare all features</h2>
          <div style={{ background: C.card, border: `1px solid ${C.b1}`, borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.lift }}>
                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: C.ink2 }}>Feature</th>
                  {plans.map(planItem => (
                    <th key={planItem.id} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.ink2, width: 110 }}>{planItem.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...new Set(plans.flatMap(planItem => planItem.features))].map(feature => (
                  <tr key={feature} style={{ borderTop: `1px solid ${C.b1}` }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, color: C.ink2 }}>{feature}</td>
                    {plans.map(planItem => {
                      const included = planItem.features.includes(feature);
                      return <td key={planItem.id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: included ? C.green : C.ink3 }}>{included ? '✓' : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}

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