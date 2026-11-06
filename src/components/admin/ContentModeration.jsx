import React, { useState } from 'react';
import { api } from '@/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Ban, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentModeration({ workspace }) {
  const [filter, setFilter] = useState('open');
  const [selectedPost, setSelectedPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading: loadingPosts, isError: postsError, error: postsErrorDetails, refetch: refetchPosts } = useQuery({
    queryKey: ['moderation-posts', workspace?.id],
    queryFn: () => api.get('/posts?limit=100'),
  });

  const { data: reports = [], isLoading: loadingReports, isError: reportsError, error: reportsErrorDetails, refetch: refetchReports } = useQuery({
    queryKey: ['moderation-reports', filter],
    queryFn: () => api.get(`/admin/reports?status=${filter}`),
  });

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this post?')) {
      try {
        await api.delete(`/admin/posts/${postId}`);
        queryClient.invalidateQueries({ queryKey: ['moderation-posts'] });
        toast.success('Post deleted');
        setSelectedPost(null);
      } catch (error) {
        console.error('Delete failed:', error);
        toast.error('Failed to delete post');
      }
    }
  };

  const handleBanUser = async (userEmail, reportId) => {
    if (window.confirm(`Suspend user ${userEmail}?`)) {
      try {
        await api.put(`/admin/users/${encodeURIComponent(userEmail)}`, { status: 'banned' });
        if (reportId) await api.put(`/admin/reports/${reportId}`, { status: 'reviewed' });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
        queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
        queryClient.invalidateQueries({ queryKey: ['moderation-posts'] });
        toast.success('User suspended and report reviewed');
      } catch (error) {
        console.error('Ban failed:', error);
        toast.error('Failed to ban user');
      }
    }
  };

  const updateReport = async (reportId, status) => {
    try {
      await api.put(`/admin/reports/${reportId}`, { status });
      await queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success(status === 'reviewed' ? 'Report marked reviewed' : 'Report dismissed');
    } catch (error) {
      toast.error(error.message || 'Failed to update report');
    }
  };
  const isLoading = loadingPosts || loadingReports;

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#EEF4FF', marginBottom: 24 }}>Content Moderation</h3>

      {(postsError || reportsError) && (
        <div role="alert" style={{ marginBottom: 16, padding: 14, border: '1px solid rgba(239,83,80,.3)', borderRadius: 9, color: '#EF8A80' }}>
          <div>{reportsError ? `Reports: ${reportsErrorDetails.message}` : `Posts: ${postsErrorDetails.message}`}</div>
          <button onClick={() => { if (reportsError) refetchReports(); if (postsError) refetchPosts(); }} style={{ marginTop: 8, color: '#6AADFF', background: 'none', border: 0, cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      <section style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>User reports</h4>
          <p style={{ fontSize: 12, color: '#6B93C4', marginTop: 4 }}>Reports submitted by users are stored for review.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
          {['open', 'all'].map(status => (
            <button key={status} onClick={() => setFilter(status)} style={{
              padding: '7px 12px', borderRadius: 7, border: `1px solid ${filter === status ? '#1B6EF3' : 'rgba(255,255,255,.15)'}`,
              background: filter === status ? 'rgba(27,110,243,.15)' : 'transparent',
              color: filter === status ? '#6AADFF' : '#7FA8D4', cursor: 'pointer', textTransform: 'capitalize',
            }}>{status === 'open' ? 'Open reports' : 'All reports'}</button>
          ))}
        </div>
        {isLoading ? (
          <div role="status" style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Loader2 className="animate-spin" /></div>
        ) : reports.length ? (
          <div>
            {reports.map(report => (
              <div key={report.id} style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#EEF4FF', fontSize: 13, fontWeight: 700 }}>
                    {report.target?.full_name || report.target_email}
                    <span style={{ color: '#6B93C4', fontWeight: 400 }}> · reported by {report.reporter?.email || report.reporter_email}</span>
                  </div>
                  <div style={{ marginTop: 4, color: '#BBD4F0', fontSize: 12 }}>{report.reason || 'No reason provided'}</div>
                  <div style={{ marginTop: 4, color: '#6B93C4', fontSize: 11 }}>
                    {new Date(report.createdAt).toLocaleString()} · {report.status}
                  </div>
                </div>
                {report.status === 'open' && (
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={() => handleBanUser(report.target_email, report.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.25)', borderRadius: 7, color: '#EF8A80', cursor: 'pointer' }}>
                      <Ban size={13} /> Suspend user
                    </button>
                    <button onClick={() => updateReport(report.id, 'reviewed')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 10px', background: 'rgba(0,200,83,.1)', border: '1px solid rgba(0,200,83,.2)', borderRadius: 7, color: '#00C853', cursor: 'pointer' }}>
                      <Check size={13} /> Review
                    </button>
                    <button onClick={() => updateReport(report.id, 'dismissed')} style={{ padding: '7px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 7, color: '#BBD4F0', cursor: 'pointer' }}>Dismiss</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <div style={{ padding: 24, textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>No {filter === 'open' ? 'open ' : ''}reports.</div>}
      </section>

      {/* Posts */}
      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF', marginBottom: 12 }}>Recent posts</h4>
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><Loader2 className="animate-spin" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
          {posts.slice(0, 20).map(p => (
            <div
              key={p.id}
              onClick={() => setSelectedPost(p)}
              style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: 14, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF', marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 11, color: '#6B93C4' }}>by {p.author_name || p.author_email || 'Anonymous'}</div>
              <div style={{ fontSize: 12, color: '#6B93C4', marginTop: 8 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recently created'}</div>
            </div>
          ))}
          {posts.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#6B93C4' }}>No posts to moderate.</div>}
        </div>
      )}

      {/* Selected post actions */}
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

    </div>
  );
}