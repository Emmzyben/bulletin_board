import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import MobileNav from './MobileNav';
import CreatePostModal from '../feed/CreatePostModal';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

export default function AppLayout() {
  const { theme } = useTheme();
  const { user, navigateToLogin } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${theme === 'light' ? 'bg-background' : 'bg-[#060D1A]'}`}>
      <div className="hidden lg:block">
        <TopNav
          user={user}
          onCreatePost={() => {
            if (!user) { navigateToLogin(); return; }
            setShowCreatePost(true);
          }}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ user, showCreatePost, setShowCreatePost, mobileMenuOpen, setMobileMenuOpen, navigateToLogin }} />
      </div>
      <div className="lg:hidden">
        {user && <MobileNav user={user} />}
      </div>
      {user && (
        <CreatePostModal
          open={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          user={user}
        />
      )}
    </div>
  );
}