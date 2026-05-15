import React, { useState, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getEcosystem, getKarmaLevel } from '@/lib/ecosystems';
import PostCard from '../components/feed/PostCard';
import { toast } from 'sonner';

const S = {
  page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', height: '100%', overflowY: 'auto', color: '#EEF4FF', fontFamily: 'Inter, sans-serif' },
  card: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16 },
  label: { fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.55)', textTransform: 'uppercase', letterSpacing: '.9px' },
};

const tabs = [
  { id: 'posts', icon: '📝', label: 'Posts' },
  { id: 'polls', icon: '📊', label: 'Polls' },
  { id: 'comments', icon: '💬', label: 'Comments' },
  { id: 'saved', icon: '🔖', label: 'Saved' },
];

const quickLinks = [
  { to: '/saved', label: '🔖 Saved Posts' },
  { to: '/analytics', label: '📊 Analytics' },
];

export default function Profile() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState('posts');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || null);
  const [coverPosition, setCoverPosition] = useState(user?.cover_position !== undefined ? user.cover_position : 50);
  const [followed, setFollowed] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef(null);
  const coverDragRef = useRef(null);
  const dragState = useRef(null);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      await supabase.from('users').update({ cover_url: publicUrl }).eq('email', user.email);
      
      setCoverUrl(publicUrl);
      setUploadingCover(false);
      setAdjusting(true); // enter adjust mode after upload
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Failed to upload cover image');
      setUploadingCover(false);
    }
  };

  const handleSavePosition = async () => {
    setSaving(true);
    const { error } = await supabase.from('users').update({ cover_position: coverPosition }).eq('email', user.email);
    if (error) toast.error('Failed to save position');
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
  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_email', user.email)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: savedPostRefs = [] } = useQuery({
    queryKey: ['savedPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('user_email', user.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['allPostsForSaved', savedPostRefs.map(s => s.post_id).join(',')],
    queryFn: async () => {
      if (!savedPostRefs.length) return [];
      const ids = savedPostRefs.map(s => s.post_id);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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
              <div style={{
                width: 96, height: 96, borderRadius: 20,
                background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, fontWeight: 800, color: '#fff',
                border: '4px solid #0B1628', marginTop: -48, flexShrink: 0,
                boxShadow: '0 4px 20px rgba(124,77,255,.35)',
              }}>{initials}</div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
                <button
                  onClick={() => { window.location.href = `mailto:${user?.email}`; }}
                  style={{ padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#EEF4FF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  💬 Message
                </button>
                <button
                  onClick={() => { setFollowed(f => !f); toast.success(followed ? 'Unfollowed' : 'Following!'); }}
                  style={{ padding: '8px 18px', borderRadius: 20, border: 'none', background: followed ? 'rgba(27,110,243,.2)' : 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: followed ? 'none' : '0 2px 12px rgba(27,110,243,.4)', border: followed ? '1px solid rgba(27,110,243,.4)' : 'none' }}
                >
                  {followed ? '✓ Following' : '+ Follow'}
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDots(d => !d)}
                    style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)', background: 'transparent', color: '#7FA8D4', fontSize: 16, cursor: 'pointer' }}
                  >⋯</button>
                  {showDots && (
                    <div style={{ position: 'absolute', top: 44, right: 0, background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '6px 0', minWidth: 160, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
                      {[
                        { label: '🔗 Copy profile link', action: () => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!'); } },
                        { label: '🚩 Report user', action: () => toast.info('Report submitted') },
                        { label: '🚫 Block user', action: () => toast.info('User blocked') },
                      ].map(item => (
                        <button key={item.label} onClick={() => { item.action(); setShowDots(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', background: 'none', border: 'none', color: '#7FA8D4', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                        >{item.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Name & bio */}
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.4px', marginBottom: 4 }}>{user?.full_name || user?.user_metadata?.full_name || 'User'}</h1>
            <p style={{ fontSize: 13, color: '#6B93C4', marginBottom: 10 }}>@{user?.email?.split('@')[0] || 'user'} · bulletinboard.app</p>
            {user?.bio && <p style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65, marginBottom: 12 }}>{user.bio}</p>}

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {eco && (
                <span style={{ background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#6AADFF' }}>
                  {eco.icon} {eco.label}
                </span>
              )}
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
              <span style={{ background: `${karma.color || 'rgba(124,77,255,.1)'}`, border: '1px solid rgba(124,77,255,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#B39DDB' }}>
                {karma.badge} {karma.level}
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
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? '#EEF4FF' : '#7FA8D4',
                borderBottom: activeTab === t.id ? '2px solid #1B6EF3' : '2px solid transparent',
                transition: '.15s',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
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
      </div>
    </div>
  );
}