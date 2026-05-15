import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, MessageSquare, Share2, Trophy, Bookmark, LogIn, UserPlus } from 'lucide-react';
import { getFlair, getEcosystem } from '@/lib/ecosystems';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CommentSection from './CommentSection.jsx';
import { useNavigate } from 'react-router-dom';
import EmojiReactions from './EmojiReactions';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

/** @type {any} */
const UI = { Card, Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };

export default function PostCard({ post, userVotes = {}, savedPosts = [], userEmail, userName, isGuest = false }) {
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
  const queryClient = useQueryClient();
  const currentVote = userVotes[post.id];
  const isSaved = savedPosts.includes(post.id);

  const { data: reactions = [] } = useQuery({
    queryKey: ['reactions', post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select('*')
        .eq('post_id', post.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, r) => {
    const existing = acc.find(x => x.emoji === r.emoji);
    if (existing) {
      existing.users = [...(existing.users || []), r.user_email];
    } else {
      acc.push({ emoji: r.emoji, users: [r.user_email] });
    }
    return acc;
  }, []);

  const requireLogin = () => { setShowLoginDialog(true); };

  const handleVote = async (type) => {
    if (isGuest) { requireLogin(); return; }
    if (currentVote === type) return;

    const newUpvotes = type === 'up' ? (post.upvotes || 0) + 1 : (currentVote === 'up' ? (post.upvotes || 0) - 1 : post.upvotes || 0);
    const newDownvotes = type === 'down' ? (post.downvotes || 0) + 1 : (currentVote === 'down' ? (post.downvotes || 0) - 1 : post.downvotes || 0);

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        vote_score: newUpvotes - newDownvotes,
      })
      .eq('id', post.id);

    if (updateError) {
      toast.error('Failed to update vote count');
      return;
    }

    if (currentVote) {
      const { error: voteUpdateError } = await supabase
        .from('votes')
        .update({ vote_type: type })
        .eq('post_id', post.id)
        .eq('voter_email', userEmail);
      
      if (voteUpdateError) toast.error('Failed to update vote');
    } else {
      const { error: voteCreateError } = await supabase
        .from('votes')
        .insert({ post_id: post.id, voter_email: userEmail, vote_type: type });
      
      if (voteCreateError) {
        toast.error('Failed to record vote');
      } else if (type === 'up' && post.author_email && post.author_email !== userEmail) {
        // Notify post author on upvote (not self)
        await supabase.from('notifications').insert({
          recipient_email: post.author_email,
          type: 'mention',
          sender_email: userEmail,
          sender_name: userName || userEmail?.split('@')[0],
          title: '👍 Your post was upvoted',
          message: `"${post.title.slice(0, 80)}"`,
          post_id: post.id,
          read: false,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['votes'] });
  };

  const handleSave = async () => {
    if (isGuest) { requireLogin(); return; }
    if (isSaved) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('post_id', post.id)
        .eq('user_email', userEmail);
      if (error) toast.error('Failed to remove from saved');
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ post_id: post.id, user_email: userEmail });
      if (error) toast.error('Failed to save post');
    }
    queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    toast.success(isSaved ? 'Removed from saved' : 'Post saved');
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
        <div className="flex">
          {/* Vote column */}
          <div className={`flex flex-col items-center gap-0.5 p-3 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
            <button
              onClick={() => handleVote('up')}
              className={`p-1 rounded hover:bg-blue-100 transition-colors ${currentVote === 'up' ? 'text-primary' : isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <span className={`text-sm font-bold text-center ${(post.vote_score || 0) > 0 ? 'text-primary' : (post.vote_score || 0) < 0 ? 'text-destructive' : isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {post.vote_score || 0}
            </span>
            <button
              onClick={() => handleVote('down')}
              className={`p-1 rounded hover:bg-red-100 transition-colors ${currentVote === 'down' ? 'text-destructive' : isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <UI.Badge variant="default" className={`${flair.color} text-white text-xs font-medium`}>
                {flair.icon} {flair.label}
              </UI.Badge>
              <UI.Badge variant="outline" className={`text-xs ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-300 text-slate-600'}`}>
                {eco.icon} {eco.label}
              </UI.Badge>
              <span className="text-xs text-muted-foreground">
                Posted by{' '}
                <button
                  onClick={() => post.author_email && navigate(`/user-profile?email=${encodeURIComponent(post.author_email)}`)}
                  className="font-semibold hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0 text-foreground"
                >
                  {post.author_name || 'Anonymous'}
                </button>
              </span>
              {post.created_at && (
                <span className="text-xs text-muted-foreground" title={format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              )}
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
              <img src={post.image_url} alt="" className="rounded-lg mt-3 max-h-72 object-cover w-full" />
            )}

            {post.flair === 'poll' && post.poll_options && (
              <div className="mt-3 space-y-2">
                {post.poll_options.map((opt, i) => {
                  const totalVotes = post.poll_options.reduce((s, o) => s + (o.votes || 0), 0);
                  const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  return (
                    <div key={i} className="relative bg-secondary rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-primary/10 rounded-lg" style={{ width: `${pct}%` }} />
                      <div className="relative px-3 py-2 flex justify-between text-sm">
                        <span>{opt.text}</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Emoji Reactions */}
            <EmojiReactions 
              postId={post.id} 
              commentId={null}
              reactions={groupedReactions} 
              userEmail={userEmail} 
              isGuest={isGuest}
            />

            {/* Actions */}
            <div className={`flex items-center gap-4 mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <UI.Button
                variant="ghost" size="sm"
                className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${showComments && !isGuest ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => isGuest ? requireLogin() : setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" /> {post.comment_count || 0}
              </UI.Button>
              <UI.Button variant="ghost" size="sm" className={`text-xs h-8 px-2 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} ${showShare ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => isGuest ? requireLogin() : setShowShare(!showShare)}>
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </UI.Button>
              <UI.Button variant="ghost" size="sm" className={`text-xs h-8 px-2 rounded text-muted-foreground ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`} onClick={() => isGuest ? requireLogin() : toast.info('Awards coming soon!')}>
                <Trophy className="w-4 h-4 mr-1.5" /> Award
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
            {showComments && !isGuest && (
              <CommentSection post={post} userEmail={userEmail} userName={userName} />
            )}
          </div>
        </div>
      </UI.Card>
    </motion.div>
  );
}