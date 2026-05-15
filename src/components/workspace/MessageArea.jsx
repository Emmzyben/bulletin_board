import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';
import { usePresence } from '@/hooks/usePresence';
import { useTyping } from '@/hooks/useTyping';
import { Loader2, Bold, Italic, Strikethrough, Link, AtSign, Clock, Smile, Image, Paperclip, Mic } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

function MessageReactions({ msg, userEmail, onReact }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reactions = msg.reactions || [];

  const userReacted = (emoji) => {
    const r = reactions.find(r => r.emoji === emoji);
    return r?.users?.includes(userEmail);
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setPickerOpen(false); }}
    >
      {/* Existing reactions */}
      {reactions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
          {reactions.map((r, i) => (
            <button
              key={i}
              onClick={() => onReact(msg, r.emoji)}
              title={r.users?.join(', ')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: userReacted(r.emoji) ? 'rgba(27,110,243,.2)' : 'rgba(255,255,255,.05)',
                border: userReacted(r.emoji) ? '1px solid rgba(27,110,243,.45)' : '1px solid rgba(255,255,255,.11)',
                borderRadius: 20, padding: '2px 8px', fontSize: 13, color: '#7FA8D4',
                cursor: 'pointer', transition: '.15s', fontFamily: 'inherit',
              }}
            >
              {r.emoji} <span style={{ fontSize: 11, fontWeight: 700 }}>{r.users?.length || 0}</span>
            </button>
          ))}
          {/* Add reaction trigger */}
          <button
            onClick={() => setPickerOpen(p => !p)}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, border: '1px dashed rgba(255,255,255,.18)', background: 'transparent', color: '#6B93C4', fontSize: 13, cursor: 'pointer', transition: '.15s' }}
            title="Add reaction"
          >+</button>
        </div>
      )}

      {/* Hover add-reaction button (when no reactions yet) */}
      {reactions.length === 0 && hovering && (
        <button
          onClick={() => setPickerOpen(p => !p)}
          style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 20, border: '1px dashed rgba(255,255,255,.18)', background: 'transparent', color: '#6B93C4', fontSize: 12, cursor: 'pointer' }}
        >
          😊 React
        </button>
      )}

      {/* Emoji picker popover */}
      {pickerOpen && (
        <div style={{
          position: 'absolute', bottom: '110%', left: 0, zIndex: 100,
          background: '#111E33', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 12, padding: '8px', display: 'flex', gap: 4, flexWrap: 'wrap', width: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        }}>
          {QUICK_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => { onReact(msg, e); setPickerOpen(false); }}
              style={{ width: 36, height: 36, fontSize: 20, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, transition: '.12s' }}
              onMouseOver={el => el.currentTarget.style.background = 'rgba(255,255,255,.08)'}
              onMouseOut={el => el.currentTarget.style.background = 'transparent'}
            >{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday(d)) return timeStr;
  if (isYesterday(d)) return `Yesterday ${timeStr}`;
  return format(d, 'MMM d') + ' ' + timeStr;
}

export default function MessageArea({ channelId, channelName, workspaceId }) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [huddleActive, setHuddleActive] = useState(false);
  const [huddleSecs, setHuddleSecs] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [huddleMinimized, setHuddleMinimized] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchSender, setSearchSender] = useState('');
  const [searchDateFrom, setSearchDateFrom] = useState('');
  const [searchDateTo, setSearchDateTo] = useState('');
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const huddleTimerRef = useRef(null);
  const queryClient = useQueryClient();
  const { isPro, trialActive } = useSubscription();
  const proFeatureAvailable = isPro || trialActive;
  const { onlineMembers, lastReadMap, markChannelRead } = usePresence({ user, workspaceId, channelId });
  const { typingUsers, onTyping, onStopTyping } = useTyping({ channelId, userEmail: user?.email, userName: user?.full_name });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', channelId],
    queryFn: async () => {
      if (!channelId) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!channelId,
  });

  // Real-time subscription for new messages
  useEffect(() => {
    if (!channelId) return;
    
    const messageSub = supabase
      .channel(`room_${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSub);
    };
  }, [channelId, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Mark channel as read when messages change
    if (channelId) markChannelRead(channelId);
  }, [messages, channelId]);

  useEffect(() => {
    if (huddleActive) {
      setHuddleSecs(0);
      huddleTimerRef.current = setInterval(() => setHuddleSecs(s => s + 1), 1000);
    } else {
      clearInterval(huddleTimerRef.current);
    }
    return () => clearInterval(huddleTimerRef.current);
  }, [huddleActive]);

  const formatHuddleTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setAttachedFile({ name: file.name, url: publicUrl, size: file.size });
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !attachedFile || !channelId) return;
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    const file = attachedFile;
    setAttachedFile(null);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: messageText || (file ? `📎 ${file.name}` : ''),
          channel_id: channelId,
          workspace_id: workspaceId,
          sender_email: user?.email,
          sender_name: user?.full_name || 'Anonymous',
          file_url: file?.url,
        });

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    } catch (error) {
      setNewMessage(messageText);
      setAttachedFile(file);
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoGrow = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  };

  const textareaRef = useRef(null);

  const wrapSelection = (prefix, suffix = prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = newMessage.slice(start, end);
    const before = newMessage.slice(0, start);
    const after = newMessage.slice(end);
    const updated = before + prefix + selected + suffix + after;
    setNewMessage(updated);
    setTimeout(() => {
      el.focus();
      const cursor = start + prefix.length + selected.length + suffix.length;
      el.setSelectionRange(
        selected ? start + prefix.length : cursor,
        selected ? end + prefix.length : cursor
      );
    }, 0);
  };

  const insertAtCursor = (text) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const updated = newMessage.slice(0, start) + text + newMessage.slice(start);
    setNewMessage(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleReact = async (msg, emoji) => {
    const reactions = msg.reactions ? [...msg.reactions] : [];
    const existing = reactions.find(r => r.emoji === emoji);
    if (existing) {
      const alreadyReacted = existing.users?.includes(user?.email);
      if (alreadyReacted) {
        existing.users = existing.users.filter(u => u !== user?.email);
        if (existing.users.length === 0) {
          reactions.splice(reactions.indexOf(existing), 1);
        }
      } else {
        existing.users = [...(existing.users || []), user?.email];
      }
    } else {
      reactions.push({ emoji, users: [user?.email] });
    }
    await supabase.from('messages').update({ reactions }).eq('id', msg.id);
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
  };

  if (!channelId) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifySelf: 'center', background: '#0F1E35' }}>
        <div style={{ textAlign: 'center', color: '#2E4D6E' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>#</div>
          <p style={{ fontSize: 14, color: '#6B93C4' }}>Select a channel to start messaging</p>
        </div>
      </div>
    );
  }

  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'YO';

  const isSearchActive = searchKeyword || searchSender || searchDateFrom || searchDateTo;
  const displayedMessages = messages.filter(msg => {
    if (searchKeyword && !msg.content?.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    if (searchSender && !msg.sender_name?.toLowerCase().includes(searchSender.toLowerCase()) && !msg.sender_email?.toLowerCase().includes(searchSender.toLowerCase())) return false;
    if (searchDateFrom && msg.created_at && new Date(msg.created_at) < new Date(searchDateFrom)) return false;
    if (searchDateTo && msg.created_at && new Date(msg.created_at) > new Date(searchDateTo + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0F1E35', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(27,110,243,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(27,110,243,.018) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

      {/* HUDDLE OVERLAY */}
      {huddleActive && !huddleMinimized && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(6,13,26,.94)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.3px' }}>🎙️ Huddle — #{channelName}</div>
          <div style={{ fontSize: 13, color: '#7FA8D4', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#00C853' }}>🔒</span> End-to-end encrypted voice &amp; video
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: '#00C853', letterSpacing: 2 }}>
            {formatHuddleTime(huddleSecs)}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { initials: 'SR', name: 'Sarah R.', grad: 'linear-gradient(135deg,#1B6EF3,#00B4D8)', speaking: true },
              { initials: 'AI', name: 'Amara I.', grad: 'linear-gradient(135deg,#00C853,#00897B)', speaking: false },
              { initials: 'JT', name: 'James T.', grad: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)', speaking: false },
              { initials: initials, name: 'You', grad: 'linear-gradient(135deg,#7C4DFF,#F472B6)', speaking: !micMuted },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 84, height: 84, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 30, fontWeight: 800, color: '#fff', position: 'relative',
                  background: p.grad,
                  border: p.speaking ? '3px solid #00C853' : '3px solid transparent',
                  boxShadow: p.speaking ? '0 0 24px rgba(0,200,83,.45)' : 'none',
                }}>
                  {p.initials}
                  <div style={{
                    position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: '50%',
                    background: p.speaking ? '#00C853' : '#EF5350',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, border: '2px solid #0F1E35',
                  }}>
                    {p.speaking ? '🎙' : '🔇'}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7FA8D4' }}>{p.name}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { icon: micMuted ? '🔇' : '🎙️', action: () => setMicMuted(m => !m), bg: micMuted ? '#EF5350' : 'rgba(255,255,255,.1)', color: micMuted ? '#fff' : '#EEF4FF' },
              { icon: camOff ? '📵' : '📹', action: () => setCamOff(c => !c), bg: 'rgba(255,255,255,.1)', color: '#EEF4FF' },
              { icon: '🖥️', action: () => {}, bg: 'rgba(27,110,243,.2)', color: '#6AADFF' },
              { icon: '📵', action: () => { setHuddleActive(false); setHuddleMinimized(false); }, bg: '#EF5350', color: '#fff' },
            ].map((ctrl, i) => (
              <button key={i} onClick={ctrl.action} style={{
                width: 56, height: 56, borderRadius: '50%', border: 'none',
                fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '.22s cubic-bezier(.34,1.56,.64,1)',
                background: ctrl.bg, color: ctrl.color,
                boxShadow: i === 3 ? '0 4px 14px rgba(239,83,80,.4)' : 'none',
              }}>
                {ctrl.icon}
              </button>
            ))}
          </div>
          <button onClick={() => setHuddleMinimized(true)} style={{ fontSize: 12, color: '#6B93C4', background: 'none', border: 'none', cursor: 'pointer' }}>
            Minimize →
          </button>
          <div style={{ fontSize: 12, color: '#6B93C4', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: '#00C853' }}>🔒</span> Voice &amp; video end-to-end encrypted
          </div>
        </div>
      )}

      {/* Channel header */}
      <div style={{ height: 50, background: 'rgba(11,22,40,.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#EEF4FF', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.2px' }}>
            <span style={{ color: '#6B93C4', fontSize: 18 }}>#</span>
            <span>{channelName}</span>
          </div>
          {/* Online members in this channel */}
          {onlineMembers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <div style={{ display: 'flex' }}>
                {onlineMembers.slice(0, 5).map((m, i) => (
                  <div key={m.user_email} title={m.user_name || m.user_email} style={{
                    width: 20, height: 20, borderRadius: '50%', border: '2px solid #0F1E35',
                    background: `hsl(${(m.user_email.charCodeAt(0) * 37) % 360},60%,45%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 800, color: '#fff',
                    marginLeft: i > 0 ? -6 : 0, position: 'relative', zIndex: 5 - i,
                  }}>
                    {(m.user_name || m.user_email)[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#00C853', fontWeight: 700 }}>
                {onlineMembers.length} online
              </span>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3, alignItems: 'center' }}>
          <button
            onClick={() => { setSearchOpen(o => !o); if (searchOpen) { setSearchKeyword(''); setSearchSender(''); setSearchDateFrom(''); setSearchDateTo(''); } }}
            title="Search messages"
            style={{ width: 32, height: 32, border: 'none', borderRadius: 8, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: searchOpen || isSearchActive ? 'rgba(27,110,243,.25)' : 'transparent', color: searchOpen || isSearchActive ? '#6AADFF' : '#7FA8D4', transition: '.15s' }}
          >🔍</button>
          {['📌', '⏰'].map(icon => (
            <button key={icon} style={{ width: 32, height: 32, border: 'none', background: 'transparent', color: '#7FA8D4', borderRadius: 8, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {icon}
            </button>
          ))}
          <button
            onClick={() => {
              if (!proFeatureAvailable) {
                alert('🔒 Workspace Huddles are a Pro feature. Start your 14-day free trial to unlock this feature!');
              } else {
                setHuddleActive(h => !h);
                setHuddleMinimized(false);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
              borderRadius: 20, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: !proFeatureAvailable ? 'rgba(255,152,0,.1)' : huddleActive ? 'linear-gradient(135deg,#00C853,#009C42)' : 'rgba(0,200,83,.1)',
              color: !proFeatureAvailable ? '#FF8F00' : huddleActive ? '#fff' : '#00C853',
              border: !proFeatureAvailable ? '1px solid rgba(255,152,0,.3)' : huddleActive ? 'none' : '1px solid rgba(0,200,83,.25)',
              boxShadow: !proFeatureAvailable ? 'none' : huddleActive ? '0 2px 14px rgba(0,200,83,.45)' : 'none',
              transition: '.22s cubic-bezier(.34,1.56,.64,1)',
              opacity: !proFeatureAvailable ? 0.7 : 1,
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />
            {!proFeatureAvailable ? '🔒 Huddle (Pro)' : huddleActive ? (huddleMinimized ? 'In Huddle' : 'In Huddle') : 'Start Huddle'}
          </button>
        </div>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <div style={{ background: 'rgba(11,22,40,.9)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '10px 18px', flexShrink: 0, position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            autoFocus
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            placeholder="Search by keyword…"
            style={{ flex: '1 1 160px', minWidth: 120, background: '#111E33', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 10px', color: '#EEF4FF', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <input
            value={searchSender}
            onChange={e => setSearchSender(e.target.value)}
            placeholder="Filter by sender…"
            style={{ flex: '1 1 140px', minWidth: 110, background: '#111E33', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 10px', color: '#EEF4FF', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6B93C4', whiteSpace: 'nowrap' }}>From</span>
            <input
              type="date"
              value={searchDateFrom}
              onChange={e => setSearchDateFrom(e.target.value)}
              style={{ background: '#111E33', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 8px', color: '#EEF4FF', fontSize: 12, outline: 'none', colorScheme: 'dark' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6B93C4', whiteSpace: 'nowrap' }}>To</span>
            <input
              type="date"
              value={searchDateTo}
              onChange={e => setSearchDateTo(e.target.value)}
              style={{ background: '#111E33', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 8px', color: '#EEF4FF', fontSize: 12, outline: 'none', colorScheme: 'dark' }}
            />
          </div>
          {isSearchActive && (
            <span style={{ fontSize: 12, color: '#6AADFF', fontWeight: 600 }}>
              {displayedMessages.length} result{displayedMessages.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => { setSearchKeyword(''); setSearchSender(''); setSearchDateFrom(''); setSearchDateTo(''); }}
            style={{ fontSize: 11, color: '#EF5350', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, padding: '4px 8px' }}
          >Clear</button>
        </div>
      )}

      {/* Huddle running bar (minimized) */}
      {huddleActive && huddleMinimized && (
        <div
          onClick={() => setHuddleMinimized(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
            background: 'linear-gradient(90deg,rgba(0,200,83,.1),transparent)',
            borderBottom: '1px solid rgba(0,200,83,.18)', flexShrink: 0, position: 'relative', zIndex: 2, cursor: 'pointer',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00C853', boxShadow: '0 0 6px #00C853', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#00C853', flex: 1 }}>
            🎙️ Huddle active — {formatHuddleTime(huddleSecs)}
          </span>
          <button onClick={e => { e.stopPropagation(); setHuddleMinimized(false); }} style={{ fontSize: 11, fontWeight: 700, color: '#00C853', background: 'rgba(0,200,83,.15)', border: '1px solid rgba(0,200,83,.3)', borderRadius: 20, padding: '3px 12px', cursor: 'pointer' }}>
            Open
          </button>
          <button onClick={e => { e.stopPropagation(); setHuddleActive(false); setHuddleMinimized(false); }} style={{ fontSize: 11, color: '#EF5350', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            End
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 8px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', zIndex: 1 }}>
        {displayedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#2E4D6E' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{isSearchActive ? '🔍' : '#'}</div>
            <p style={{ fontSize: 14, color: '#6B93C4' }}>
              {isSearchActive ? 'No messages match your search.' : <>This is the beginning of <strong style={{ color: '#7FA8D4' }}>#{channelName}</strong></>}
            </p>
            {!isSearchActive && <p style={{ fontSize: 13, color: '#2E4D6E', marginTop: 4 }}>Send a message to start the conversation.</p>}
          </div>
        ) : (
          displayedMessages.map(msg => {
            const senderInitials = msg.sender_name ? msg.sender_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
            const isOwn = msg.sender_email === user?.email;
            return (
              <div
                key={msg.id}
                style={{ display: 'flex', gap: 12, padding: '5px 10px', borderRadius: 10, margin: '0 -10px', transition: '.15s', position: 'relative', cursor: 'default' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.03)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0, marginTop: 2,
                  background: isOwn ? 'linear-gradient(135deg,#7C4DFF,#F472B6)' : 'linear-gradient(135deg,#1B6EF3,#00B4D8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#fff',
                }}>
                  {senderInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#EEF4FF', letterSpacing: '-0.2px' }}>{msg.sender_name}</span>
                  {isOwn && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#7FA8D4', background: 'rgba(124,77,255,.12)', padding: '1px 7px', borderRadius: 4 }}>Owner</span>
                  )}
                  <span style={{ fontSize: 11, color: '#6B93C4' }}>
                    {formatMsgTime(msg.created_at)}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#7FA8D4', lineHeight: 1.65 }}>{msg.content}</div>
                {msg.file_url && (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '8px 12px', background: 'rgba(27,110,243,.1)', border: '1px solid rgba(27,110,243,.3)', borderRadius: 8, color: '#6AADFF', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    📥 Download File
                  </a>
                )}
                <MessageReactions msg={msg} userEmail={user?.email} onReact={handleReact} />
                {/* Read receipts: show avatars of online members who've read past this message */}
                {isOwn && (() => {
                  const readers = onlineMembers.filter(m => {
                    if (m.user_email === user?.email) return false;
                    const theirLastRead = m.last_read?.[channelId];
                    return theirLastRead && msg.created_at && new Date(theirLastRead) >= new Date(msg.created_at);
                  });
                  return readers.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <span style={{ fontSize: 10, color: '#4A6A8A' }}>Seen by</span>
                      <div style={{ display: 'flex' }}>
                        {readers.slice(0, 5).map((m, i) => (
                          <div key={m.user_email} title={m.user_name || m.user_email} style={{
                            width: 14, height: 14, borderRadius: '50%',
                            background: `hsl(${(m.user_email.charCodeAt(0) * 37) % 360},60%,45%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 7, fontWeight: 800, color: '#fff',
                            marginLeft: i > 0 ? -3 : 0,
                          }}>
                            {(m.user_name || m.user_email)[0].toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: '4px 18px', display: 'flex', alignItems: 'center', gap: 6, background: '#0F1E35', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%', background: '#6AADFF',
                animation: `bounce 1s ${i * 0.2}s infinite`,
                opacity: 0.8,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#6B93C4', fontStyle: 'italic' }}>
            {typingUsers.map(u => u.name || u.email.split('@')[0]).join(', ')}
            {typingUsers.length === 1 ? ' is typing…' : ' are typing…'}
          </span>
        </div>
      )}

      {/* Message input */}
      <div style={{ padding: '12px 18px 16px', background: '#0F1E35', borderTop: '1px solid rgba(255,255,255,.07)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        {/* Formatting bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 8 }}>
          {[
            { icon: <Bold size={13} />, title: 'Bold', action: () => wrapSelection('**') },
            { icon: <Italic size={13} />, title: 'Italic', action: () => wrapSelection('_') },
            { icon: <Strikethrough size={13} />, title: 'Strikethrough', action: () => wrapSelection('~~') },
          ].map(b => (
            <button key={b.title} title={b.title} onClick={b.action} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4' }}
              onMouseOver={e => e.currentTarget.style.color = '#EEF4FF'}
              onMouseOut={e => e.currentTarget.style.color = '#6B93C4'}
            >
              {b.icon}
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.11)', margin: '0 3px', flexShrink: 0 }} />
          {[
            { icon: <Link size={13} />, title: 'Link', action: () => wrapSelection('[', '](url)') },
            { icon: <AtSign size={13} />, title: 'Mention', action: () => insertAtCursor('@') },
            { icon: <Clock size={13} />, title: 'Reminder', action: () => insertAtCursor('/remind ') },
          ].map(b => (
            <button key={b.title} title={b.title} onClick={b.action} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4' }}
              onMouseOver={e => e.currentTarget.style.color = '#EEF4FF'}
              onMouseOut={e => e.currentTarget.style.color = '#6B93C4'}
            >
              {b.icon}
            </button>
          ))}
        </div>

        {/* Attached file preview */}
        {attachedFile && (
          <div style={{ padding: '8px 12px', background: 'rgba(27,110,243,.08)', borderBottom: '1px solid rgba(27,110,243,.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6AADFF' }}>
            <span>📎 {attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6AADFF', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Remove</button>
          </div>
        )}

        {/* Input box */}
        <div style={{ background: '#111E33', border: '1px solid rgba(255,255,255,.11)', borderRadius: 12, overflow: 'hidden', transition: '.15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(27,110,243,.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.11)'}
        >
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={e => { setNewMessage(e.target.value); autoGrow(e.target); onTyping(); }}
            onBlur={onStopTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}… (Enter to send · Shift+Enter for new line)`}
            rows={1}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#EEF4FF', fontFamily: 'inherit', fontSize: 15, resize: 'none',
              padding: '12px 14px 10px', minHeight: 20, maxHeight: 140, lineHeight: 1.55,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 8px', gap: 4, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <button
              title="Emoji"
              onClick={() => setNewMessage(prev => prev + '😊')}
              style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4', transition: '.15s' }}
              onMouseOver={e => e.currentTarget.style.color = '#EEF4FF'}
              onMouseOut={e => e.currentTarget.style.color = '#6B93C4'}
            ><Smile size={16} /></button>
            <button
              title="Image"
              style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4', transition: '.15s' }}
              onMouseOver={e => e.currentTarget.style.color = '#EEF4FF'}
              onMouseOut={e => e.currentTarget.style.color = '#6B93C4'}
            ><Image size={16} /></button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: uploading ? 'not-allowed' : 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: uploading ? '#2E4D6E' : '#6B93C4', opacity: uploading ? 0.5 : 1 }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <button
              title="Huddle"
              onClick={() => { setHuddleActive(h => !h); setHuddleMinimized(false); }}
              style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: huddleActive ? '#00C853' : '#6B93C4' }}
            ><Mic size={16} /></button>
            <button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !attachedFile) || sending}
              style={{
                marginLeft: 'auto', width: 36, height: 36,
                background: (newMessage.trim() || attachedFile) ? 'linear-gradient(135deg,#1B6EF3,#0D5FDB)' : 'rgba(27,110,243,.2)',
                border: 'none', borderRadius: 8, cursor: (newMessage.trim() || attachedFile) ? 'pointer' : 'not-allowed',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '.22s cubic-bezier(.34,1.56,.64,1)',
                boxShadow: (newMessage.trim() || attachedFile) ? '0 2px 12px rgba(27,110,243,.4)' : 'none',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B93C4', marginTop: 8, justifyContent: 'center' }}>
          <span style={{ color: '#00C853' }}>🔒</span>
          End-to-end encrypted · Only workspace members can read this channel
        </div>
      </div>
    </div>
  );
}