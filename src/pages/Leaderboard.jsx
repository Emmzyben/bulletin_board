import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ECOSYSTEMS, getKarmaLevel } from '@/lib/ecosystems';
import { useTheme } from '@/lib/ThemeContext';
import { Loader2, Trophy, TrendingUp, MessageSquare, ThumbsUp, FileText, Crown } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];

function ScoreBadge({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B93C4' }}>
      {icon}
      <span style={{ fontWeight: 700 }}>{value.toLocaleString()}</span>
      <span>{label}</span>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeEcosystem, setActiveEcosystem] = useState('all');

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['leaderboardPosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['leaderboardComments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['leaderboardUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingPosts || loadingComments || loadingUsers;

  // Build contributor scores
  const leaderboard = useMemo(() => {
    const map = {};

    const ensureAuthor = (email, name) => {
      if (!email) return;
      if (!map[email]) {
        map[email] = { email, name: name || email.split('@')[0], posts: 0, comments: 0, upvotes: 0, ecosystems: {}, score: 0 };
      }
    };

    for (const p of posts) {
      ensureAuthor(p.author_email, p.author_name);
      if (!p.author_email) continue;
      map[p.author_email].posts += 1;
      map[p.author_email].upvotes += p.upvotes || 0;
      if (p.ecosystem) {
        map[p.author_email].ecosystems[p.ecosystem] = (map[p.author_email].ecosystems[p.ecosystem] || 0) + 1;
      }
    }

    for (const c of comments) {
      ensureAuthor(c.author_email, c.author_name);
      if (!c.author_email) continue;
      map[c.author_email].comments += 1;
    }

    // Merge user entity karma
    for (const u of users) {
      if (u.email && map[u.email]) {
        map[u.email].name = u.full_name || map[u.email].name;
        map[u.email].karma = u.karma || 0;
        map[u.email].primaryEcosystem = u.primary_ecosystem;
      }
    }

    return Object.values(map).map(a => ({
      ...a,
      score: (a.karma || 0) + a.posts * 10 + a.comments * 3 + a.upvotes * 5,
    })).sort((a, b) => b.score - a.score);
  }, [posts, comments, users]);

  // Filter by ecosystem
  const filtered = useMemo(() => {
    if (activeEcosystem === 'all') return leaderboard;
    return leaderboard
      .filter(a => a.ecosystems[activeEcosystem])
      .sort((a, b) => {
        const aEco = (a.ecosystems[activeEcosystem] || 0) * 10 + a.upvotes * 5 + a.comments * 3;
        const bEco = (b.ecosystems[activeEcosystem] || 0) * 10 + b.upvotes * 5 + b.comments * 3;
        return bEco - aEco;
      });
  }, [leaderboard, activeEcosystem]);

  // Theme tokens
  const bg = isDark ? '#060D1A' : '#F1F5F9';
  const cardBg = isDark ? 'rgba(255,255,255,.04)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,.08)' : '#E2E8F0';
  const textPrimary = isDark ? '#EEF4FF' : '#1E293B';
  const textSecondary = isDark ? '#7FA8D4' : '#475569';
  const textMuted = isDark ? '#4A6A8A' : '#94A3B8';
  const pillBg = isDark ? 'rgba(255,255,255,.05)' : '#F1F5F9';

  const selectedEco = ECOSYSTEMS.find(e => e.id === activeEcosystem);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: bg, color: textPrimary, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 16px 60px' }}>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <Trophy style={{ width: 28, height: 28, color: '#F59E0B' }} />
            <h1 style={{ fontSize: 28, fontWeight: 900, color: textPrimary, letterSpacing: '-0.5px' }}>Leaderboard</h1>
          </div>
          <p style={{ fontSize: 14, color: textSecondary }}>
            Top contributors ranked by karma, posts, upvotes & engagement
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
          <button
            onClick={() => setActiveEcosystem('all')}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
              background: activeEcosystem === 'all' ? '#1B6EF3' : pillBg,
              borderColor: activeEcosystem === 'all' ? '#1B6EF3' : cardBorder,
              color: activeEcosystem === 'all' ? '#fff' : textSecondary,
            }}
          >
            🌐 All Ecosystems
          </button>
          {ECOSYSTEMS.map(e => (
            <button
              key={e.id}
              onClick={() => setActiveEcosystem(e.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid', transition: '.15s',
                background: activeEcosystem === e.id ? '#1B6EF3' : pillBg,
                borderColor: activeEcosystem === e.id ? '#1B6EF3' : cardBorder,
                color: activeEcosystem === e.id ? '#fff' : textSecondary,
              }}
            >
              {e.icon} {e.label}
            </button>
          ))}
        </div>

        {activeEcosystem !== 'all' && selectedEco && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 16px', background: 'rgba(27,110,243,.08)', border: '1px solid rgba(27,110,243,.2)', borderRadius: 10 }}>
            <span style={{ fontSize: 18 }}>{selectedEco.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#6AADFF' }}>
              Top contributors in {selectedEco.label}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: textMuted }}>{filtered.length} contributors</span>
          </div>
        )}

        {!isLoading && filtered.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[filtered[1], filtered[0], filtered[2]].map((a, col) => {
              const rank = col === 0 ? 1 : col === 1 ? 0 : 2; 
              const actualRank = [1, 0, 2][col];
              const heights = ['130px', '160px', '110px'];
              const glows = ['', '0 0 30px rgba(245,158,11,.25)', ''];
              const karmaLevel = getKarmaLevel(a.karma || 0);
              const isCurrentUser = a.email === user?.email;
              return (
                <div
                  key={a.email}
                  onClick={() => navigate(`/user-profile?email=${encodeURIComponent(a.email)}`)}
                  style={{
                    background: rank === 0 ? 'linear-gradient(160deg,rgba(245,158,11,.12),rgba(27,110,243,.08))' : cardBg,
                    border: `1px solid ${rank === 0 ? 'rgba(245,158,11,.35)' : cardBorder}`,
                    borderRadius: 14, padding: '20px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    minHeight: heights[col], cursor: 'pointer', transition: '.2s',
                    boxShadow: glows[col],
                    alignSelf: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: 26 }}>{MEDAL[actualRank]}</span>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontWeight: 800, color: '#fff',
                    border: isCurrentUser ? '2px solid #F59E0B' : '2px solid transparent',
                  }}>
                    {(a.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 2 }}>{a.name}</p>
                    <p style={{ fontSize: 11, color: textMuted }}>@{a.email.split('@')[0]}</p>
                  </div>
                  <div style={{ background: 'rgba(27,110,243,.12)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 800, color: '#6AADFF' }}>
                    {a.score.toLocaleString()} pts
                  </div>
                  <p style={{ fontSize: 11, color: textMuted }}>{karmaLevel.badge} {karmaLevel.level}</p>
                </div>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 className="animate-spin" style={{ width: 28, height: 28, color: '#7FA8D4' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: textMuted }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>🏜️</p>
            <p>No contributors in this ecosystem yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto auto auto auto', gap: 12, padding: '8px 16px', fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '.7px' }}>
              <span>#</span>
              <span>Contributor</span>
              <span style={{ textAlign: 'right' }}>Posts</span>
              <span style={{ textAlign: 'right' }}>Comments</span>
              <span style={{ textAlign: 'right' }}>Upvotes</span>
              <span style={{ textAlign: 'right' }}>Score</span>
            </div>

            {filtered.map((a, i) => {
              const karmaLevel = getKarmaLevel(a.karma || 0);
              const isCurrentUser = a.email === user?.email;
              return (
                <div
                  key={a.email}
                  onClick={() => navigate(`/user-profile?email=${encodeURIComponent(a.email)}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '48px 1fr auto auto auto auto', gap: 12, alignItems: 'center',
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    background: isCurrentUser ? 'rgba(27,110,243,.08)' : (i % 2 === 0 ? cardBg : (isDark ? 'rgba(255,255,255,.02)' : '#F8FAFC')),
                    border: `1px solid ${isCurrentUser ? 'rgba(27,110,243,.25)' : cardBorder}`,
                    transition: '.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.border = '1px solid rgba(27,110,243,.3)'; }}
                  onMouseOut={e => { e.currentTarget.style.border = `1px solid ${isCurrentUser ? 'rgba(27,110,243,.25)' : cardBorder}`; }}
                >
                  <div style={{ textAlign: 'center' }}>
                    {i < 3
                      ? <span style={{ fontSize: 18 }}>{MEDAL[i]}</span>
                      : <span style={{ fontSize: 13, fontWeight: 800, color: textMuted }}>{i + 1}</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 800, color: '#fff',
                      border: isCurrentUser ? '2px solid #F59E0B' : '2px solid transparent',
                    }}>
                      {(a.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.name} {isCurrentUser && <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 800 }}>YOU</span>}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: textMuted }}>@{a.email.split('@')[0]}</span>
                        <span style={{ fontSize: 10, color: '#B39DDB', fontWeight: 700 }}>{karmaLevel.badge} {karmaLevel.level}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: textSecondary }}>{a.posts}</div>

                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: textSecondary }}>{a.comments}</div>

                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: textSecondary }}>{a.upvotes}</div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#1B6EF3' }}>
                      {a.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, padding: '14px 18px', background: isDark ? 'rgba(255,255,255,.03)' : '#F8FAFC', border: `1px solid ${cardBorder}`, borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: textMuted, textAlign: 'center' }}>
            <TrendingUp style={{ display: 'inline', width: 13, height: 13, marginRight: 5 }} />
            Score = Karma + (Posts × 10) + (Upvotes × 5) + (Comments × 3)
          </p>
        </div>
      </div>
    </div>
  );
}