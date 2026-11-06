import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, socket } from '@/api';
import PostCard from '../components/feed/PostCard';
import FeedLeftSidebar from '../components/feed/FeedLeftSidebar';
import FeedRightSidebar from '../components/feed/FeedRightSidebar';
import AdvancedSearch from '../components/feed/AdvancedSearch';
import { Loader2, Bookmark, Inbox } from 'lucide-react';

export default function Feed() {
  const { user, setShowCreatePost, mobileMenuOpen, navigateToLogin } = useOutletContext();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const isSavedView = location.pathname === '/saved';
  const isMyPostsView = location.pathname === '/my-posts';
  const navigate = useNavigate();

  // Redirect guests away from personal feed views.
  useEffect(() => {
    if ((isSavedView || isMyPostsView) && !user) {
      navigateToLogin();
    }
  }, [isSavedView, isMyPostsView, user, navigateToLogin]);

  const [activeTab, setActiveTab] = useState('explore');
  const [activeEcosystem, setActiveEcosystem] = useState(null);
  const [activeFlair, setActiveFlair] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState({ ecosystem: '', flair: '', sortBy: 'recent' });
  const [activeTopic, setActiveTopic] = useState(null);

  // Support both ecosystem query parameter names used by feed links.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eco = params.get('eco') || params.get('ecosystem');
    if (eco) {
      setActiveEcosystem(eco);
      params.delete('eco');
      params.delete('ecosystem');
      navigate(
        { pathname: location.pathname, search: params.toString() ? `?${params}` : '' },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  const { data: posts = [], isLoading, isError: postsError, error: postsErrorDetails, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const data = await api.get('/posts');
      if (!Array.isArray(data)) throw new Error('The feed response was not a post list.');
      return data;
    },
  });

  useEffect(() => {
    const handleNewPost = (post) => {
      if (!post?.id) return;
      queryClient.setQueryData(['posts'], currentPosts => {
        const postsWithoutDuplicate = (currentPosts || []).filter(item => item.id !== post.id);
        return [post, ...postsWithoutDuplicate];
      });
    };
    const handleVoteUpdated = (voteUpdate) => {
      if (!voteUpdate?.id) return;
      queryClient.setQueryData(['posts'], currentPosts =>
        (currentPosts || []).map(post => post.id === voteUpdate.id
          ? { ...post, ...voteUpdate }
          : post)
      );
      if (voteUpdate.voter_email === user?.email && voteUpdate.vote_type) {
        queryClient.setQueryData(['votes', user.email], currentVotes => [
          ...(currentVotes || []).filter(vote => vote.post_id !== voteUpdate.id),
          {
            post_id: voteUpdate.id,
            voter_email: user.email,
            vote_type: voteUpdate.vote_type,
          },
        ]);
      }
    };

    socket.on('new_post', handleNewPost);
    socket.on('vote_updated', handleVoteUpdated);
    return () => {
      socket.off('new_post', handleNewPost);
      socket.off('vote_updated', handleVoteUpdated);
    };
  }, [queryClient, user?.email]);

  const { data: votes = [], isError: votesError, refetch: refetchVotes } = useQuery({
    queryKey: ['votes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await api.get('/votes');
      if (!Array.isArray(data)) throw new Error('The vote response was invalid.');
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: pollVotes = [], isError: pollVotesError, refetch: refetchPollVotes } = useQuery({
    queryKey: ['pollVotes', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await api.get('/poll-votes');
      if (!Array.isArray(data)) throw new Error('The poll vote response was invalid.');
      return data;
    },
    enabled: !!user?.email,
  });

  const { data: savedPosts = [], isError: savedPostsError, refetch: refetchSavedPosts } = useQuery({
    queryKey: ['savedPosts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const data = await api.get('/saved-posts');
      if (!Array.isArray(data)) throw new Error('The saved-post response was invalid.');
      return data;
    },
    enabled: !!user?.email,
  });

  const userVotes = {};
  votes.forEach(v => { userVotes[v.post_id] = v.vote_type; });
  const userPollVotes = {};
  pollVotes.forEach(vote => { userPollVotes[vote.post_id] = vote.option_index; });
  const savedIds = savedPosts.map(s => s.post_id);

  let filteredPosts = [...posts];

  // Search filter
  if (searchQuery) {
    filteredPosts = filteredPosts.filter(p => 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Tab filters
  if (activeTab === 'news') filteredPosts = filteredPosts.filter(p => p.flair === 'news');
  else if (activeTab === 'careers') filteredPosts = filteredPosts.filter(p => p.flair === 'job' || p.ecosystem === 'careers');
  else if (activeTab === 'popular') filteredPosts.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
  else if (activeTab === 'polls') filteredPosts = filteredPosts.filter(p => p.flair === 'poll');
  else if (activeTab === 'my_communities') {
    const joinedCommunities = user?.joined_communities || [];
    if (joinedCommunities.length > 0) {
      filteredPosts = filteredPosts.filter(p => joinedCommunities.includes(p.ecosystem));
    } else {
      filteredPosts = []; // no communities joined yet
    }
  }

  // Advanced filters
  if (advancedFilters.ecosystem) filteredPosts = filteredPosts.filter(p => p.ecosystem === advancedFilters.ecosystem);
  if (advancedFilters.flair) filteredPosts = filteredPosts.filter(p => p.flair === advancedFilters.flair);
  
  // Sorting
  if (advancedFilters.sortBy === 'trending') {
    filteredPosts.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
  } else if (advancedFilters.sortBy === 'most-comments') {
    filteredPosts.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
  } else if (advancedFilters.sortBy === 'oldest') {
    filteredPosts.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateA - dateB;
    });
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

  if (isMyPostsView && user?.email) {
    filteredPosts = filteredPosts.filter(p => p.author_email === user.email);
  }

  // Saved view — only show saved posts
  if (isSavedView) {
    filteredPosts = filteredPosts.filter(p => savedIds.includes(p.id));
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const topPosts = posts
    .filter(post => {
      const createdAt = post.created_at || post.createdAt;
      const timestamp = createdAt ? new Date(createdAt).getTime() : NaN;
      return Number.isFinite(timestamp) && timestamp >= weekAgo;
    })
    .sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0))
    .slice(0, 5);

  const postToFocus = new URLSearchParams(location.search).get('post');
  useEffect(() => {
    if (!postToFocus) return;
    setActiveTab('explore');
    setActiveEcosystem(null);
    setActiveFlair(null);
    setSearchQuery('');
    setAdvancedFilters({ ecosystem: '', flair: '', sortBy: 'recent' });
    setActiveTopic(null);
  }, [postToFocus]);

  useEffect(() => {
    if (!postToFocus || !posts.some(post => post.id === postToFocus)) return;
    const frame = requestAnimationFrame(() => {
      const postElement = document.getElementById(`post-${postToFocus}`);
      if (!postElement) return;
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const params = new URLSearchParams(location.search);
      params.delete('post');
      navigate(
        { pathname: location.pathname, search: params.toString() ? `?${params}` : '' },
        { replace: true }
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [postToFocus, posts, activeTab, activeEcosystem, activeFlair, searchQuery, advancedFilters, activeTopic, location.pathname, location.search, navigate]);

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
              <Bookmark size={20} />
              <div>
                <h2 className="text-lg font-bold text-slate-100">Saved Posts</h2>
                <p className="text-xs text-slate-500">{savedIds.length} post{savedIds.length !== 1 ? 's' : ''} saved · private to you</p>
              </div>
            </div>
          )}

          {/* Quick post bar + search — hidden on personal post views */}
          {!isSavedView && !isMyPostsView && (
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

          {user && (votesError || savedPostsError || pollVotesError) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200" role="status">
              <span>Your vote, poll vote, or saved-post state could not be loaded.</span>
              <span className="flex gap-3">
                {votesError && <button onClick={() => refetchVotes()} className="underline">Retry votes</button>}
                {pollVotesError && <button onClick={() => refetchPollVotes()} className="underline">Retry poll votes</button>}
                {savedPostsError && <button onClick={() => refetchSavedPosts()} className="underline">Retry saved posts</button>}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : postsError ? (
            <div className="text-center py-20" role="alert">
              <p className="text-destructive mb-3">Could not load the feed: {postsErrorDetails?.message || 'Please try again.'}</p>
              <button onClick={() => refetch()} className="text-sm text-primary hover:underline">
                Retry
              </button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3 flex justify-center">{isSavedView ? <Bookmark size={40} /> : <Inbox size={40} />}</div>
              <p className="text-muted-foreground">
                {isSavedView
                  ? 'No saved posts yet — tap the bookmark icon on any post to save it here.'
                  : isMyPostsView
                    ? 'You have not posted yet.'
                    : 'No posts match these filters. Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {filteredPosts.map(post => (
                  <div id={`post-${post.id}`} key={post.id}>
                  <PostCard
                    post={post}
                    userVotes={userVotes}
                    userPollVotes={userPollVotes}
                    savedPosts={savedIds}
                    userEmail={user?.email}
                    userName={user?.full_name || user?.user_metadata?.full_name}
                    isGuest={!user}
                  />
                  </div>
              ))}
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