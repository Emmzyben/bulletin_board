import React, { useState } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, MessageSquare, Search, Trophy } from 'lucide-react';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ECO_KEYS = ECOSYSTEMS.map(e => e.id);

const ECO_DESCRIPTIONS = {
  technology:   'Discuss software, AI, hardware, startups, and the future of tech.',
  healthcare:   'Healthcare innovation, medicine, biotech, and wellness trends.',
  corporate:    'Business strategy, leadership, operations, and enterprise insights.',
  education:    'Learning, EdTech, universities, and the future of education.',
  government:   'Policy, public sector, civic tech, and governance discussions.',
  real_estate:  'Property markets, urban development, and investment trends.',
  hospitality:  'Travel, hotels, restaurants, and the experience economy.',
  careers:      'Jobs, hiring, professional growth, and workplace culture.',
  entertainment:'Media, gaming, culture, arts, and the creator economy.',
};

export default function Communities() {
  const { user, navigateToLogin } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [joined, setJoined] = useState(() => {
    try { return JSON.parse(localStorage.getItem('joined_communities') || '[]'); } catch { return []; }
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['posts-for-communities'],
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

  // Aggregate stats per ecosystem from posts
  const ecoStats = {};
  for (const post of posts) {
    if (!post.ecosystem) continue;
    if (!ecoStats[post.ecosystem]) ecoStats[post.ecosystem] = { posts: 0, comments: 0, lastActivity: null };
    ecoStats[post.ecosystem].posts += 1;
    ecoStats[post.ecosystem].comments += post.comment_count || 0;
    if (!ecoStats[post.ecosystem].lastActivity || new Date(post.created_at) > new Date(ecoStats[post.ecosystem].lastActivity)) {
      ecoStats[post.ecosystem].lastActivity = post.created_at;
    }
  }

  const ecosystems = ECOSYSTEMS.map(eco => ({
    key: eco.id,
    ...eco,
    description: ECO_DESCRIPTIONS[eco.id] || '',
    stats: ecoStats[eco.id] || { posts: 0, comments: 0, lastActivity: null },
    subscribers: Math.max(12, (ecoStats[eco.id]?.posts || 0) * 17 + (ecoStats[eco.id]?.comments || 0) * 4 + 20),
  }));

  const filtered = ecosystems.filter(e =>
    e.label.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleJoin = (key) => {
    if (!user) { navigateToLogin(); return; }
    const isJoined = joined.includes(key);
    const next = isJoined ? joined.filter(k => k !== key) : [...joined, key];
    setJoined(next);
    localStorage.setItem('joined_communities', JSON.stringify(next));
    const eco = ECOSYSTEMS.find(e => e.id === key);
    toast.success(isJoined ? `Left ${eco?.label}` : `Joined ${eco?.label}!`);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#060D1A' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">Communities</h1>
            <p className="text-slate-400">Explore industry-specific communities and join the conversations that matter to you.</p>
          </div>
          <Link to="/leaderboard">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-slate-100 gap-2 flex-shrink-0">
              <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/70 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Stats bar */}
        <div className="flex gap-6 mb-6 px-1">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-100">{ecosystems.length}</div>
            <div className="text-xs text-slate-500">Communities</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-100">{posts.length}</div>
            <div className="text-xs text-slate-500">Total Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-100">{joined.length}</div>
            <div className="text-xs text-slate-500">Joined</div>
          </div>
        </div>

        {/* Community cards */}
        <div className="space-y-3">
          {filtered.map(eco => {
            const isJoined = joined.includes(eco.key);
            return (
              <div
                key={eco.key}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(27,110,243,0.12)', border: '1px solid rgba(27,110,243,0.2)' }}>
                    {eco.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-base font-bold text-slate-100">{eco.label}</h2>
                      {isJoined && (
                        <Badge className="text-xs bg-primary/20 text-primary border-primary/30 border">Joined</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">{eco.description}</p>

                    {/* Stats row */}
                    <div className="flex items-center gap-5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {eco.subscribers.toLocaleString()} members
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {eco.stats.posts} posts
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {eco.stats.comments} comments
                      </span>
                      {eco.stats.lastActivity && (
                        <span className="text-slate-600">
                          Active {format(new Date(eco.stats.lastActivity), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant={isJoined ? 'outline' : 'default'}
                      className={isJoined ? 'border-slate-600 text-slate-300 hover:border-red-500 hover:text-red-400' : ''}
                      onClick={() => handleJoin(eco.key)}
                    >
                      {isJoined ? 'Leave' : 'Join'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-slate-100"
                      onClick={() => navigate(`/?eco=${eco.key}`)}
                    >
                      Browse →
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}