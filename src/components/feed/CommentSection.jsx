import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, CornerDownRight } from 'lucide-react';
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
        onClick={() => { onSubmit(body); setBody(''); }}
        disabled={!body.trim() || submitting}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
      </UI.Button>
    </div>
  );
}

function CommentNode({ comment, depth, post, userEmail, userName, onSubmitReply, submittingId }) {
  const navigate = useNavigate();
  const [showReply, setShowReply] = useState(false);
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
            <UI.Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
              <UI.AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                {(comment.author_name || 'A').slice(0, 2).toUpperCase()}
              </UI.AvatarFallback>
            </UI.Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => comment.author_email && navigate(`/user-profile?email=${encodeURIComponent(comment.author_email)}`)}
                  className="text-xs font-semibold text-slate-300 hover:text-primary transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  {comment.author_name || 'Anonymous'}
                </button>
                {comment.created_at && (
                  <span className="text-xs text-slate-500">{format(new Date(comment.created_at), 'MMM d')}</span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{comment.body}</p>

              {/* Reply button */}
              <button
                onClick={() => setShowReply(r => !r)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary mt-1.5 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                {showReply ? 'Cancel' : 'Reply'}
                {comment.children?.length > 0 && (
                  <span className="ml-1 text-slate-600">· {comment.children.length} {comment.children.length === 1 ? 'reply' : 'replies'}</span>
                )}
              </button>

              {/* Inline reply box */}
              {showReply && (
                <div className="mt-2">
                  <CommentInput
                    placeholder={`Reply to ${comment.author_name || 'Anonymous'}…`}
                    autoFocus
                    submitting={submittingId === comment.id}
                    onSubmit={(body) => {
                      onSubmitReply(body, comment.id);
                      setShowReply(false);
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
                  onSubmitReply={onSubmitReply}
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

export default function CommentSection({ post, userEmail, userName }) {
  const [submittingId, setSubmittingId] = useState(null); // null = top-level, else parent comment id
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const submitComment = async (body, parentId = null) => {
    if (!body.trim()) return;
    const trimmedBody = body.trim();
    setSubmittingId(parentId || 'top');

    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        parent_id: parentId || null,
        author_email: userEmail,
        author_name: userName || 'Anonymous',
        body: trimmedBody,
      })
      .select()
      .single();

    if (commentError) {
      toast.error('Failed to post comment');
      setSubmittingId(null);
      return;
    }

    // Only increment count for top-level comments
    if (!parentId) {
      await supabase
        .from('posts')
        .update({ comment_count: (post.comment_count || 0) + 1 })
        .eq('id', post.id);
    }

    // Notify post author on new top-level comment
    if (!parentId && post.author_email && post.author_email !== userEmail) {
      await supabase.from('notifications').insert({
        recipient_email: post.author_email,
        type: 'mention',
        sender_email: userEmail,
        sender_name: userName || userEmail?.split('@')[0],
        title: '💬 New comment on your post',
        message: `${userName || 'Someone'} commented: "${trimmedBody.slice(0, 80)}"`,
        post_id: post.id,
        read: false,
      });
    }

    // Notify parent comment author on reply
    if (parentId) {
      const parent = comments.find(c => c.id === parentId);
      if (parent?.author_email && parent.author_email !== userEmail) {
        await supabase.from('notifications').insert({
          recipient_email: parent.author_email,
          type: 'mention',
          sender_email: userEmail,
          sender_name: userName || userEmail?.split('@')[0],
          title: '↩️ Someone replied to your comment',
          message: `${userName || 'Someone'} replied: "${trimmedBody.slice(0, 80)}"`,
          post_id: post.id,
          read: false,
        });
      }
    }

    // Detect @mentions
    const mentionMatches = trimmedBody.match(/@(\S+)/g);
    if (mentionMatches) {
      const mentionedHandles = [...new Set(mentionMatches.map(m => m.slice(1).toLowerCase()))];
      const { data: allUsers } = await supabase.from('users').select('email, primary_ecosystem'); // Simplified select
      
      if (allUsers) {
        for (const handle of mentionedHandles) {
          const mentioned = allUsers.find(u =>
            u.email?.split('@')[0].toLowerCase() === handle
          );
          if (mentioned && mentioned.email !== userEmail) {
            await supabase.from('notifications').insert({
              recipient_email: mentioned.email,
              type: 'mention',
              sender_email: userEmail,
              sender_name: userName || userEmail?.split('@')[0],
              title: '🏷️ You were mentioned',
              message: `${userName || 'Someone'} mentioned you: "${trimmedBody.slice(0, 80)}"`,
              post_id: post.id,
              read: false,
            });
          }
        }
      }
    }

    setSubmittingId(null);
    queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const tree = buildTree(comments);

  return (
    <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
      {/* Top-level comment input */}
      <CommentInput
        placeholder="Write a comment…"
        submitting={submittingId === 'top'}
        onSubmit={(body) => submitComment(body, null)}
        autoFocus={false}
      />

      {/* Comments tree */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : tree.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
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
              onSubmitReply={submitComment}
              submittingId={submittingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}