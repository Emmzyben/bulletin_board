import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogOut, Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function MobileNav({ user }) {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { icon: Home, label: 'Feed', path: '/' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
    { icon: MessageSquare, label: 'Workspace', path: '/workspace' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
      background: '#FFFFFF', borderTop: '1px solid #E2E8F0', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    }}>
      {navItems.map(item => (
        <Link key={item.path} to={item.path} style={{ flex: 1, textDecoration: 'none' }}>
          <button style={{
            width: '100%', height: 48, border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 2, color: isActive(item.path) ? '#3D5A80' : '#94A3B8', transition: '.2s',
          }}>
            <item.icon style={{ width: 20, height: 20 }} />
            <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
          </button>
        </Link>
      ))}

      <button
        onClick={() => logout()}
        style={{
          flex: 1, height: 48, border: 'none', background: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, color: '#94A3B8', transition: '.2s',
        }}
      >
        <LogOut style={{ width: 20, height: 20 }} />
        <span style={{ fontSize: 10, fontWeight: 600 }}>Sign Out</span>
      </button>
    </nav>
  );
}