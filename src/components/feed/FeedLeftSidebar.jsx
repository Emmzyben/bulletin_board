import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Bookmark, FileText, Building2, Compass, Newspaper, Briefcase, Flame, BarChart3 } from 'lucide-react';
import { ECOSYSTEMS } from '@/lib/ecosystems';

const FEED_TABS = [
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'polls', label: 'Polls', icon: BarChart3 },
];

export default function FeedLeftSidebar({ activeTab, setActiveTab, activeEcosystem, setActiveEcosystem, onCreatePost, user, isDark = true }) {
  const sideCard = { background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'}`, borderRadius: 10, padding: '12px 10px', marginBottom: 0 };
  const secLabel = { fontSize: 11, fontWeight: 800, color: isDark ? 'rgba(150,190,240,.65)' : '#64748B', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 6px', marginBottom: 6, display: 'block' };
  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Create Post */}
      <div style={sideCard}>
        <button
          onClick={onCreatePost}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '9px 14px', background: 'linear-gradient(135deg,rgba(27,110,243,.2),rgba(0,180,216,.1))',
            border: '1px solid rgba(27,110,243,.3)', borderRadius: 8,
            fontSize: 13, fontWeight: 700, color: '#6AADFF', cursor: 'pointer', transition: '.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(27,110,243,.32),rgba(0,180,216,.18))'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(27,110,243,.2),rgba(0,180,216,.1))'; e.currentTarget.style.color = '#6AADFF'; }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          {user ? 'Create Post' : 'Join & Post'}
        </button>
      </div>

      {/* Feed tabs */}
      <div style={sideCard}>
        <span style={secLabel}>Feed</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {FEED_TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? (isDark ? '#EEF4FF' : '#1F3A5F') : (isDark ? '#7FA8D4' : '#475569'),
                  background: active ? 'rgba(27,110,243,.14)' : 'transparent',
                  transition: '.15s', textAlign: 'left', position: 'relative',
                }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; e.currentTarget.style.color = isDark ? '#EEF4FF' : '#1F3A5F'; } }}
                onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#7FA8D4' : '#475569'; } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: '#1B6EF3', borderRadius: '0 3px 3px 0' }} />}
                <tab.icon style={{ width: 15, height: 15 }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ecosystems */}
      <div style={sideCard}>
        <span style={secLabel}>Ecosystems</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: null, label: '🌐 All Ecosystems' }, ...ECOSYSTEMS.map(e => ({ id: e.id, label: `${e.icon} ${e.label}` }))].map(eco => {
            const active = activeEcosystem === eco.id;
            return (
              <button
                key={eco.id || 'all'}
                onClick={() => setActiveEcosystem(eco.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? (isDark ? '#EEF4FF' : '#1F3A5F') : (isDark ? '#7FA8D4' : '#475569'),
                  background: active ? 'rgba(27,110,243,.14)' : 'transparent',
                  transition: '.15s', textAlign: 'left',
                }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; e.currentTarget.style.color = isDark ? '#EEF4FF' : '#1F3A5F'; } }}
                onMouseOut={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#7FA8D4' : '#475569'; } }}
              >
                {eco.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal links */}
      <div style={sideCard}>
        <span style={secLabel}>You</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { to: '/saved', icon: Bookmark, label: 'Saved' },
            { to: user?.email ? `/user-profile?email=${encodeURIComponent(user.email)}` : '/profile', icon: FileText, label: 'Your Posts' },
            { to: '/workspace', icon: Building2, label: 'Workspace' },
          ].map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, fontSize: 13, color: isDark ? '#7FA8D4' : '#475569', textDecoration: 'none', transition: '.15s' }}
              onMouseOver={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'; e.currentTarget.style.color = isDark ? '#EEF4FF' : '#1F3A5F'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? '#7FA8D4' : '#475569'; }}
            >
              <item.icon style={{ width: 15, height: 15 }} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}