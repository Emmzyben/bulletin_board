import React, { useState } from 'react';
import { api } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { Smile } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '🎉', '👏', '💯'];

export default function EmojiReactions({ postId, commentId, reactions = [], userEmail, isGuest }) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const handleReact = async (emoji) => {
    if (isGuest || !userEmail) return;
    
    const existing = reactions.find(r => r.emoji === emoji && r.users?.includes(userEmail));
    
    try {
      await api.post('/reactions/toggle', {
        emoji,
        post_id: postId,
        comment_id: commentId
      });
      
      queryClient.invalidateQueries({ queryKey: ['reactions', postId, commentId] });
      setShowPicker(false);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
            r.users?.includes(userEmail)
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-transparent'
          }`}
        >
          {r.emoji} {r.users?.length || 0}
        </button>
      ))}
      
      {!isGuest && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <Smile className="w-4 h-4" />
          </button>
          {showPicker && (
            <div className="absolute bottom-full mb-2 left-0 bg-slate-900 border border-slate-800 rounded-lg p-2 flex gap-1 shadow-lg z-10 animate-in fade-in zoom-in duration-200">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="text-lg hover:scale-125 transition-transform cursor-pointer p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}