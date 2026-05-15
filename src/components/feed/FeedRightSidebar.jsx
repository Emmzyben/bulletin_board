import React from 'react';
import { FLAIRS } from '@/lib/ecosystems';
import { Trophy, ChevronUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import TrendingTopics from './TrendingTopics';
import { useTheme } from '@/lib/ThemeContext';

export default function FeedRightSidebar({ topPosts = [], allPosts = [], activeFlair, setActiveFlair, activeTopic, setActiveTopic }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sideCard = { background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'}`, borderRadius: 10, padding: '12px 10px', marginBottom: 0 };
  const secLabel = { fontSize: 11, fontWeight: 800, color: isDark ? 'rgba(150,190,240,.65)' : '#64748B', textTransform: 'uppercase', letterSpacing: '.8px', padding: '0 6px', marginBottom: 8, display: 'block' };
  return (
    <aside style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Trending Topics */}
      <TrendingTopics posts={allPosts} activeTopic={activeTopic} onTopicClick={setActiveTopic} />
      {/* Browse by Flair */}
      <div style={sideCard}>
        <span style={secLabel}>Browse by Flair</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => setActiveFlair(null)}
            style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
              background: !activeFlair ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'),
              borderColor: !activeFlair ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.11)' : 'rgba(0,0,0,.12)'),
              color: !activeFlair ? '#fff' : (isDark ? '#7FA8D4' : '#475569'),
            }}
          >All</button>
          {FLAIRS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFlair(f.id)}
              style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
                background: activeFlair === f.id ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)'),
                borderColor: activeFlair === f.id ? '#1B6EF3' : (isDark ? 'rgba(255,255,255,.11)' : 'rgba(0,0,0,.12)'),
                color: activeFlair === f.id ? '#fff' : (isDark ? '#7FA8D4' : '#475569'),
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Go Pro */}
      <div style={{ background: 'linear-gradient(135deg,rgba(27,110,243,.15),rgba(0,180,216,.08))', border: '1px solid rgba(27,110,243,.3)', borderRadius: 10, padding: '16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Sparkles style={{ width: 18, height: 18, color: '#6AADFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>Go Pro</span>
        </div>
        <p style={{ fontSize: 12, color: '#7FA8D4', lineHeight: 1.65, marginBottom: 10 }}>
          Unlimited posts, private workspace, channels, huddles, B2B spaces &amp; more.
        </p>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 12 }}>
          $7.99<span style={{ fontSize: 12, fontWeight: 400, color: '#6B93C4' }}>/user/month</span>
        </p>
        <Link to="/pricing">
          <button style={{
            width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', color: '#fff',
            fontSize: 13, fontWeight: 700, boxShadow: '0 2px 12px rgba(27,110,243,.4)', transition: '.15s',
          }}>
            Start Free Trial
          </button>
        </Link>
      </div>

      {/* Top this week */}
      <div style={sideCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 6px' }}>
          <Trophy style={{ width: 15, height: 15, color: '#FFB300' }} />
          <span style={secLabel}>Top This Week</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topPosts.slice(0, 5).map((post, i) => (
            <button
              key={post.id}
              onClick={() => {
                const el = document.getElementById(`post-${post.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 6px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: '#2E4D6E', width: 16, textAlign: 'right', marginTop: 2, flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#EEF4FF' : '#1F3A5F', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <ChevronUp style={{ width: 11, height: 11, color: '#1B6EF3' }} />
                    <span style={{ fontSize: 11, color: isDark ? '#6B93C4' : '#475569' }}>{post.vote_score || 0} votes</span>
                    {post.created_date && (
                      <span style={{ fontSize: 10, color: isDark ? '#3E5C7A' : '#94A3B8' }}>· {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</span>
                    )}
                </div>
              </div>
            </button>
          ))}
          {topPosts.length === 0 && (
            <p style={{ fontSize: 12, color: isDark ? '#2E4D6E' : '#94A3B8', textAlign: 'center', padding: '16px 0' }}>No posts yet this week</p>
          )}
        </div>
      </div>
    </aside>
  );
}