import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import {
  Loader2,
  LayoutDashboard,
  TrendingUp,
  ShieldCheck,
  Receipt,
  Briefcase,
  User,
  CreditCard,
  LockKeyhole,
  Ban,
} from 'lucide-react';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import UsersAdminTab from '../components/admin/UsersAdminTab';
import WorkspaceAnalytics from '../components/admin/WorkspaceAnalytics';
import ContentModeration from '../components/admin/ContentModeration';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
};

const TABS = [
  { id: 'overview',            label: 'Overview',        Icon: LayoutDashboard },
  { id: 'workspace-analytics', label: 'Analytics',       Icon: TrendingUp },
  { id: 'moderation',          label: 'Moderation',      Icon: ShieldCheck },
  { id: 'orders',              label: 'Orders',          Icon: Receipt },
  { id: 'sales',               label: 'Sales',           Icon: Briefcase },
  { id: 'users',               label: 'Platform Users',  Icon: User },
  { id: 'billing',             label: 'Billing',         Icon: CreditCard },
];

export default function Admin() {
  const { user, navigateToLogin } = useOutletContext();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: workspaces = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: () => api.get('/workspaces'),
    enabled: !!user?.email && activeTab === 'workspace-analytics',
  });

  const workspace = workspaces[0];

  // Auth guards
  if (!user) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <LockKeyhole style={{ width: 48, height: 48, color: '#6B93C4' }} />
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF' }}>Admin Access Only</h2>
      <p style={{ fontSize: 14, color: '#6B93C4' }}>Please sign in to continue.</p>
      <button onClick={() => navigateToLogin()} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
    </div>
  );

  // Assuming 'role' is stored in user_metadata or a separate profiles table
  const userRole = user?.user_metadata?.role || user?.role;
  if (userRole !== 'admin') return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Ban style={{ width: 48, height: 48, color: '#EF5350' }} />
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF' }}>Access Denied</h2>
      <p style={{ fontSize: 14, color: '#6B93C4' }}>This area is restricted to administrators only.</p>
    </div>
  );

  if (activeTab === 'workspace-analytics' && isLoading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 style={{ width: 28, height: 28, color: '#6B93C4' }} className="animate-spin" />
    </div>
  );

  if (activeTab === 'workspace-analytics' && isError) return (
    <div role="alert" style={{ ...S.page, padding: 32, color: '#EF8A80' }}>
      Could not load workspace analytics: {error.message}
      <button onClick={() => refetch()} style={{ display: 'block', marginTop: 12, background: 'none', border: 0, color: '#6AADFF', cursor: 'pointer' }}>Retry</button>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 16px 60px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#EEF4FF', marginBottom: 4 }}>Admin Control Center</h1>
            <div style={{ fontSize: 13, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{user.email}</span>
              <span style={{ color: '#2E4D6E' }}>·</span>
              <span style={{ fontSize: 11, background: 'rgba(124,77,255,.15)', border: '1px solid rgba(124,77,255,.3)', borderRadius: 5, padding: '1px 8px', color: '#B39DDB', fontWeight: 700 }}>Administrator</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,.07)', overflowX: 'auto', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '9px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
              color: activeTab === t.id ? '#EEF4FF' : '#7FA8D4',
              borderBottom: activeTab === t.id ? '2px solid #1B6EF3' : '2px solid transparent',
              whiteSpace: 'nowrap', transition: '.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <t.Icon style={{ width: 14, height: 14 }} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && <AdminOverviewTab />}
        {activeTab === 'workspace-analytics' && (workspace
          ? <WorkspaceAnalytics workspace={workspace} />
          : <div style={{ padding: 24, color: '#6B93C4' }}>No workspace is available for this account.</div>)}
        {activeTab === 'moderation' && <ContentModeration workspace={workspace} />}
        {activeTab === 'users' && <UsersAdminTab currentUser={user} />}
        {['orders', 'sales', 'billing'].includes(activeTab) && (
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#EEF4FF', marginBottom: 8 }}>
              {activeTab === 'orders' ? 'Orders' : activeTab === 'sales' ? 'Sales' : 'Billing'} is not connected yet
            </h2>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#8AAACD' }}>
              This workspace does not yet have an order, sales pipeline, or payment provider connected. No sample financial data or pretend actions are shown here.
              Connect and configure a billing provider and define the associated workflows before enabling this section.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}