import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Flag, Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentModeration({ workspace }) {
  const [filter, setFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['moderation-posts', workspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: channels = [], isLoading: loadingChannels } = useQuery({
    queryKey: ['moderation-channels', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', workspace.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!workspace?.id,
  });

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this post?')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);
        
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['moderation-posts'] });
        toast.success('Post deleted');
        setSelectedPost(null);
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete post');
      }
    }
  };

  const handleBanUser = async (userEmail) => {
    if (window.confirm(`Ban user ${userEmail}?`)) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ role: 'banned' })
          .eq('email', userEmail);
          
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ['moderation-posts'] });
        toast.success('User banned');
      } catch (error) {
        console.error('Ban failed:', error);
        toast.error('Failed to ban user');
      }
    }
  };

  const flaggedPosts = posts.filter(p => p.flagged);
  const displayPosts = filter === 'flagged' ? flaggedPosts : posts;
  const isLoading = loadingPosts || loadingChannels;

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 24 }}>Content Moderation</h3>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'flagged'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              background: filter === f ? '#1B6EF3' : 'transparent',
              borderColor: filter === f ? '#1B6EF3' : 'rgba(255,255,255,.15)',
              color: filter === f ? '#fff' : '#7FA8D4',
              transition: '.2s'
            }}
          >
            {f === 'flagged' && `🚩 Flagged (${flaggedPosts.length})`}
            {f === 'all' && `All Posts (${posts.length})`}
          </button>
        ))}
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
          {displayPosts.slice(0, 20).map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPost(p)}
              style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10,
                padding: '14px', cursor: 'pointer', transition: '.15s',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(27,110,243,.5)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#6B93C4' }}>by {p.author_name || 'Anonymous'}</div>
                </div>
                {p.flagged && <Flag style={{ width: 16, height: 16, color: '#FF8F00', flexShrink: 0 }} />}
              </div>
              <div style={{ fontSize: 12, color: '#6B93C4', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {p.body}
              </div>
              <div style={{ fontSize: 10, color: '#2E4D6E' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Just now'}</div>
            </div>
          ))}
          {displayPosts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6B93C4', fontSize: 13 }}>No posts to moderate.</div>
          )}
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#0E1828', border: '1px solid rgba(255,255,255,.11)', borderRadius: 14,
            padding: '24px', maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 50px rgba(0,0,0,.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#EEF4FF' }}>Review Post</h4>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 8 }}>{selectedPost.title}</div>
              <div style={{ fontSize: 13, color: '#7FA8D4', lineHeight: 1.6, marginBottom: 12 }}>{selectedPost.body}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: '#6B93C4', marginBottom: 12 }}>
                <span>{selectedPost.author_name || 'Anonymous'}</span>
                <span>•</span>
                <span>{selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString() : 'Just now'}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(239,83,80,.15)', border: '1px solid rgba(239,83,80,.3)', color: '#EF5350',
                  fontWeight: 600, cursor: 'pointer', fontSize: 12, transition: '.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,83,80,.25)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(239,83,80,.15)'}
              >
                <Trash2 style={{ width: 14, height: 14 }} /> Delete Post
              </button>
              <button
                onClick={() => handleBanUser(selectedPost.author_email)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,152,0,.15)', border: '1px solid rgba(255,152,0,.3)', color: '#FF8F00',
                  fontWeight: 600, cursor: 'pointer', fontSize: 12, transition: '.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,152,0,.25)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,152,0,.15)'}
              >
                <Ban style={{ width: 14, height: 14 }} /> Ban User
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                style={{
                  padding: '10px 14px', borderRadius: 8, background: 'transparent',
                  border: '1px solid rgba(255,255,255,.15)', color: '#7FA8D4',
                  fontWeight: 600, cursor: 'pointer', fontSize: 12, transition: '.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation channels */}
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: '16px' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 12 }}>Moderation Channels</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {channels.map(ch => (
            <div key={ch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,.05)' }}>
              <div style={{ fontSize: 12, color: '#EEF4FF', fontWeight: 600 }}>#{ch.name}</div>
              <button style={{ background: 'none', border: 'none', color: '#6AADFF', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Manage</button>
            </div>
          ))}
          {channels.length === 0 && (
            <div style={{ fontSize: 12, color: '#6B93C4', textAlign: 'center', padding: '10px' }}>No moderation channels configured.</div>
          )}
        </div>
      </div>
    </div>
  );
}