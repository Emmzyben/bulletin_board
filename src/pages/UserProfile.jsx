import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getEcosystem, getKarmaLevel, ECOSYSTEMS } from '@/lib/ecosystems';
import PostCard from '../components/feed/PostCard';
import { Loader2, ArrowLeft, Calendar, FileText, MessageSquare, ThumbsUp, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTheme } from '@/lib/ThemeContext';

const tabs = [
  { id: 'posts', icon: '📝', label: 'Posts' },
  { id: 'comments', icon: '💬', label: 'Comments' },
];

export default function UserProfile() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const params = new URLSearchParams(window.location.search);
  const authorEmail = params.get('email');
  const [activeTab, setActiveTab] = useState('posts');
  const [activeEcosystem, setActiveEcosystem] = useState(null);

  const { data: profileUser = null, isLoading: loadingUser } = useQuery({
    queryKey: ['publicUser', authorEmail],
    queryFn: async () => {
      if (!authorEmail) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authorEmail)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      return data;
    },
    enabled: !!authorEmail,
  });

  const { data: userPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['userPosts', authorEmail],
    queryFn: async () => {
      if (!authorEmail) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_email', authorEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authorEmail,
  });

  const { data: userComments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['userComments', authorEmail],
    queryFn: async () => {
      if (!authorEmail) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('author_email', authorEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!authorEmail,
  });

  if (!authorEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#071020' : '#F8FAFC' }}>
        <p style={{ color: isDark ? '#6B93C4' : '#64748B' }}>No user specified.</p>
      </div>
    );
  }

  const isLoading = loadingUser || loadingPosts;
  const eco = profileUser?.primary_ecosystem ? getEcosystem(profileUser.primary_ecosystem) : null;
  const karma = getKarmaLevel(profileUser?.karma || 0);
  const initials = profileUser?.full_name
    ? profileUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (authorEmail?.[0] || 'U').toUpperCase();

  const totalUpvotes = userPosts.reduce((sum, p) => sum + (p.upvotes || 0), 0);
  const totalContributions = userPosts.length + userComments.length;

  const ecosystemCounts = userPosts.reduce((acc, p) => {
    if (p.ecosystem) acc[p.ecosystem] = (acc[p.ecosystem] || 0) + 1;
    return acc;
  }, {});
  const activeEcosystems = ECOSYSTEMS.filter(e => ecosystemCounts[e.id]);

  const filteredPosts = activeEcosystem
    ? userPosts.filter(p => p.ecosystem === activeEcosystem)
    : userPosts;

  const bg = isDark ? '#071020' : '#F1F5F9';
  const cardBg = isDark ? 'rgba(255,255,255,.04)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,.07)' : '#E2E8F0';
  const textPrimary = isDark ? '#EEF4FF' : '#1E293B';
  const textSecondary = isDark ? '#7FA8D4' : '#475569';
  const textMuted = isDark ? '#6B93C4' : '#94A3B8';
  const tabBorder = isDark ? 'rgba(255,255,255,.07)' : '#E2E8F0';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textPrimary, fontFamily: 'Inter, sans-serif', overflowY: 'auto' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 16px 60px' }}>

        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, padding: 0 }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 className="animate-spin" style={{ color: '#7FA8D4', width: 28, height: 28 }} />
          </div>
        ) : (
          <>
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ height: 130, background: profileUser?.cover_url ? 'none' : 'linear-gradient(135deg,#0D1F3C,#132340,#1a3a28)', position: 'relative', overflow: 'hidden' }}>
                {profileUser?.cover_url && (
                  <img src={profileUser.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${profileUser.cover_position || 50}%` }} />
                )}
              </div>

              <div style={{ padding: '0 28px 28px', position: 'relative' }}>
                <div style={{
                  width: 84, height: 84, borderRadius: 18,
                  background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, fontWeight: 800, color: '#fff',
                  border: `4px solid ${cardBg}`, marginTop: -42, flexShrink: 0,
                  boxShadow: '0 4px 20px rgba(124,77,255,.35)', marginBottom: 14,
                }}>{initials}</div>

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: textPrimary, marginBottom: 3 }}>
                      {profileUser?.full_name || authorEmail?.split('@')[0] || 'User'}
                    </h1>
                    <p style={{ fontSize: 13, color: textMuted }}>@{authorEmail?.split('@')[0]}</p>
                  </div>
                  <span style={{ background: 'rgba(124,77,255,.12)', border: '1px solid rgba(124,77,255,.3)', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#B39DDB', whiteSpace: 'nowrap' }}>
                    {karma.badge} {karma.level}
                  </span>
                </div>

                {profileUser?.bio && (
                  <p style={{ fontSize: 14, color: textSecondary, lineHeight: 1.7, marginBottom: 16, maxWidth: 580 }}>
                    {profileUser.bio}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
                  {profileUser?.created_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9', border: `1px solid ${cardBorder}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: textSecondary }}>
                      <Calendar size={11} /> Joined {format(new Date(profileUser.created_at), 'MMMM yyyy')}
                    </span>
                  )}
                  {eco && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#6AADFF' }}>
                      {eco.icon} {eco.label}
                    </span>
                  )}
                  {profileUser?.company && (
                    <span style={{ background: isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9', border: `1px solid ${cardBorder}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: textSecondary }}>
                      🏢 {profileUser.company}
                    </span>
                  )}
                  {profileUser?.location && (
                    <span style={{ background: isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9', border: `1px solid ${cardBorder}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: textSecondary }}>
                      📍 {profileUser.location}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 12 }}>
                  {[
                    { icon: <FileText size={15} />, value: userPosts.length, label: 'Posts' },
                    { icon: <MessageSquare size={15} />, value: userComments.length, label: 'Comments' },
                    { icon: <ThumbsUp size={15} />, value: totalUpvotes, label: 'Upvotes' },
                    { icon: <Globe size={15} />, value: totalContributions, label: 'Contributions' },
                  ].map(s => (
                    <div key={s.label} style={{ background: isDark ? 'rgba(255,255,255,.03)' : '#F8FAFC', border: `1px solid ${cardBorder}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', color: '#1B6EF3', marginBottom: 4 }}>{s.icon}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: textPrimary }}>{s.value.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: textMuted, fontWeight: 600, marginTop: 1 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${tabBorder}`, marginBottom: 20 }}>
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
                    color: activeTab === t.id ? textPrimary : textSecondary,
                    borderBottom: activeTab === t.id ? '2px solid #1B6EF3' : '2px solid transparent',
                    transition: '.15s',
                  }}
                >
                  {t.icon} {t.label}
                  <span style={{ marginLeft: 6, fontSize: 11, color: textMuted, fontWeight: 600 }}>
                    ({t.id === 'posts' ? userPosts.length : userComments.length})
                  </span>
                </button>
              ))}
            </div>

            {activeTab === 'posts' && (
              <>
                {activeEcosystems.length > 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    <button
                      onClick={() => setActiveEcosystem(null)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
                        background: !activeEcosystem ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9'),
                        borderColor: !activeEcosystem ? '#1B6EF3' : cardBorder,
                        color: !activeEcosystem ? '#fff' : textSecondary,
                      }}
                    >
                      All ({userPosts.length})
                    </button>
                    {activeEcosystems.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setActiveEcosystem(activeEcosystem === e.id ? null : e.id)}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
                          background: activeEcosystem === e.id ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9'),
                          borderColor: activeEcosystem === e.id ? '#1B6EF3' : cardBorder,
                          color: activeEcosystem === e.id ? '#fff' : textSecondary,
                        }}
                      >
                        {e.icon} {e.label} ({ecosystemCounts[e.id]})
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredPosts.length === 0
                    ? <p style={{ textAlign: 'center', padding: '48px 0', color: textMuted }}>No posts in this ecosystem yet.</p>
                    : filteredPosts.map(post => <PostCard key={post.id} post={post} isGuest={true} />)}
                </div>
              </>
            )}

            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loadingComments ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Loader2 className="animate-spin" style={{ color: '#7FA8D4', width: 24, height: 24 }} />
                  </div>
                ) : userComments.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '48px 0', color: textMuted }}>No comments yet.</p>
                ) : (
                  userComments.map(c => (
                    <div key={c.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 12, padding: '16px 20px' }}>
                      <p style={{ fontSize: 14, color: textSecondary, lineHeight: 1.6, marginBottom: 8 }}>{c.body}</p>
                      <p style={{ fontSize: 11, color: textMuted }}>
                        {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}