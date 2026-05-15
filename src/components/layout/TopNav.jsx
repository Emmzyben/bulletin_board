import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import { useTheme } from '@/lib/ThemeContext';

export default function TopNav({ user, onCreatePost, onMobileMenuToggle, mobileMenuOpen }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, navigateToLogin } = useAuth();
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
  const isDark = theme === 'dark';

  const navLinks = [
    { to: '/home', label: 'Home', exact: true },
    { to: '/', label: 'Feed', exact: true },
    { to: '/communities', label: 'Communities', exact: true },
    { to: '/workspace', label: 'Workspace', exact: false },
    { to: '/pricing', label: 'Pricing', exact: true },
  ];

  const isActive = (link) => link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  const navTextColor = isDark ? '#CBD5E1' : '#475569';
  const navActiveColor = isDark ? '#FFFFFF' : '#1F3A5F';
  const navActiveBg = isDark ? 'rgba(255,255,255,.12)' : '#E0E7FF';
  const navHoverBg = isDark ? 'rgba(255,255,255,.08)' : '#F1F5F9';

  return (
    <header style={{ background: 'transparent', borderBottom: 'none', height: 56, display: 'flex', alignItems: 'center', gap: 0, zIndex: 200, boxShadow: 'none', flexShrink: 0, position: 'relative', overflow: 'visible' }}>
      {/* Logo area */}
      <div style={{ width: 140, height: 56, display: 'flex', alignItems: 'center', paddingLeft: 12, flexShrink: 0 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="https://media.base44.com/images/public/69ebbbf6d42430b1fdaa3ecc/9fdf31f26_bbs_logo2.png"
            alt="Bulletin Board"
            style={{ height: 72, width: 'auto', filter: 'drop-shadow(0 2px 8px rgba(27,110,243,.4))' }}
          />
        </Link>
      </div>

      {/* Mobile toggle */}
      <button
        className="lg:hidden"
        onClick={onMobileMenuToggle}
        style={{ marginLeft: 12, padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#7FA8D4' }}
      >
        {mobileMenuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
      </button>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 1, padding: '0 8px', flex: 1, overflow: 'hidden' }}>
        {navLinks.map(link => (
          <Link key={link.to} to={link.to} style={{ flexShrink: 0 }}>
            <button style={{
              padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: isActive(link) ? 600 : 500,
              color: isActive(link) ? navActiveColor : navTextColor,
              background: isActive(link) ? navActiveBg : 'transparent',
              transition: '.2s', whiteSpace: 'nowrap',
            }}
              onMouseOver={e => { if (!isActive(link)) { e.currentTarget.style.background = navHoverBg; } }}
              onMouseOut={e => { if (!isActive(link)) { e.currentTarget.style.background = 'transparent'; } }}
            >
              {link.label}
            </button>
          </Link>
        ))}

        <button
          onClick={onCreatePost}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#1B6EF3', color: '#FFFFFF', transition: '.2s', flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#0D5FDB'; }}
          onMouseOut={e => { e.currentTarget.style.background = '#1B6EF3'; }}
        >
          ✏️ Post
        </button>
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 12, flexShrink: 0 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: `1px solid ${isDark ? 'rgba(255,255,255,.12)' : '#E2E8F0'}`,
            background: isDark ? 'rgba(255,255,255,.06)' : '#F8FAFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: '.2s', flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.12)' : '#E2E8F0'; }}
          onMouseOut={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : '#F8FAFC'; }}
        >
          {isDark
            ? <Sun style={{ width: 15, height: 15, color: '#F59E0B' }} />
            : <Moon style={{ width: 15, height: 15, color: '#475569' }} />}
        </button>

        {/* Search */}
        <GlobalSearch />

        {/* Notifications */}
        {user && <NotificationBell userEmail={user.email} />}

        {/* User avatar */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#1B6EF3',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer',
                border: '2px solid #FFFFFF',
              }}>
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1F3A5F' }}>{user?.full_name || 'User'}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{user?.email}</p>
              </div>
              <DropdownMenuSeparator style={{ background: '#E2E8F0' }} />
              <Link to="/profile">
                <DropdownMenuItem style={{ color: '#475569', cursor: 'pointer' }}>
                  <User className="w-4 h-4 mr-2" /> View Profile
                </DropdownMenuItem>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <DropdownMenuItem style={{ color: '#475569', cursor: 'pointer' }}>
                    <Settings className="w-4 h-4 mr-2" /> Admin Dashboard
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator style={{ background: '#E2E8F0' }} />
              <DropdownMenuItem onClick={() => logout()} style={{ color: '#DC2626', cursor: 'pointer' }}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={() => navigateToLogin()}
            style={{
              padding: '7px 18px', borderRadius: 6, border: 'none',
              background: '#1B6EF3',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: '.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#0D5FDB'}
            onMouseOut={e => e.currentTarget.style.background = '#1B6EF3'}
          >
            Sign In / Join
          </button>
        )}
      </div>
    </header>
  );
}