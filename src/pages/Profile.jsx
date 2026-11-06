import React, { useState, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { getEcosystem, getKarmaLevel } from '@/lib/ecosystems';
import PostCard from '../components/feed/PostCard';
import { toast } from 'sonner';
import { FileText, BarChart3, MessageSquare, Bookmark, Camera, Settings, AlertTriangle } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import { useAuth } from '@/lib/AuthContext';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16 },
  label: { fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.55)', textTransform: 'uppercase', letterSpacing: '.9px' },
};

const tabs = [
  { id: 'posts', icon: FileText, label: 'Posts' },
  { id: 'polls', icon: BarChart3, label: 'Polls' },
  { id: 'comments', icon: MessageSquare, label: 'Comments' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const quickLinks = [
  { to: '/saved', label: '🔖 Saved Posts' },
  { to: '/analytics', label: '📊 Analytics' },
];

export default function Profile() {
  const { user } = useOutletContext();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || null);
  const [coverPosition, setCoverPosition] = useState(user?.cover_position !== undefined ? user.cover_position : 50);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const coverDragRef = useRef(null);
  const dragState = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image uploads are allowed.');
      return;
    }

    setUploadingCover(true);
    
    try {
      const data = await uploadFile(file);
      await api.put('/users/profile', { cover_url: data.url });
      
      setCoverUrl(data.url);
      setUploadingCover(false);
      setAdjusting(true); // enter adjust mode after upload
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error(error.message || 'Failed to upload cover image');
      setUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image uploads are allowed.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const data = await uploadFile(file);
      await api.put('/users/profile', { avatar_url: data.url });
      setAvatarUrl(data.url);
      await refreshUser(); // sync global user context so TopNav updates
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSavePosition = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', { cover_position: coverPosition });
    } catch (error) {
      toast.error('Failed to save position');
    }
    setSaving(false);
    setAdjusting(false);
  };

  const handleDragStart = (e) => {
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragState.current = { startY: clientY, startPos: coverPosition };
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
  };

  const handleDragMove = (e) => {
    if (!dragState.current || !coverDragRef.current) return;
    if (e.cancelable) e.preventDefault();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = clientY - dragState.current.startY;
    const height = coverDragRef.current.offsetHeight;
    const delta = (dy / height) * 100;
    setCoverPosition(Math.min(100, Math.max(0, dragState.current.startPos + delta)));
  };

  const handleDragEnd = () => {
    dragState.current = null;
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchmove', handleDragMove);
    window.removeEventListener('touchend', handleDragEnd);
  };
  const eco = user?.primary_ecosystem ? getEcosystem(user.primary_ecosystem) : null;
  const karma = getKarmaLevel(user?.karma || 0);
  const KarmaLevelIcon = typeof karma?.icon === 'function' ? karma.icon : null;
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const data = await api.get(`/posts?author_email=${user.email}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const { data: savedPostRefs = [] } = useQuery({
    queryKey: ['savedPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const data = await api.get(`/saved_posts?user_email=${user.email}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['allPostsForSaved', savedPostRefs.map(s => s.post_id).join(',')],
    queryFn: async () => {
      if (!savedPostRefs.length) return [];
      const ids = savedPostRefs.map(s => s.post_id);
      try {
        const data = await api.get(`/posts?ids=${ids.join(',')}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: savedPostRefs.length > 0,
  });

  const polls = userPosts.filter(p => p.flair === 'poll');

  const stats = [
    { value: userPosts.length, label: 'Posts' },
    { value: user?.karma || 0, label: 'Karma' },
    { value: user?.followers_count || 0, label: 'Followers' },
    { value: user?.following_count || 0, label: 'Following' },
  ];

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 60px' }}>

        {/* Cover + avatar */}
        <div style={{ ...S.card, marginBottom: 24, overflow: 'hidden' }}>
          {/* Cover */}
          <div
            ref={coverDragRef}
            style={{ height: 160, background: coverUrl ? 'none' : 'linear-gradient(135deg,#0D1F3C,#132340,#0A2A1A)', position: 'relative', overflow: 'hidden', cursor: adjusting ? 'ns-resize' : 'default' }}
            onMouseDown={adjusting ? handleDragStart : undefined}
            onTouchStart={adjusting ? handleDragStart : undefined}
          >
            {coverUrl && (
              <img
                src={coverUrl}
                alt="cover"
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${coverPosition}%`, userSelect: 'none', pointerEvents: 'none' }}
              />
            )}
            <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />

            {adjusting ? (
              /* Adjust mode controls */
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#EEF4FF', marginBottom: 12, textShadow: '0 1px 4px rgba(0,0,0,.8)' }}>↕ Drag to reposition</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={handleSavePosition}
                    disabled={saving}
                    style={{ padding: '7px 18px', borderRadius: 8, border: 'none', background: '#1B6EF3', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {saving ? '⏳ Saving…' : '✅ Save position'}
                  </button>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => setAdjusting(false)}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(0,0,0,.4)', color: '#EEF4FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Normal edit button */
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  style={{ background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#EEF4FF', cursor: 'pointer', backdropFilter: 'blur(6px)' }}
                >
                  {uploadingCover ? '⏳ Uploading…' : '✏️ Edit cover'}
                </button>
                {coverUrl && (
                  <button
                    onClick={() => setAdjusting(true)}
                    style={{ background: 'rgba(0,0,0,.45)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#EEF4FF', cursor: 'pointer', backdropFilter: 'blur(6px)' }}
                  >
                    ↕ Reposition
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Avatar row */}
          <div style={{ padding: '0 28px 24px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              {/* Clickable avatar with upload overlay */}
              <div style={{ position: 'relative', marginTop: -48, flexShrink: 0 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 20,
                  background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, fontWeight: 800, color: '#fff',
                  border: '4px solid #0B1628',
                  boxShadow: '0 4px 20px rgba(124,77,255,.35)',
                  overflow: 'hidden',
                }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Change profile photo"
                  style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#1B6EF3', border: '2px solid #0B1628',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#fff',
                  }}
                >
                  {uploadingAvatar ? '⏳' : <Camera size={13} />}
                </button>
              </div>
            </div>

            {/* Name & bio */}
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.4px', marginBottom: 4 }}>{user?.full_name || user?.user_metadata?.full_name || 'User'}</h1>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 10 }}>@{user?.email?.split('@')[0] || 'user'} · bulletinboard.app</p>
            {user?.bio && <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65, marginBottom: 12 }}>{user.bio}</p>}

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {eco && (() => { const EcoIcon = eco.icon; return (
                <span style={{ background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#6AADFF', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EcoIcon size={12} /> {eco.label}
                </span>
              ); })()}
              {user?.company && (
                <span style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#7FA8D4' }}>
                  🏢 {user.company}
                </span>
              )}
              {user?.location && (
                <span style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#7FA8D4' }}>
                  📍 {user.location}
                </span>
              )}
              <span style={{ background: `${karma.color || 'rgba(124,77,255,.1)'}`, border: '1px solid rgba(124,77,255,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#B39DDB', display: 'flex', alignItems: 'center', gap: 4 }}>
                {KarmaLevelIcon ? <KarmaLevelIcon size={14} /> : null} {karma.level}
              </span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {stats.map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px' }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {quickLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: '7px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.04)', color: '#7FA8D4', fontSize: 13, fontWeight: 600,
                textDecoration: 'none', transition: '.15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#EEF4FF'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = '#7FA8D4'; }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,.07)', paddingBottom: 0 }}>
          {tabs.map(t => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
                  color: activeTab === t.id ? '#EEF4FF' : '#7FA8D4',
                  borderBottom: activeTab === t.id ? '2px solid #1B6EF3' : '2px solid transparent',
                  transition: '.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <TabIcon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {userPosts.length === 0
              ? <p style={{ textAlign: 'center', padding: '48px 0', color: '#6B93C4', fontSize: 14 }}>No posts yet</p>
              : userPosts.map(post => <PostCard key={post.id} post={post} userEmail={user?.email} />)}
          </div>
        )}
        {activeTab === 'polls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {polls.length === 0
              ? <p style={{ textAlign: 'center', padding: '48px 0', color: '#6B93C4', fontSize: 14 }}>No polls yet</p>
              : polls.map(post => <PostCard key={post.id} post={post} userEmail={user?.email} />)}
          </div>
        )}
        {activeTab === 'comments' && (
          <div style={{ ...S.card, padding: '48px 0', textAlign: 'center' }}>
            <p style={{ color: '#6B93C4', fontSize: 14 }}>💬 Comments across the GP Feed</p>
          </div>
        )}
        {activeTab === 'saved' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 16px', background: 'rgba(27,110,243,.07)', border: '1px solid rgba(27,110,243,.18)', borderRadius: 10 }}>
              <span style={{ fontSize: 14 }}>🔖</span>
              <p style={{ color: '#7FA8D4', fontSize: 13, margin: 0 }}>
                Saved posts are <strong style={{ color: '#EEF4FF' }}>private</strong> — only visible to you.
              </p>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6B93C4', fontWeight: 700 }}>
                {savedPostRefs.length} saved
              </span>
            </div>
            {savedPostRefs.length === 0 ? (
              <div style={{ ...S.card, padding: '56px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 28, marginBottom: 12 }}>🔖</p>
                <p style={{ color: '#6B93C4', fontSize: 14 }}>No saved posts yet</p>
                <p style={{ color: '#2E4D6E', fontSize: 12, marginTop: 4 }}>Tap the bookmark icon on any post to save it here</p>
              </div>
            ) : allPosts.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(27,110,243,.3)', borderTopColor: '#1B6EF3', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {allPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    userEmail={user?.email}
                    userName={user?.full_name || user?.user_metadata?.full_name}
                    savedPosts={savedPostRefs.map(s => s.post_id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <ProfileSettings user={user} refreshUser={refreshUser} S={S} />
        )}
      </div>
    </div>
  );
}

function ProfileSettings({ user, refreshUser, S }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    company: user?.company || '',
    location: user?.location || '',
    primary_ecosystem: user?.primary_ecosystem || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/users/profile', formData);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setSavingPassword(true);
    try {
      await api.put('/users/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/profile');
      toast.success('Account deleted successfully');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(0,0,0,.2)', color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const sectionStyle = { ...S.card, padding: 24, marginBottom: 20 };
  const btnStyle = { padding: '10px 20px', borderRadius: 8, background: '#1B6EF3', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', transition: '0.2s', opacity: (savingProfile || savingPassword) ? 0.7 : 1 };

  return (
    <div style={{ maxWidth: 600 }}>
      <form onSubmit={handleProfileSubmit} style={sectionStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#EEF4FF' }}>Profile Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required style={inputStyle} value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Bio</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Company / Org</label>
              <input style={inputStyle} value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>Location</label>
              <input style={inputStyle} value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Primary Ecosystem</label>
            <select style={inputStyle} value={formData.primary_ecosystem} onChange={e => setFormData({ ...formData, primary_ecosystem: e.target.value })}>
              <option value="">Select an ecosystem...</option>
              {['technology', 'healthcare', 'corporate', 'education', 'government', 'real_estate', 'hospitality', 'careers', 'entertainment'].map(e => (
                <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1).replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={savingProfile} style={btnStyle}>{savingProfile ? 'Saving...' : 'Save Profile'}</button>
          </div>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} style={sectionStyle}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#EEF4FF' }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <input type="password" required style={inputStyle} value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input type="password" required style={inputStyle} value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input type="password" required style={inputStyle} value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={savingPassword} style={{ ...btnStyle, background: 'rgba(255,255,255,.1)' }}>{savingPassword ? 'Updating...' : 'Update Password'}</button>
          </div>
        </div>
      </form>

      <div style={{ ...sectionStyle, border: '1px solid rgba(239,68,68,.3)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> Danger Zone
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 20 }}>
          Deleting your account is permanent. All your posts, comments, and votes will be permanently removed. This action cannot be undone.
        </p>
        
        {showDeleteConfirm ? (
          <div style={{ padding: 16, background: 'rgba(239,68,68,.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,.2)' }}>
            <p style={{ fontWeight: 600, color: '#FCA5A5', marginBottom: 12, fontSize: 14 }}>Are you absolutely sure you want to delete your account?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleDeleteAccount} style={{ padding: '8px 16px', borderRadius: 6, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Yes, delete my account</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '8px 16px', borderRadius: 6, background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#EF4444', fontSize: 14, fontWeight: 600, border: '1px solid rgba(239,68,68,.3)', cursor: 'pointer', transition: '0.2s' }}>
            Delete Account
          </button>
        )}
      </div>
    </div>
  );
}