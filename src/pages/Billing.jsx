import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronRight, CheckCircle2, BarChart3, Zap as ZapIcon, LifeBuoy } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { usePricingPlans } from '@/hooks/usePricingPlans';
import { useSimulatedUpgrade } from '@/hooks/useSimulatedUpgrade';
import { formatPlanAmount, getPlanBillingDescription, getPlanPriceLabel, getPlanSeatTotal } from '@/lib/pricing';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14 },
  label: { fontSize: 11, fontWeight: 700, color: 'rgba(150,190,240,.55)', textTransform: 'uppercase', letterSpacing: '.8px' },
};

const planColors = { free: '#6B93C4', pro: '#4F8AF4', annual: '#22D4EE', pro_multi: '#7C4DFF', annual_multi: '#22D4EE' };

const TABS = ['Overview', 'Plans'];

export default function Billing() {
  const { user } = useOutletContext();
  const {
    plan: currentPlan,
    trialActive,
    daysLeft,
    seatCount,
    seatsUsed,
    workspaces,
    workspaceCount,
    maxWorkspaces,
  } = useSubscription(Boolean(user));
  const { plans: pricingPlans } = usePricingPlans();
  const simulatedUpgrade = useSimulatedUpgrade();
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedSeatCount, setSelectedSeatCount] = useState(1);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const firstWorkspace = workspaces[0];
    setSelectedWorkspaceId(firstWorkspace?.id || '');
    setSelectedSeatCount(Math.max(1, firstWorkspace?.seat_count || seatCount, firstWorkspace?.seats_used || 0));
  }, [seatCount, workspaces]);

  const normalizedPlan = (currentPlan || 'free').toLowerCase();
  const proTrialDays = pricingPlans.find(plan => plan.id === 'pro')?.trial_days;
  const currentPlanLabel = pricingPlans.find(plan => plan.id === normalizedPlan)?.name || 'Free';
  const currentPlanMeta = normalizedPlan === 'free'
    ? 'Unlimited GP Feed posting · Browse all ecosystems'
    : `${workspaceCount} of ${maxWorkspaces} workspaces · ${seatCount} total seats`;
  const selectedWorkspace = workspaces.find(item => item.id === selectedWorkspaceId);
  const projectedTotalSeats = workspaces.length
    ? seatCount - (selectedWorkspace?.seat_count || 0) + selectedSeatCount
    : selectedSeatCount;
  const plans = pricingPlans.map(plan => ({
    ...plan,
    price: getPlanPriceLabel(plan),
    period: getPlanBillingDescription(plan),
    desc: plan.description,
    color: planColors[plan.id] || '#6B93C4',
    current: plan.id === normalizedPlan,
  }));

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    const workspace = workspaces.find(item => item.id === selectedWorkspaceId);
    setSelectedSeatCount(Math.max(1, workspace?.seat_count || (workspaces.length ? 1 : seatCount), workspace?.seats_used || 0));
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = async () => {
    try {
      const result = await simulatedUpgrade.mutateAsync({
        planId: selectedPlan.id,
        seatCount: selectedSeatCount,
        workspaceId: selectedWorkspaceId || undefined,
      });
      toast.success(result.message);
      setShowUpgradeModal(false);
    } catch (error) {
      toast.error(error.message || 'Simulated payment failed');
    }
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
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(79,138,244,.2)', border: '1px solid rgba(79,138,244,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{normalizedPlan === 'free' ? '🆓' : normalizedPlan.includes('annual') ? '💚' : '⭐'}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6AADFF', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '.7px' }}>Current Plan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF' }}>{currentPlanLabel}</div>
              <div style={{ fontSize: 13, color: '#6B93C4', marginTop: 2 }}>{currentPlanMeta}</div>
              {normalizedPlan !== 'free' && (
                <div style={{ fontSize: 12, color: '#89F0C8', marginTop: 4 }}>
                  {workspaceCount} / {maxWorkspaces} workspaces · {seatsUsed} / {seatCount} seats assigned
                </div>
              )}
              {trialActive && normalizedPlan !== 'free' && (
                <div style={{ fontSize: 12, color: '#89F0C8', marginTop: 5 }}>
                  Trial active · {daysLeft} day{daysLeft === 1 ? '' : 's'} left
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('Plans'); }}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4F8AF4,#2563EB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 14px rgba(79,138,244,.4)', whiteSpace: 'nowrap' }}
          >
            {normalizedPlan === 'free' ? '⚡ Upgrade Plan' : '✦ Manage Plan'}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}><BarChart3 size={18} /> Usage This Month</div>
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 20 }}>
                {[
                  { label: 'GP Feed Posts', value: 'Unlimited', pct: 100, color: '#4F8AF4' },
                  { label: 'Comments', value: 'Unlimited', pct: 100, color: '#22D4EE' },
                  { label: 'Storage', value: '0 GB / Free', pct: 0, color: '#2DD4A0' },
                  { label: 'Workspace Seats', value: `${seatsUsed} / ${seatCount}`, pct: Math.min(100, (seatsUsed / Math.max(seatCount, 1)) * 100), color: '#7C4DFF' },
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
                { icon: ZapIcon, label: 'Upgrade to Pro', sub: 'Unlock workspace, unlimited posts & more', action: () => setActiveTab('Plans') },
                { icon: LifeBuoy, label: 'Billing Support', sub: 'Have a billing question? Contact us', action: () => window.location.href = '/support' },
              ].map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <button key={i} onClick={item.action} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < 3 ? '1px solid rgba(255,255,255,.05)' : 'none', textAlign: 'left' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <IconComponent size={22} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#EEF4FF' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 2 }}>{item.sub}</div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: '#3D5578' }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PLANS */}
        {activeTab === 'Plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 4 }}>Select a plan to upgrade your account. Changes take effect immediately.</p>
            {plans.map(plan => (
              <div key={plan.id} style={{ ...S.card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, border: plan.current ? `1px solid ${plan.color}55` : '1px solid rgba(255,255,255,.07)', background: plan.current ? `rgba(79,138,244,.06)` : 'rgba(255,255,255,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${plan.color}22`, border: `1px solid ${plan.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {plan.id === 'free' ? '🆓' : plan.billing_interval === 'year' ? '💚' : '⭐'}
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
                    <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 4 }}>{plan.period}</div>
                  </div>
                  {plan.id !== 'free' && (
                    <button
                      onClick={() => handleUpgrade(plan)}
                      style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg,${plan.color},${plan.color}cc)`, color: plan.billing_interval === 'year' ? '#07090F' : '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {plan.current ? (trialActive ? 'Choose Seats' : 'Manage Seats') : 'Simulate Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <p style={{ fontSize: 12, color: '#3D5578', textAlign: 'center', marginTop: 8 }}>{proTrialDays ? `Pro includes a ${proTrialDays}-day free trial. ` : ''}Upgrades simulate success; no real payment is processed.</p>
          </div>
        )}

      </div>

      {/* Upgrade Confirmation Modal */}
      {showUpgradeModal && selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '32px', width: 440, maxWidth: '90vw' }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 16 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF', textAlign: 'center', marginBottom: 8 }}>Workspace plan: {selectedPlan.name}</h2>
            <label htmlFor={workspaces.length ? 'billing-workspace' : 'billing-seat-count'} style={{ display: 'block', fontSize: 13, color: '#EEF4FF', fontWeight: 700, marginBottom: 8 }}>
              {workspaces.length ? 'Workspace to update' : 'Seats for your first workspace'}
            </label>
            {workspaces.length > 0 && (
              <select
                id="billing-workspace"
                value={selectedWorkspaceId}
                onChange={event => {
                  const workspace = workspaces.find(item => item.id === event.target.value);
                  setSelectedWorkspaceId(event.target.value);
                  setSelectedSeatCount(Math.max(1, workspace?.seat_count || 1, workspace?.seats_used || 0));
                }}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: '#071020', color: '#EEF4FF', marginBottom: 12 }}
              >
                {workspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>{workspace.name} ({workspace.seats_used}/{workspace.seat_count} seats)</option>
                ))}
              </select>
            )}
            {workspaces.length > 0 && <label htmlFor="billing-seat-count" style={{ display: 'block', fontSize: 13, color: '#EEF4FF', fontWeight: 700, marginBottom: 8 }}>Seats in this workspace</label>}
            <input
              id="billing-seat-count"
              type="number"
              min={Math.max(1, workspaces.find(item => item.id === selectedWorkspaceId)?.seats_used || 0)}
              step="1"
              value={selectedSeatCount}
              onChange={event => {
                const count = Number.parseInt(event.target.value, 10);
                const minimum = Math.max(1, selectedWorkspace?.seats_used || 0);
                setSelectedSeatCount(Number.isNaN(count) ? minimum : Math.max(minimum, count));
              }}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,.15)', background: '#071020', color: '#EEF4FF', marginBottom: 12 }}
            />
            <p style={{ fontSize: 14, color: '#6B93C4', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
              {selectedPlan.billing_interval === 'year'
                ? `${formatPlanAmount(selectedPlan.amount_cents, selectedPlan.currency)} per seat for the year. `
                : `${formatPlanAmount(selectedPlan.amount_cents, selectedPlan.currency)} per seat each month. `}
              This workspace: {getPlanSeatTotal(selectedPlan, selectedSeatCount)}. Total across {workspaces.length || 1} workspace{workspaces.length === 1 ? '' : 's'}: {getPlanSeatTotal(selectedPlan, projectedTotalSeats)}.
              This will simulate a successful payment and activate the plan. No real payment will be processed.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={simulatedUpgrade.isPending} onClick={() => setShowUpgradeModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#7FA8D4', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={confirmUpgrade}
                disabled={simulatedUpgrade.isPending}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${selectedPlan.color},${selectedPlan.color}bb)`, color: selectedPlan.billing_interval === 'year' ? '#07090F' : '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {simulatedUpgrade.isPending ? 'Processing…' : 'Simulate Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}