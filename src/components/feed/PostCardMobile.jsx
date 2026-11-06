import React, { useState } from 'react';
import { api } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Bookmark, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import CommentSection from './CommentSection';
import PollCard from './PollCard';

export default function PostCardMobile({ post, userEmail, savedPosts = [], myPollVote, isGuest = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();
  const authorName = post.author?.full_name || post.author_name || 'Anonymous';
  const authorAvatar = post.author?.avatar_url || post.author_avatar_url || null;
  const isSaved = savedPosts.includes(post.id);

  const handleVote = async (voteType) => {
    if (isGuest || !userEmail) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      // Basic vote logic for mobile card
      await api.put(`/posts/${post.id}/vote`, { vote_type: voteType });

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Vote recorded');
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleSave = async () => {
    if (isGuest || !userEmail) {
      toast.error('Please sign in to save posts');
      return;
    }
    try {
      if (isSaved) {
        await api.delete(`/saved-posts/${post.id}`);
        toast.success('Post removed from saved');
      } else {
        await api.post('/saved-posts', { post_id: post.id });
        toast.success('Post saved');
      }
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (error) {
      console.error('Save post failed:', error);
      toast.error('Failed to update saved posts');
    }
  };

  const maxBodyLength = 150;
  const isLongBody = post.body?.length > maxBodyLength;
  const displayBody = expanded ? post.body : post.body?.substring(0, maxBodyLength) + (isLongBody ? '...' : '');

  return (
    <div style={{
      background: '#132340', border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 12, padding: 'max(14px, 3vw)', marginBottom: 'max(12px, 2vh)',
      transition: '.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'max(10px, 2vw)', marginBottom: 'max(10px, 2vh)' }}>
        <div style={{
          width: 'max(36px, 8vw)', height: 'max(36px, 8vw)', minWidth: 'max(36px, 8vw)',
          borderRadius: 9999, overflow: 'hidden', background: authorAvatar ? 'transparent' : 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 800, color: '#fff',
        }}>
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>{authorName.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 700, color: '#EEF4FF', marginBottom: 2 }}>
            {authorName}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#6B93C4' }}>
            {(post.created_at || post.createdAt) ? new Date(post.created_at || post.createdAt).toLocaleDateString() : 'Just now'}
          </div>
        </div>
        <div style={{
          display: 'inline-block', padding: 'max(4px, 0.8vw) max(6px, 1.2vw)',
          borderRadius: 6, background: 'rgba(27,110,243,.15)', fontSize: 'clamp(10px, 2vw, 12px)',
          fontWeight: 600, color: '#6AADFF',
        }}>
          {post.flair}
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 700, color: '#EEF4FF',
        marginBottom: 'max(8px, 1.5vh)', lineHeight: 1.3,
      }}>
        {post.title}
      </h3>

      {/* Body */}
      {post.body && (
        <p style={{
          fontSize: 'clamp(13px, 3vw, 15px)', color: '#6B93C4', lineHeight: 1.5,
          marginBottom: 'max(8px, 1.5vh)',
        }}>
          {displayBody}
        </p>
      )}

      {isLongBody && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none', border: 'none', color: '#1B6EF3', cursor: 'pointer',
            fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 600, marginBottom: 'max(10px, 2vh)',
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          style={{
            width: '100%', borderRadius: 8, marginBottom: 'max(10px, 2vh)',
            maxHeight: '200px', objectFit: 'cover',
          }}
        />
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 'max(12px, 2vw)', fontSize: 'clamp(12px, 2.5vw, 13px)',
        color: '#6B93C4', marginBottom: 'max(10px, 2vh)', paddingBottom: 'max(10px, 1.5vh)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ThumbsUp style={{ width: 14, height: 14 }} />{post.upvotes || 0}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ThumbsDown style={{ width: 14, height: 14 }} />{post.downvotes || 0}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>💬 {post.comment_count || 0}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>🔖 {post.saves_count || 0}</span>
      </div>

      {post.flair === 'poll' && (
        <PollCard
          post={post}
          userEmail={userEmail}
          isGuest={isGuest}
          myVote={myPollVote}
          onRequireLogin={() => toast.error('Please sign in to vote')}
        />
      )}

      {/* Actions - Touch-friendly buttons */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'max(8px, 1.5vw)',
      }}>
        {[
          { icon: Heart, label: 'Vote', onClick: () => handleVote('up'), color: '#00C853' },
          { icon: MessageCircle, label: 'Comment', onClick: () => setShowComments(!showComments), color: '#6AADFF' },
          { icon: Bookmark, label: isSaved ? 'Saved' : 'Save', onClick: handleSave, color: '#FF8F00' },
        ].map((action, i) => {
          const ActionIcon = action.icon;
          return (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                height: 'max(40px, 10vw)', minHeight: 44, border: 'none',
                background: 'rgba(255,255,255,.05)', borderRadius: 8, color: action.color,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4, fontSize: 'clamp(10px, 2vw, 11px)', fontWeight: 600,
                transition: '.15s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
            >
              <ActionIcon style={{ width: 'clamp(16px, 4vw, 18px)', height: 'clamp(16px, 4vw, 18px)' }} />
              {action.label}
            </button>
          );
        })}
      </div>
      {showComments && (
        <CommentSection
          post={post}
          userEmail={userEmail}
          userName={post.author?.full_name || post.author_name}
          isGuest={isGuest}
          onRequireLogin={() => toast.error('Please sign in to comment')}
        />
      )}
    </div>
  );
}