import React, { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, parseISO, startOfDay } from 'date-fns';
import { TrendingUp, MessageSquare, Bookmark, ThumbsUp, FileText, BarChart2, Loader2 } from 'lucide-react';
import { getEcosystem, getFlair } from '@/lib/ecosystems';

const COLORS = ['#1B6EF3', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#84CC16'];

function StatCard({ icon: Icon, label, value, sub, color = '#1B6EF3' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        <span style={{ fontSize: 13, color: '#7FA8D4', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-1px' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: { background: '#0E1828', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, fontSize: 12, color: '#EEF4FF' },
  labelStyle: { color: '#7FA8D4', fontWeight: 600 },
  cursor: { fill: 'rgba(27,110,243,.08)' },
};

export default function Analytics() {
  const { user, navigateToLogin } = useOutletContext();

  const { data: myPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['myPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_email', user.email)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: myComments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['myComments', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('author_email', user.email)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: saves = [], isLoading: loadingSaves } = useQuery({
    queryKey: ['analyticssSaves'],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('saved_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const isLoading = loadingPosts || loadingComments || loadingSaves;

  const metrics = useMemo(() => {
    if (!myPosts.length) return null;

    const totalUpvotes = myPosts.reduce((s, p) => s + (p.upvotes || 0), 0);
    const totalDownvotes = myPosts.reduce((s, p) => s + (p.downvotes || 0), 0);
    const totalComments = myPosts.reduce((s, p) => s + (p.comment_count || 0), 0);
    const totalSaves = saves.filter(s => myPosts.some(p => p.id === s.post_id)).length;
    const avgVoteScore = myPosts.length ? (myPosts.reduce((s, p) => s + (p.vote_score || 0), 0) / myPosts.length).toFixed(1) : 0;

    const engagementRate = myPosts.length
      ? (((totalUpvotes + totalComments + totalSaves) / myPosts.length)).toFixed(1)
      : 0;

    return { totalUpvotes, totalDownvotes, totalComments, totalSaves, avgVoteScore, engagementRate };
  }, [myPosts, saves]);

  const growthData = useMemo(() => {
    const days = 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM d');
      buckets[d] = { date: d, posts: 0, upvotes: 0, comments: 0, saves: 0 };
    }

    myPosts.forEach(p => {
      if (!p.created_at) return;
      const d = format(startOfDay(parseISO(p.created_at)), 'MMM d');
      if (buckets[d]) {
        buckets[d].posts += 1;
        buckets[d].upvotes += p.upvotes || 0;
        buckets[d].comments += p.comment_count || 0;
      }
    });

    saves.filter(s => myPosts.some(p => p.id === s.post_id)).forEach(s => {
      if (!s.created_at) return;
      const d = format(startOfDay(parseISO(s.created_at)), 'MMM d');
      if (buckets[d]) buckets[d].saves += 1;
    });

    return Object.values(buckets);
  }, [myPosts, saves]);

  const ecosystemData = useMemo(() => {
    const map = {};
    myPosts.forEach(p => {
      if (!p.ecosystem) return;
      if (!map[p.ecosystem]) map[p.ecosystem] = { name: getEcosystem(p.ecosystem)?.label || p.ecosystem, value: 0, score: 0 };
      map[p.ecosystem].value += 1;
      map[p.ecosystem].score += p.vote_score || 0;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [myPosts]);

  const topPosts = useMemo(() =>
    [...myPosts].sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0)).slice(0, 5),
    [myPosts]
  );

  const flairData = useMemo(() => {
    const map = {};
    myPosts.forEach(p => {
      if (!p.flair) return;
      map[p.flair] = (map[p.flair] || 0) + 1;
    });
    return Object.entries(map).map(([flair, count]) => ({
      name: getFlair(flair)?.label || flair,
      value: count,
    }));
  }, [myPosts]);

  const S = {
    page: { background: 'linear-gradient(160deg,#071020 0%,#0B1628 35%,#0A1F1A 70%,#0D1408 100%)', minHeight: '100%', color: '#EEF4FF', fontFamily: 'Inter, sans-serif', overflowY: 'auto' },
    section: { background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 700, color: '#7FA8D4', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.7px' },
  };

  if (!user) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔒</p>
          <p style={{ color: '#7FA8D4', fontSize: 16 }}>Sign in to view your analytics</p>
          <button onClick={() => navigateToLogin()} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#1B6EF3', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px 60px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(27,110,243,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 style={{ width: 22, height: 22, color: '#1B6EF3' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.5px' }}>Content Analytics</h1>
            <p style={{ fontSize: 13, color: '#6B93C4' }}>Track how your posts perform across ecosystems</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <Loader2 style={{ width: 28, height: 28, color: '#1B6EF3', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : myPosts.length === 0 ? (
          <div style={{ ...S.section, textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📝</p>
            <p style={{ color: '#7FA8D4', fontSize: 15 }}>No posts yet — start posting to see your analytics here!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
              <StatCard icon={FileText} label="Total Posts" value={myPosts.length} sub="all time" color="#1B6EF3" />
              <StatCard icon={ThumbsUp} label="Total Upvotes" value={metrics?.totalUpvotes || 0} sub={`avg ${metrics?.avgVoteScore} score/post`} color="#10B981" />
              <StatCard icon={MessageSquare} label="Comments Received" value={metrics?.totalComments || 0} sub="on your posts" color="#8B5CF6" />
              <StatCard icon={Bookmark} label="Times Saved" value={metrics?.totalSaves || 0} sub="by other users" color="#F59E0B" />
              <StatCard icon={TrendingUp} label="Engagement Rate" value={metrics?.engagementRate || 0} sub="interactions per post" color="#06B6D4" />
            </div>

            <div style={S.section}>
              <div style={S.sectionTitle}>Activity — Last 30 Days</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B6EF3" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1B6EF3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gCom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6B93C4', fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fill: '#6B93C4', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#7FA8D4' }} />
                  <Area type="monotone" dataKey="upvotes" name="Upvotes" stroke="#1B6EF3" fill="url(#gUp)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="comments" name="Comments" stroke="#8B5CF6" fill="url(#gCom)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="saves" name="Saves" stroke="#F59E0B" fill="none" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div style={S.section}>
                <div style={S.sectionTitle}>Posts by Ecosystem</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ecosystemData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6B93C4', fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#7FA8D4', fontSize: 11 }} width={90} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="value" name="Posts" radius={[0, 6, 6, 0]}>
                      {ecosystemData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={S.section}>
                <div style={S.sectionTitle}>Post Types</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={flairData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {flairData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#7FA8D4' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={S.section}>
              <div style={S.sectionTitle}>Top Performing Posts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topPosts.map((post, i) => {
                  const flair = getFlair(post.flair);
                  const eco = getEcosystem(post.ecosystem);
                  return (
                    <div key={post.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < topPosts.length - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#1B6EF3', width: 24, textAlign: 'center', flexShrink: 0 }}>#{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#EEF4FF', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {flair && <span style={{ fontSize: 11, color: '#7FA8D4' }}>{flair.icon} {flair.label}</span>}
                          {eco && <span style={{ fontSize: 11, color: '#6B93C4' }}>{eco.icon} {eco.label}</span>}
                          {post.created_at && <span style={{ fontSize: 11, color: '#4A6D8C' }}>{format(parseISO(post.created_at), 'MMM d, yyyy')}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 20, flexShrink: 0, textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>{post.vote_score || 0}</div>
                          <div style={{ fontSize: 10, color: '#4A6D8C' }}>score</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#8B5CF6' }}>{post.comment_count || 0}</div>
                          <div style={{ fontSize: 10, color: '#4A6D8C' }}>comments</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B' }}>{saves.filter(s => s.post_id === post.id).length}</div>
                          <div style={{ fontSize: 10, color: '#4A6D8C' }}>saves</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}