import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, CornerDownRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/** @type {any} */
const UI = { Textarea, Button, Avatar, AvatarFallback };

// Build tree from flat comment list
function buildTree(comments) {
  const map = {};
  const roots = [];
  for (const c of comments) { map[c.id] = { ...c, children: [] }; }
  for (const c of Object.values(map)) {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

function CommentInput({ placeholder, onSubmit, submitting, autoFocus = false }) {
  const [body, setBody] = useState('');
  return (
    <div className="flex gap-2">
      <UI.Textarea
        value={body}
        autoFocus={autoFocus}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        className="text-sm min-h-[56px] resize-none bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500"
      />
      <UI.Button
        size="sm"
        className="self-end"
        onClick={async () => {
          const submitted = await onSubmit(body);
          if (submitted) setBody('');
        }}
        disabled={!body.trim() || submitting}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
      </UI.Button>
    </div>
  );
}

function CommentNode({ comment, depth, post, userEmail, userName, isGuest, onRequireLogin, onSubmitReply, onDelete, submittingId }) {
  const navigate = useNavigate();
  const [showReply, setShowReply] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const MAX_DEPTH = 4;
  const indent = Math.min(depth, MAX_DEPTH) * 16;

  return (
    <div style={{ marginLeft: indent }}>
      {/* Thread line */}
      <div className="flex gap-2.5">
        {depth > 0 && (
          <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
            <div className="w-px flex-1 bg-slate-700/60 mt-1" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* Avatar + content */}
          <div className="flex gap-2">
            <UI.Avatar className="h-7 w-7 flex-shrink-0 mt-0.5" style={{ overflow: 'hidden' }}>
              {comment.author_avatar_url
                ? <img src={comment.author_avatar_url} alt={comment.author_name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <UI.AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                    {(comment.author_name || 'A').slice(0, 2).toUpperCase()}
                  </UI.AvatarFallback>
              }
            </UI.Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => comment.author_email && navigate(`/user-profile?userId=${encodeURIComponent(comment.author_email)}`)}
                  className="text-xs font-semibold text-slate-300 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  {comment.author_name || 'Anonymous'}
                </button>
                {comment.created_at && (
                  <span className="text-xs text-slate-500">{format(new Date(comment.created_at), 'MMM d')}</span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{comment.body}</p>

              {/* Actions row: Reply + Delete */}
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={() => {
                    if (isGuest) onRequireLogin();
                    else setShowReply(r => !r);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors"
                >
                  <CornerDownRight className="w-3 h-3" />
                  {showReply ? 'Cancel' : 'Reply'}
                  {comment.children?.length > 0 && (
                    <span className="ml-1 text-slate-600">· {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</span>
                  )}
                </button>

                {comment.author_email === userEmail && (
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      await onDelete(comment.id);
                      setDeleting(false);
                    }}
                    disabled={deleting}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </div>

              {/* Inline reply box */}
              {showReply && (
                <div className="mt-2">
                  <CommentInput
                    placeholder={`Reply to ${comment.author_name || 'Anonymous'}…`}
                    autoFocus
                    submitting={submittingId === comment.id}
                    onSubmit={async body => {
                      const submitted = await onSubmitReply(body, comment.id);
                      if (submitted) setShowReply(false);
                      return submitted;
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Nested children */}
          {comment.children?.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.children.map(child => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  depth={depth + 1}
                  post={post}
                  userEmail={userEmail}
                  userName={userName}
                  isGuest={isGuest}
                  onRequireLogin={onRequireLogin}
                  onSubmitReply={onSubmitReply}
                  onDelete={onDelete}
                  submittingId={submittingId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ post, userEmail, userName, isGuest = false, onRequireLogin }) {
  const [submittingId, setSubmittingId] = useState(null); // null = top-level, else parent comment id
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const data = await api.get(`/comments?post_id=${encodeURIComponent(post.id)}`);
      if (!Array.isArray(data)) throw new Error('The comments response was invalid.');
      return data;
    },
  });

  const submitComment = async (body, parentId = null) => {
    if (!body.trim()) return false;
    const trimmedBody = body.trim();
    setSubmittingId(parentId || 'top');
    try {
      await api.post('/comments', {
        post_id: post.id,
        parent_id: parentId || null,
        body: trimmedBody,
      });
    } catch (err) {
      toast.error('Failed to post comment');
      return false;
    } finally {
      setSubmittingId(null);
    }

    queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    return true;
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      toast.success('Comment deleted');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      return true;
    } catch (err) {
      toast.error('Failed to delete comment');
      return false;
    }
  };

  const tree = buildTree(comments);

  return (
    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
      {isGuest ? (
        <button
          type="button"
          onClick={onRequireLogin}
          className="w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-slate-400 hover:border-primary"
        >
          Sign in to join the conversation
        </button>
      ) : (
        <CommentInput
          placeholder="Write a comment…"
          submitting={submittingId === 'top'}
          onSubmit={(body) => submitComment(body, null)}
          autoFocus={false}
        />
      )}

      {/* Comments tree */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-3" role="alert">
          <p className="text-xs text-destructive mb-2">{error?.message || 'Could not load comments.'}</p>
          <button type="button" onClick={() => refetch()} className="text-xs text-primary hover:underline">
            Retry
          </button>
        </div>
      ) : tree.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {tree.map(comment => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              post={post}
              userEmail={userEmail}
              userName={userName}
              isGuest={isGuest}
              onRequireLogin={onRequireLogin}
              onSubmitReply={submitComment}
              onDelete={deleteComment}
              submittingId={submittingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}