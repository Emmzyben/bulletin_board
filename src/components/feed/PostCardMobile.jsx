import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

export default function PostCardMobile({ post, userEmail, isGuest = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const handleVote = async (voteType) => {
    if (isGuest || !userEmail) {
      toast.error('Please sign in to vote');
      return;
    }
    
    try {
      // Basic vote logic for mobile card
      const { error: voteError } = await supabase
        .from('votes')
        .upsert({ 
          post_id: post.id, 
          voter_email: userEmail, 
          vote_type: voteType 
        }, { onConflict: 'post_id,voter_email' });

      if (voteError) throw voteError;

      // Update post counts (simplified for demo/mobile)
      const { error: postError } = await supabase
        .from('posts')
        .update({ 
          upvotes: (post.upvotes || 0) + (voteType === 'up' ? 1 : 0),
          vote_score: (post.vote_score || 0) + (voteType === 'up' ? 1 : -1)
        })
        .eq('id', post.id);

      if (postError) throw postError;

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Vote recorded');
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error('Failed to record vote');
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
          borderRadius: 8, background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(11px, 3vw, 14px)', fontWeight: 800, color: '#fff',
        }}>
          {post.author_name?.[0] || 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', fontWeight: 700, color: '#EEF4FF', marginBottom: 2 }}>
            {post.author_name}
          </div>
          <div style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', color: '#6B93C4' }}>
            {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
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
        <span>👍 {post.upvotes || 0}</span>
        <span>💬 {post.comment_count || 0}</span>
        <span>💾 {post.saves_count || 0}</span>
      </div>

      {/* Actions - Touch-friendly buttons */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'max(8px, 1.5vw)',
      }}>
        {[
          { icon: Heart, label: 'Vote', onClick: () => handleVote('up'), color: '#00C853' },
          { icon: MessageCircle, label: 'Comment', onClick: () => setShowComments(!showComments), color: '#6AADFF' },
          { icon: Bookmark, label: 'Save', onClick: () => {}, color: '#FF8F00' },
        ].map((action, i) => (
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
            <action.icon style={{ width: 'clamp(16px, 4vw, 18px)', height: 'clamp(16px, 4vw, 18px)' }} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}