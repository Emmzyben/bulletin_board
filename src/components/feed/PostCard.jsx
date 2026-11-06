import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown, MessageSquare, Share2, Bookmark, LogIn, UserPlus, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getFlair, getEcosystem } from '@/lib/ecosystems';
import { api } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CommentSection from './CommentSection.jsx';
import PollCard from './PollCard.jsx';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

/** @type {any} */
const UI = { Card, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Avatar, AvatarFallback };

export default function PostCard({ post, userVotes = {}, userPollVotes = {}, savedPosts = [], userEmail, userName, isGuest = false }) {
  const { navigateToLogin } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const flair = getFlair(post.flair);
  const eco = getEcosystem(post.ecosystem);
  const FlairIcon = typeof flair?.icon === 'function' ? flair.icon : null;
  const EcosystemIcon = typeof eco?.icon === 'function' ? eco.icon : null;
  const queryClient = useQueryClient();
  const currentVote = userVotes[post.id];
  const isSaved = savedPosts.includes(post.id);
  const authorEmail = post.author?.email || post.author_email || '';
  const authorName = post.author?.full_name || post.author_name || 'Anonymous';
  const authorAvatar = post.author?.avatar_url || post.author_avatar_url || null;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const requireLogin = () => { setShowLoginDialog(true); };

  const handleVote = async (type) => {
    if (isGuest) { requireLogin(); return; }
    if (currentVote === type) return;

    try {
      await api.put(`/posts/${post.id}/vote`, { vote_type: type });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['votes'] });
    } catch (error) {
      toast.error('Failed to update vote count');
    }
  };

  const handleSave = async () => {
    if (isGuest) { requireLogin(); return; }
    try {
      if (isSaved) {
        await api.delete(`/saved-posts/${post.id}`);
        toast.success('Removed from saved');
      } else {
        await api.post(`/saved-posts`, { post_id: post.id });
        toast.success('Post saved');
      }
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    } catch (error) {
      toast.error('Failed to update saved posts');
    }
  };

  useEffect(() => {
    if (!authorEmail || !userEmail || authorEmail === userEmail) return;
    let active = true;

    const fetchFollowStatus = async () => {
      try {
        const data = await api.get(`/users/${encodeURIComponent(authorEmail)}/follow-status`);
        if (!active) return;
        setIsFollowing(data.is_following);
      } catch (error) {
        console.error('Failed to fetch follow status', error);
      }
    };

    fetchFollowStatus();
    return () => { active = false; };
  }, [authorEmail, userEmail]);

  const handleFollowToggle = async () => {
    if (isGuest) { requireLogin(); return; }
    if (!authorEmail || authorEmail === userEmail) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${encodeURIComponent(authorEmail)}/follow`);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await api.post(`/users/${encodeURIComponent(authorEmail)}/follow`);
        setIsFollowing(true);
        toast.success('Following');
      }
    } catch (error) {
      console.error('Follow request failed', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const postUrl = window.location.origin + '/?post=' + post.id;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(postUrl).then(() => toast.success('Link copied!'));
    } else {
      toast.success('Link: ' + postUrl);
    }
    setShowShare(false);
  };

  const shouldTruncate = post.body && post.body.length > 200;
  const displayBody = shouldTruncate && !expanded ? post.body.slice(0, 200) + '...' : post.body;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <UI.Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <UI.DialogContent className="sm:max-w-sm text-center">
          <UI.DialogHeader>
            <UI.DialogTitle className="text-xl">Join Bulletin Board</UI.DialogTitle>
            <UI.DialogDescription className="text-sm text-muted-foreground mt-1">
              Sign in or create a free account to post, comment, vote, save and more.
            </UI.DialogDescription>
          </UI.DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <UI.Button className="w-full gap-2" onClick={() => navigateToLogin()}>
              <LogIn className="w-4 h-4" /> Sign In
            </UI.Button>
            <UI.Button variant="outline" className="w-full gap-2" onClick={() => navigate('/signup')}>
              <UserPlus className="w-4 h-4" /> Join Free
            </UI.Button>
            <UI.Button variant="ghost" className="w-full text-sm" onClick={() => setShowLoginDialog(false)}>
              Continue Browsing
            </UI.Button>
          </div>
        </UI.DialogContent>
      </UI.Dialog>
      <UI.Card className={`overflow-hidden hover:shadow-sm transition-all border-l-4 border-l-primary ${isDark ? '!bg-slate-950/60 border-slate-800' : '!bg-white border-slate-200'}`}>
        <div className="flex-1 p-4">
            <div className="flex flex-col gap-3 mb-3">
              <div className="flex items-start gap-3">
                <UI.Avatar className="h-10 w-10 flex-shrink-0 overflow-hidden">
                  {authorAvatar ? (
                    <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                  ) : (
                    <UI.AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                      {authorName.slice(0, 2).toUpperCase()}
                    </UI.AvatarFallback>
                  )}
                </UI.Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => authorEmail && navigate(`/user-profile?userId=${encodeURIComponent(authorEmail)}`)}
                      className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                    >
                      {authorName}
                    </button>
                    {authorEmail && authorEmail !== userEmail && (
                      <UI.Button
                        variant={isFollowing ? 'secondary' : 'default'}
                        size="sm"
                        className="text-xs h-8 px-3 rounded"
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                      >
                        {isFollowing ? 'Following' : '+ Follow'}
                      </UI.Button>
                    )}
                  </div>
                  {(post.created_at || post.createdAt) && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(post.created_at || post.createdAt), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <UI.Badge variant="default" className={`${flair.color} text-white text-xs font-medium flex items-center gap-1`}>
                  {FlairIcon ? <FlairIcon size={14} /> : null} {flair.label}
                </UI.Badge>
                <UI.Badge variant="outline" className={`text-xs ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'} flex items-center gap-1`}>
                  {EcosystemIcon ? <EcosystemIcon size={14} /> : null} {eco.label}
                </UI.Badge>
              </div>
            </div>

            <h3 className="font-bold text-base mb-2.5 leading-snug text-foreground hover:text-primary transition-colors cursor-pointer">{post.title}</h3>

            {displayBody && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{displayBody}</p>
            )}
            {shouldTruncate && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary font-medium hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}

            {post.image_url && (
              <img src={post.image_url} alt={post.title || 'Post image'} className="rounded-lg mt-3 max-h-72 object-cover w-full" />
            )}

            {post.flair === 'poll' && (
              <PollCard
                post={post}
                userEmail={userEmail}
                isGuest={isGuest}
                myVote={userPollVotes[post.id]}
                onRequireLogin={requireLogin}
              />
            )}

            {/* Actions */}
            <div className={`flex items-center gap-4 mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <UI.Button
                variant="ghost"
                size="sm"
                className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${currentVote === 'up' ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => isGuest ? requireLogin() : handleVote('up')}
              >
                <ChevronUp className="w-4 h-4 mr-1.5" /> Upvote
              </UI.Button>

              <UI.Button
                variant="ghost"
                size="sm"
                className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${currentVote === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}
                onClick={() => isGuest ? requireLogin() : handleVote('down')}
              >
                <ChevronDown className="w-4 h-4 mr-1.5" /> Downvote
              </UI.Button>

              <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
                <span className={`${(post.upvotes || 0) > 0 ? 'text-primary' : isDark ? 'text-slate-300' : 'text-slate-500'} flex items-center gap-1`}>
                  <ThumbsUp className="w-4 h-4" /> {post.upvotes || 0}
                </span>
                <span className={`${(post.downvotes || 0) > 0 ? 'text-destructive' : isDark ? 'text-slate-300' : 'text-slate-500'} flex items-center gap-1`}>
                  <ThumbsDown className="w-4 h-4" /> {post.downvotes || 0}
                </span>
              </div>

              <UI.Button
                variant="ghost" size="sm"
                className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${showComments ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" /> {post.comment_count || 0}
              </UI.Button>
              <UI.Button variant="ghost" size="sm" className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${showShare ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setShowShare(!showShare)}>
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </UI.Button>

              <UI.Button
                variant="ghost"
                size="sm"
                className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${isSaved ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={handleSave}
              >
                <Bookmark className={`w-4 h-4 mr-1.5 ${isSaved ? 'fill-primary' : ''}`} /> Save
              </UI.Button>
            </div>

            {/* Share Row */}
            {showShare && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Share:</span>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black text-white hover:bg-black/80 transition-colors"
                >
                  𝕏 Twitter
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#0077B5] text-white hover:bg-[#0077B5]/80 transition-colors"
                >
                  in LinkedIn
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + postUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-[#25D366] text-white hover:bg-[#25D366]/80 transition-colors"
                >
                  💬 WhatsApp
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                >
                  🔗 Copy Link
                </button>
              </div>
            )}

            {/* Comment Section */}
            {showComments && (
              <CommentSection
                post={post}
                userEmail={userEmail}
                userName={userName}
                isGuest={isGuest}
                onRequireLogin={requireLogin}
              />
            )}
          </div>
      </UI.Card>
    </motion.div>
  );
}