import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Smile, X, Check, Clock } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const PRESET_STATUSES = [
  { emoji: '🗓️', text: 'In a meeting' },
  { emoji: '🍔', text: 'Out for lunch' },
  { emoji: '🌴', text: 'On vacation' },
  { emoji: '💻', text: 'Working remotely' },
  { emoji: '🎯', text: 'Focusing' },
  { emoji: '🤒', text: 'Feeling unwell' },
  { emoji: '☕', text: 'Taking a coffee break' },
];

export default function StatusModal({ open, onClose, user, onStatusUpdated }) {
  const [statusText, setStatusText] = useState(user?.status_text || '');
  const [statusEmoji, setStatusEmoji] = useState(user?.status_emoji || '💬');
  const [saving, setSaving] = useState(false);
  const [showEmojiGrid, setShowEmojiGrid] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setStatusText(user?.status_text || '');
      setStatusEmoji(user?.status_emoji || '💬');
      setShowEmojiGrid(false);
    }
  }, [open, user]);

  const handleSave = async (emojiToSave = statusEmoji, textToSave = statusText) => {
    setSaving(true);
    try {
      await api.put('/users/profile', {
        status_text: textToSave.trim() || null,
        status_emoji: textToSave.trim() ? emojiToSave : null,
      });
      toast.success(textToSave.trim() ? 'Status updated' : 'Status cleared');
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      onStatusUpdated?.({
        status_text: textToSave.trim() || null,
        status_emoji: textToSave.trim() ? emojiToSave : null,
      });
      onClose();
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setStatusText('');
    setStatusEmoji('💬');
    handleSave('💬', '');
  };

  const commonEmojis = ['💬', '🗓️', '🍔', '🌴', '💻', '🎯', '🤒', '☕', '🚀', '🎧', '⚡', '💡', '🎉', '✈️', '🏠'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0F1B2E] border border-blue-500/20 text-[#EEF4FF] rounded-xl p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#EEF4FF]">Set a status</DialogTitle>
        </DialogHeader>

        {/* Input area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9 }}>
          <button
            type="button"
            onClick={() => setShowEmojiGrid(!showEmojiGrid)}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            title="Choose emoji"
          >
            {statusEmoji}
          </button>
          <input
            value={statusText}
            onChange={e => setStatusText(e.target.value)}
            placeholder="What's your status?"
            maxLength={100}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 14, color: '#EEF4FF', fontFamily: 'inherit',
            }}
          />
          {statusText && (
            <button
              onClick={() => { setStatusText(''); setStatusEmoji('💬'); }}
              style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', padding: 2 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Emoji Selector grid */}
        {showEmojiGrid && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10,
            background: 'rgba(0,0,0,.3)', borderRadius: 8, marginTop: 8,
          }}>
            {commonEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => { setStatusEmoji(emoji); setShowEmojiGrid(false); }}
                style={{
                  fontSize: 18, padding: 6, background: statusEmoji === emoji ? 'rgba(27,110,243,.3)' : 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Quick Presets */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6B93C4', textTransform: 'uppercase', marginBottom: 8 }}>
            For Workspace
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PRESET_STATUSES.map(preset => (
              <button
                key={preset.text}
                onClick={() => {
                  setStatusEmoji(preset.emoji);
                  setStatusText(preset.text);
                  handleSave(preset.emoji, preset.text);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  background: 'transparent', border: 'none', borderRadius: 8,
                  color: '#C8D8EE', fontSize: 13, cursor: 'pointer', textAlign: 'left',
                  transition: '.1s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: 16 }}>{preset.emoji}</span>
                <span style={{ flex: 1 }}>{preset.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          {(user?.status_text || statusText) && (
            <button
              onClick={handleClear}
              disabled={saving}
              style={{
                padding: '7px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,.12)',
                background: 'transparent', color: '#6B93C4', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear status
            </button>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving}
            style={{
              padding: '7px 18px', borderRadius: 7, border: 'none',
              background: '#1B6EF3', color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
