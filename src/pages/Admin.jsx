import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Loader2 } from 'lucide-react';
import BillingTab from '../components/admin/BillingTab';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import OrdersTab from '../components/admin/OrdersTab';
import SalesTab from '../components/admin/SalesTab';
import UsersAdminTab from '../components/admin/UsersAdminTab';
import UserManagement from '../components/admin/UserManagement';
import WorkspaceAnalytics from '../components/admin/WorkspaceAnalytics';
import ContentModeration from '../components/admin/ContentModeration';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
};

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'workspace-analytics', label: '📈 Analytics' },
  { id: 'user-management', label: '👥 User Management' },
  { id: 'moderation', label: '🛡️ Moderation' },
  { id: 'orders', label: '🧾 Orders' },
  { id: 'sales', label: '💼 Sales' },
  { id: 'users', label: '👤 Platform Users' },
  { id: 'billing', label: '💳 Billing' },
];

export default function Admin() {
  const { user, navigateToLogin } = useOutletContext();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_email', user.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const workspace = workspaces[0];

  const { data: b2bSpaces = [] } = useQuery({
    queryKey: ['b2bSpaces', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const { data, error } = await supabase
        .from('b2b_spaces')
        .select('*')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  // Auth guards
  if (!user) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🔐</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF' }}>Admin Access Only</h2>
      <p style={{ fontSize: 14, color: '#6B93C4' }}>Please sign in to continue.</p>
      <button onClick={() => navigateToLogin()} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
    </div>
  );

  // Assuming 'role' is stored in user_metadata or a separate profiles table
  const userRole = user?.user_metadata?.role || user?.role;
  if (userRole !== 'admin') return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🚫</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#EEF4FF' }}>Access Denied</h2>
      <p style={{ fontSize: 14, color: '#6B93C4' }}>This area is restricted to administrators only.</p>
    </div>
  );

  if (isLoading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 style={{ width: 28, height: 28, color: '#6B93C4' }} className="animate-spin" />
    </div>
  );

  const members = workspace?.members || [{ email: user?.email, role: 'owner', status: 'active' }];

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 16px 60px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: '#EEF4FF', marginBottom: 4 }}>Admin Control Center</h1>
            <div style={{ fontSize: 13, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{workspace?.name || 'Platform Admin'}</span>
              <span style={{ color: '#2E4D6E' }}>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00C853', display: 'inline-block', boxShadow: '0 0 5px #00C853' }} />
                Live
              </span>
              <span style={{ color: '#2E4D6E' }}>·</span>
              <span style={{ fontSize: 11, background: 'rgba(124,77,255,.15)', border: '1px solid rgba(124,77,255,.3)', borderRadius: 5, padding: '1px 8px', color: '#B39DDB', fontWeight: 700 }}>Super Admin</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(0,200,83,.08)', border: '1px solid rgba(0,200,83,.2)', fontSize: 12, color: '#00C853', fontWeight: 700 }}>
              🟢 82% Self-Serve
            </div>
            <div style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(239,83,80,.08)', border: '1px solid rgba(239,83,80,.2)', fontSize: 12, color: '#EF5350', fontWeight: 700 }}>
              ⚠️ 7 Failed Payments
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
            }}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'overview' && <AdminOverviewTab />}
        {activeTab === 'workspace-analytics' && <WorkspaceAnalytics workspace={workspace} />}
        {activeTab === 'user-management' && <UserManagement workspace={workspace} />}
        {activeTab === 'moderation' && <ContentModeration workspace={workspace} />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'sales' && <SalesTab />}
        {activeTab === 'users' && <UsersAdminTab currentUser={user} />}
        {activeTab === 'billing' && <BillingTab members={members} b2bSpaces={b2bSpaces} />}
        {activeTab !== 'overview' && activeTab !== 'workspace-analytics' && activeTab !== 'user-management' && activeTab !== 'moderation' && activeTab !== 'orders' && activeTab !== 'sales' && activeTab !== 'users' && activeTab !== 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🔐', title: 'Require 2FA', desc: 'Enforce two-factor authentication for all members', action: 'Enable', color: '#1B6EF3' },
              { icon: '📋', title: 'Login History', desc: 'View recent login activity across all members', action: 'View', color: '#00B4D8' },
              { icon: '🛡️', title: 'Security Audit', desc: 'Run a comprehensive security check on your workspace', action: 'Run Audit', color: '#7C4DFF' },
              { icon: '🔒', title: 'SSO / SAML', desc: 'Enable single sign-on for enterprise authentication', action: 'Upgrade', color: '#FF8F00' },
            ].map(s => (
              <div key={s.title} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#6B93C4' }}>{s.desc}</div>
                  </div>
                </div>
                <button style={{ padding: '8px 18px', borderRadius: 8, border: `1px solid ${s.color}44`, background: `${s.color}18`, color: s.color, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{s.action}</button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}