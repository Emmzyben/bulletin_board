import React, { useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import PostCard from '../components/feed/PostCard';
import NewsCard from '../components/feed/NewsCard';
import FeedLeftSidebar from '../components/feed/FeedLeftSidebar';
import FeedRightSidebar from '../components/feed/FeedRightSidebar';
import AdvancedSearch from '../components/feed/AdvancedSearch';
import { Loader2 } from 'lucide-react';

export default function Feed() {
  const { user, setShowCreatePost, mobileMenuOpen, navigateToLogin } = useOutletContext();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const isSavedView = location.pathname === '/saved';
  const [activeTab, setActiveTab] = useState('explore');
  const [activeEcosystem, setActiveEcosystem] = useState(null);
  const [activeFlair, setActiveFlair] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ ecosystem: '', flair: '', sortBy: 'recent' });
  const [activeTopic, setActiveTopic] = useState(null);

  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [lastPostId, setLastPostId] = useState(null);

  const { data: newsData } = useQuery({
    queryKey: ['live-news'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-news');
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
    staleTime: 5 * 60 * 1000,
  });
  const newsArticles = newsData?.news || [];

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts', !!user],
    queryFn: async () => {
      if (user) {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return data || [];
      }
      // Guests: use public backend function
      const { data, error } = await supabase.functions.invoke('get-public-posts');
      if (error) throw error;
      return data?.posts || [];
    },
    refetchInterval: 30000,
  });

  const { data: votes = [] } = useQuery({
    queryKey: ['votes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_email', user.email);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const { data: savedPosts = [] } = useQuery({
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

  const userVotes = {};
  votes.forEach(v => { userVotes[v.post_id] = v.vote_type; });
  const savedIds = savedPosts.map(s => s.post_id);

  let filteredPosts = [...posts];

  // Search filter
  if (searchQuery) {
    filteredPosts = filteredPosts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Tab filters
  if (activeTab === 'news') filteredPosts = filteredPosts.filter(p => p.flair === 'news');
  else if (activeTab === 'careers') filteredPosts = filteredPosts.filter(p => p.flair === 'job' || p.ecosystem === 'careers');
  else if (activeTab === 'popular') filteredPosts.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
  else if (activeTab === 'polls') filteredPosts = filteredPosts.filter(p => p.flair === 'poll');

  // Advanced filters
  if (advancedFilters.ecosystem) filteredPosts = filteredPosts.filter(p => p.ecosystem === advancedFilters.ecosystem);
  if (advancedFilters.flair) filteredPosts = filteredPosts.filter(p => p.flair === advancedFilters.flair);
  
  // Sorting
  if (advancedFilters.sortBy === 'trending') {
    filteredPosts.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
  } else if (advancedFilters.sortBy === 'most-comments') {
    filteredPosts.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
  } else if (advancedFilters.sortBy === 'oldest') {
    filteredPosts.reverse();
  }

  // Ecosystem filter
  if (activeEcosystem) filteredPosts = filteredPosts.filter(p => p.ecosystem === activeEcosystem);

  // Flair filter
  if (activeFlair) filteredPosts = filteredPosts.filter(p => p.flair === activeFlair);

  // Topic filter — match topic against title + body
  if (activeTopic) {
    const t = activeTopic.toLowerCase();
    filteredPosts = filteredPosts.filter(p =>
      `${p.title || ''} ${p.body || ''}`.toLowerCase().includes(t)
    );
  }

  // Saved view — only show saved posts
  if (isSavedView) {
    filteredPosts = filteredPosts.filter(p => savedIds.includes(p.id));
  }

  // Mix news articles into feed every ~4 posts (also inject after 2nd post so news is visible even with few posts)
  const mixedFeed = [];
  let newsIndex = 0;
  const shouldMixNews = !isSavedView && !searchQuery && !advancedFilters.ecosystem && !advancedFilters.flair;

  // If we have news but few/no posts, show news at top
  if (shouldMixNews && newsArticles.length > 0 && filteredPosts.length === 0) {
    newsArticles.slice(0, 5).forEach(a => mixedFeed.push({ type: 'news', data: a }));
  }

  filteredPosts.forEach((post, i) => {
    mixedFeed.push({ type: 'post', data: post });
    // Insert news after every 3rd post (i=2,5,8...) instead of every 4th
    if ((i + 1) % 3 === 0 && newsIndex < newsArticles.length && shouldMixNews) {
      mixedFeed.push({ type: 'news', data: newsArticles[newsIndex++] });
    }
  });

  const topPosts = [...posts].sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0)).slice(0, 5);

  const handleRequireLogin = (action) => {
    if (!user) { navigateToLogin(); return; }
    action();
  };

  return (
    <div className="h-full w-full px-3 bg-background">
      <div className="flex gap-3 h-full">
        {/* Left sidebar - independently scrollable */}
        <div className={`${mobileMenuOpen ? 'fixed inset-0 z-40 bg-background p-4 lg:static lg:p-0 lg:bg-transparent' : 'hidden'} lg:flex lg:flex-col flex-shrink-0 h-full overflow-y-auto py-4`} style={{ width: 240 }}>
          <FeedLeftSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeEcosystem={activeEcosystem}
            setActiveEcosystem={setActiveEcosystem}
            onCreatePost={() => handleRequireLogin(() => setShowCreatePost(true))}
            user={user}
            isDark={isDark}
          />
        </div>

        {/* Center feed - independently scrollable */}
        <div className="flex-1 min-w-0 h-full overflow-y-auto py-4">
          {/* Saved view header */}
          {isSavedView && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="text-xl">🔖</span>
              <div>
                <h2 className="text-lg font-bold text-slate-100">Saved Posts</h2>
                <p className="text-xs text-slate-500">{savedIds.length} post{savedIds.length !== 1 ? 's' : ''} saved · private to you</p>
              </div>
            </div>
          )}

          {/* Live feed banner */}
          {!isSavedView && newPostsAvailable && (
            <button
              onClick={() => { setNewPostsAvailable(false); refetch(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium text-center hover:bg-primary/90 transition-colors mb-3 animate-pulse"
            >
              ↑ New posts available — click to refresh
            </button>
          )}

          {/* Quick post bar + search — hidden on saved view */}
          {!isSavedView && (
            <>
              <button
                onClick={() => handleRequireLogin(() => setShowCreatePost(true))}
                style={{ width: '100%', background: isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)', border: `1px solid ${isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'}`, borderRadius: 10, padding: '12px 16px', fontSize: 14, color: isDark ? '#6B93C4' : '#64748B', textAlign: 'left', cursor: 'pointer', marginBottom: 20, transition: '.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(27,110,243,.4)'; e.currentTarget.style.color = isDark ? '#7FA8D4' : '#1F3A5F'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'; e.currentTarget.style.color = isDark ? '#6B93C4' : '#64748B'; }}
              >
                {user ? "What's happening in your industry today?" : "Join Bulletin Board to post, comment, vote and more →"}
              </button>
              <AdvancedSearch onSearch={setSearchQuery} onFilter={setAdvancedFilters} />
            </>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl mb-3">{isSavedView ? '🔖' : '📭'}</p>
              <p className="text-muted-foreground">
                {isSavedView ? 'No saved posts yet — tap the bookmark icon on any post to save it here.' : 'No posts yet. Be the first to post!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {mixedFeed.map((item, idx) =>
                item.type === 'news' ? (
                  <NewsCard key={`news-${item.data.id}-${idx}`} article={item.data} />
                ) : (
                  <div id={`post-${item.data.id}`} key={item.data.id}>
                  <PostCard
                    post={item.data}
                    userVotes={userVotes}
                    savedPosts={savedIds}
                    userEmail={user?.email}
                    userName={user?.full_name || user?.user_metadata?.full_name}
                    isGuest={!user}
                  />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Right sidebar - independently scrollable */}
        <div className="hidden lg:flex lg:flex-col flex-shrink-0 h-full overflow-y-auto py-4" style={{ width: 312 }}>
          <FeedRightSidebar
            topPosts={topPosts}
            allPosts={posts}
            activeFlair={activeFlair}
            setActiveFlair={setActiveFlair}
            activeTopic={activeTopic}
            setActiveTopic={setActiveTopic}
          />
        </div>
      </div>
    </div>
  );
}