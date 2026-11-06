import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { useSubscription } from '@/hooks/useSubscription';
import { usePresence } from '@/hooks/usePresence';
import { useTyping } from '@/hooks/useTyping';
import {
  Loader2, Bold, Italic, Strikethrough, Link, AtSign, Clock, Smile, Image,
  Paperclip, Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Lock, Radio, Headphones,
  Pencil, Trash2, Pin, MessageSquare, X, Check, ChevronRight, FileText, FileArchive,
  FileCode, FileAudio, FileVideo, Music, Film
} from 'lucide-react';
import { api, socket } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { uploadFile } from '@/lib/upload';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MarkdownMessage from './MarkdownMessage';
import ChannelDetailsDrawer from './ChannelDetailsDrawer';
import { useWebRTCHuddle } from '@/hooks/useWebRTCHuddle';
import HuddleMediaCard from './HuddleMediaCard';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

const normalizeReactions = (rawReactions) => {
  if (typeof rawReactions === 'string') {
    try {
      return normalizeReactions(JSON.parse(rawReactions));
    } catch {
      return [];
    }
  }

  if (Array.isArray(rawReactions)) {
    return rawReactions.filter(reaction => reaction && reaction.emoji);
  }

  if (rawReactions && typeof rawReactions === 'object') {
    if (Array.isArray(rawReactions.reactions)) {
      return normalizeReactions(rawReactions.reactions);
    }

    return Object.entries(rawReactions)
      .filter(([, users]) => Array.isArray(users))
      .map(([emoji, users]) => ({ emoji, users }));
  }

  return [];
};

function MessageReactions({ msg, userEmail, onReact }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reactions = normalizeReactions(msg.reactions);

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

// File type icon helper
function getFileIcon(fileType) {
  if (!fileType) return <FileText size={20} />;
  if (fileType.startsWith('image/')) return <Image size={20} />;
  if (fileType.startsWith('audio/')) return <Music size={20} />;
  if (fileType.startsWith('video/')) return <Film size={20} />;
  if (fileType.includes('pdf') || fileType.includes('word') || fileType.includes('document')) return <FileText size={20} />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return <FileArchive size={20} />;
  if (fileType.includes('javascript') || fileType.includes('json') || fileType.includes('html') || fileType.includes('css') || fileType.includes('typescript')) return <FileCode size={20} />;
  return <FileText size={20} />;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageArea({ channelId, channelName, activeDm, workspaceId, isMobile = false, onBack, members = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [huddleActive, setHuddleActive] = useState(false);
  const [huddleSecs, setHuddleSecs] = useState(0);
  const [huddleMinimized, setHuddleMinimized] = useState(false);
  const [channelHuddleStatus, setChannelHuddleStatus] = useState(null); // { active, count, participants }
  const [channelDetailsOpen, setChannelDetailsOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [attachedFile, setAttachedFile] = useState(null);
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef(null);
  const [threadMsg, setThreadMsg] = useState(null);
  const [threadReply, setThreadReply] = useState('');
  const [sendingThread, setSendingThread] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const huddleTimerRef = useRef(null);
  const queryClient = useQueryClient();
  // Voice note recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const { isPro, trialActive } = useSubscription();
  const proFeatureAvailable = isPro || trialActive;
  const { onlineMembers, lastReadMap, markChannelRead } = usePresence({ user, workspaceId, channelId });
  const { typingUsers, onTyping, onStopTyping } = useTyping({ channelId, userEmail: user?.email, userName: user?.full_name });

  // WebRTC Live Huddle Engine (Audio, Video, Screen Share, Mesh Signaling)
  const {
    localStream,
    screenStream,
    isMuted,
    isVideoOn,
    isScreenSharing,
    isSpeaking,
    peers: huddlePeers,
    mediaError: huddleMediaError,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTCHuddle({
    socket,
    channelId,
    user,
    active: huddleActive,
    onLeave: () => {
      setHuddleActive(false);
      setHuddleMinimized(false);
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', channelId || activeDm],
    queryFn: async () => {
      if (!channelId && !activeDm) return [];
      try {
        let url = `/messages?workspace_id=${workspaceId}`;
        if (channelId) url += `&channel_id=${channelId}`;
        if (activeDm) url += `&active_dm=${activeDm}`;
        const data = await api.get(url);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: !!(channelId || activeDm),
  });
  const messageProfiles = useUserProfiles(messages.map(message => message.sender_email));

  // Real-time subscription for new messages
  useEffect(() => {
    if (!channelId && !activeDm) return;

    const joinChannel = () => {
      if (channelId) socket.emit('joinChannel', channelId);
    };
    const leaveChannel = () => {
      if (channelId) socket.emit('leaveChannel', channelId);
    };
    
    const queryKey = channelId ? ['messages', channelId] : ['messages', activeDm];
    const handleUpdate = () => queryClient.invalidateQueries({ queryKey });
    const handleDeleted = ({ id }) => {
      queryClient.setQueryData(queryKey, (old = []) => old.filter(m => m.id !== id));
    };
    const handleChannelAccessRevoked = (event) => {
      if (event?.channel_id !== channelId) return;
      leaveChannel();
      queryClient.removeQueries({ queryKey: ['messages', channelId] });
      toast.error('You no longer have access to this channel.');
    };

    if (channelId) {
      if (socket.connected) joinChannel();
      socket.on('connect', joinChannel);
      socket.on('channel_access_revoked', handleChannelAccessRevoked);
      socket.on('channel_access_denied', handleChannelAccessRevoked);
      socket.on(`room_${channelId}_message`, handleUpdate);
      socket.on(`room_${channelId}_message_update`, handleUpdate);
      socket.on(`room_${channelId}_message_deleted`, handleDeleted);
    } else if (activeDm) {
      if (activeDm.includes(',')) {
        socket.on(`dm_${activeDm}_message`, handleUpdate);
        socket.on(`dm_${activeDm}_message_update`, handleUpdate);
        socket.on(`dm_${activeDm}_message_deleted`, handleDeleted);
      } else {
        socket.on(`dm_${user?.email}_${activeDm}_message`, handleUpdate);
        socket.on(`dm_${activeDm}_${user?.email}_message`, handleUpdate);
        socket.on(`dm_${user?.email}_${activeDm}_message_update`, handleUpdate);
        socket.on(`dm_${activeDm}_${user?.email}_message_update`, handleUpdate);
        socket.on(`dm_${user?.email}_${activeDm}_message_deleted`, handleDeleted);
        socket.on(`dm_${activeDm}_${user?.email}_message_deleted`, handleDeleted);
      }
    }

    return () => {
      if (channelId) {
        leaveChannel();
        socket.off('connect', joinChannel);
        socket.off('channel_access_revoked', handleChannelAccessRevoked);
        socket.off('channel_access_denied', handleChannelAccessRevoked);
        socket.off(`room_${channelId}_message`, handleUpdate);
        socket.off(`room_${channelId}_message_update`, handleUpdate);
        socket.off(`room_${channelId}_message_deleted`, handleDeleted);
      } else if (activeDm) {
        if (activeDm.includes(',')) {
          socket.off(`dm_${activeDm}_message`, handleUpdate);
          socket.off(`dm_${activeDm}_message_update`, handleUpdate);
          socket.off(`dm_${activeDm}_message_deleted`, handleDeleted);
        } else {
          socket.off(`dm_${user?.email}_${activeDm}_message`, handleUpdate);
          socket.off(`dm_${activeDm}_${user?.email}_message`, handleUpdate);
          socket.off(`dm_${user?.email}_${activeDm}_message_update`, handleUpdate);
          socket.off(`dm_${activeDm}_${user?.email}_message_update`, handleUpdate);
          socket.off(`dm_${user?.email}_${activeDm}_message_deleted`, handleDeleted);
          socket.off(`dm_${activeDm}_${user?.email}_message_deleted`, handleDeleted);
        }
      }
    };
  }, [channelId, activeDm, workspaceId, user?.email, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Mark channel as read when messages change
    if (channelId) markChannelRead(channelId);
  }, [messages, channelId, activeDm]);

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
      const data = await uploadFile(file);
      setAttachedFile({ name: file.name, url: data.url, size: file.size, type: file.type });
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditSave = async (msg) => {
    if (!editContent.trim() || editContent.trim() === msg.content) {
      setEditingMsgId(null);
      return;
    }
    try {
      await api.put(`/messages/${msg.id}`, { content: editContent.trim() });
      queryClient.invalidateQueries({ queryKey: ['messages', channelId || activeDm] });
      toast.success('Message updated');
    } catch (err) {
      toast.error('Failed to update message');
    } finally {
      setEditingMsgId(null);
    }
  };

  const handleDeleteMessage = async (msg) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      await api.delete(`/messages/${msg.id}`);
      queryClient.setQueryData(
        ['messages', channelId || activeDm],
        (old = []) => old.filter(m => m.id !== msg.id)
      );
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleTogglePin = async (msg) => {
    try {
      await api.put(`/messages/${msg.id}/pin`, {});
      queryClient.invalidateQueries({ queryKey: ['messages', channelId || activeDm] });
      toast.success(msg.is_pinned ? 'Message unpinned' : 'Message pinned');
    } catch (err) {
      toast.error('Failed to toggle pin');
    }
  };

  const handleSendThreadReply = async () => {
    if (!threadReply.trim() || !threadMsg) return;
    setSendingThread(true);
    try {
      const payload = {
        content: threadReply,
        workspace_id: workspaceId,
        sender_email: user?.email,
        sender_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        parent_id: threadMsg.id,
      };
      if (channelId) payload.channel_id = channelId;
      else if (activeDm) { payload.is_dm = true; payload.dm_recipient = activeDm; }
      await api.post('/messages', payload);
      setThreadReply('');
      queryClient.invalidateQueries({ queryKey: ['messages', channelId || activeDm] });
      queryClient.invalidateQueries({ queryKey: ['thread', threadMsg.id] });
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingThread(false);
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !attachedFile) || (!channelId && !activeDm)) return;
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    const file = attachedFile;
    setAttachedFile(null);

    try {
      const payload = {
        content: messageText || (file ? `📎 ${file.name}` : ''),
        workspace_id: workspaceId,
        sender_email: user?.email,
        sender_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        file_url: file?.url,
        file_name: file?.name || null,
        file_size: file?.size || null,
        file_type: file?.type || null,
      };

      if (channelId) {
        payload.channel_id = channelId;
      } else if (activeDm) {
        payload.is_dm = true;
        payload.dm_recipient = activeDm;
      }

      await api.post('/messages', payload);
      queryClient.invalidateQueries({ queryKey: ['messages', channelId || activeDm] });
    } catch (error) {
      setNewMessage(messageText);
      setAttachedFile(file);
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Voice Note ────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      recordingChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordingChunksRef.current, { type: mr.mimeType });
        if (blob.size > 500) sendVoiceNote(blob, mr.mimeType);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSecs(0);
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingSecs(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingSecs(0);
    recordingChunksRef.current = [];
  };

  const sendVoiceNote = async (blob, mimeType) => {
    setSending(true);
    try {
      const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
      const fileName = `voice-note-${Date.now()}.${ext}`;
      const file = new File([blob], fileName, { type: mimeType });
      const data = await uploadFile(file);
      const payload = {
        content: '🎙 Voice note',
        workspace_id: workspaceId,
        sender_email: user?.email,
        sender_name: user?.full_name || user?.email?.split('@')[0] || 'User',
        file_url: data.url,
        file_name: fileName,
        file_size: file.size,
        file_type: mimeType,
      };
      if (channelId) payload.channel_id = channelId;
      else if (activeDm) { payload.is_dm = true; payload.dm_recipient = activeDm; }
      await api.post('/messages', payload);
      queryClient.invalidateQueries({ queryKey: ['messages', channelId || activeDm] });
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to send voice note');
    } finally {
      setSending(false);
    }
  };

  const { data: wsData } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      try {
        const ws = await api.get(`/workspaces/${workspaceId}`);
        const raw = ws?.members;
        return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
      } catch { return []; }
    },
    enabled: !!workspaceId && members.length === 0,
  });
  const allWorkspaceMembers = members.length > 0 ? members : (wsData || []);
  const matchingMembers = mentionQuery !== null
    ? allWorkspaceMembers.filter(m => {
        const email = (m?.email || '').toLowerCase();
        const name = (m?.name || m?.full_name || '').toLowerCase();
        return email.includes(mentionQuery) || name.includes(mentionQuery);
      }).slice(0, 6)
    : [];

  // Listen for channel-wide huddle status updates (e.g. "2 people are in a huddle")
  useEffect(() => {
    if (!channelId) {
      setChannelHuddleStatus(null);
      return;
    }

    // Request initial status for this channel
    socket.emit('huddle:get_status', { channelId });

    const handleChannelStatus = (status) => {
      if (status.channelId === channelId) {
        setChannelHuddleStatus(status);
      }
    };

    socket.on('huddle:channel_status', handleChannelStatus);

    return () => {
      socket.off('huddle:channel_status', handleChannelStatus);
    };
  }, [channelId]);

  const insertMention = (member) => {
    const el = textareaRef.current;
    if (!el || !member) return;
    const cursorPos = el.selectionStart;
    const textBefore = newMessage.slice(0, cursorPos);
    const textAfter = newMessage.slice(cursorPos);
    const match = textBefore.match(/@([a-zA-Z0-9._-]*)$/);
    if (match) {
      const startPos = match.index;
      const mentionTag = `@${member.email?.split('@')[0]} `;
      const updated = newMessage.slice(0, startPos) + mentionTag + textAfter;
      setNewMessage(updated);
      setMentionQuery(null);
      setTimeout(() => {
        el.focus();
        const newPos = startPos + mentionTag.length;
        el.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    autoGrow(e.target);
    onTyping();

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const match = textBefore.match(/@([a-zA-Z0-9._-]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && matchingMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % matchingMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + matchingMembers.length) % matchingMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(matchingMembers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }

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
    const reactions = normalizeReactions(msg.reactions).map(reaction => ({
      ...reaction,
      users: Array.isArray(reaction.users) ? [...reaction.users] : [],
    }));
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
    try {
      await api.put(`/messages/${msg.id}/reactions`, { reactions });
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
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

  const displayedMessages = messages;

  if (!channelId && !activeDm) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0F1E35', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#7FA8D4', fontSize: 15, fontWeight: 600 }}>Select a channel or direct message</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#0F1E35', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(27,110,243,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(27,110,243,.018) 1px,transparent 1px)', backgroundSize: '36px 36px' }} />

      {/* HUDDLE OVERLAY (Real WebRTC Voice, Video, and Screen Share) */}
      {huddleActive && !huddleMinimized && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(6,13,26,.95)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 900 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#EEF4FF', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Radio size={22} color="#00C853" />
                <span>Huddle — #{channelName}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,200,83,.15)', color: '#00C853', border: '1px solid rgba(0,200,83,.3)' }}>
                  LIVE
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#7FA8D4', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Lock size={13} color="#00C853" /> Encrypted Voice, Video &amp; Screen
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: '#00C853', letterSpacing: 1.5, background: 'rgba(0,200,83,.08)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(0,200,83,.2)' }}>
                {formatHuddleTime(huddleSecs)}
              </div>
              <button
                onClick={() => setHuddleMinimized(true)}
                title="Minimize to floating bar"
                style={{ fontSize: 13, fontWeight: 600, color: '#7FA8D4', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', transition: '.15s' }}
              >
                Minimize ↘
              </button>
            </div>
          </div>

          {huddleMediaError && (
            <div style={{ width: '100%', maxWidth: 900, background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.3)', borderRadius: 10, padding: '10px 16px', color: '#EF5350', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              <span>{huddleMediaError}</span>
            </div>
          )}

          {/* Participant Grid (Host + Remote Peers) */}
          <div style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            maxWidth: 960,
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: '16px 0',
          }}>
            {/* Local Host Card */}
            <HuddleMediaCard
              isSelf={true}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              stream={screenStream || localStream}
            />

            {/* Remote Peers Cards */}
            {huddlePeers.map(peer => (
              <HuddleMediaCard
                key={peer.socketId}
                peer={peer}
                isSelf={false}
                isSpeaking={peer.isSpeaking}
                stream={peer.stream}
              />
            ))}
          </div>

          {/* Controls Dock */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(11,22,40,.85)', padding: '10px 20px', borderRadius: 40, border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }}>
            {/* Mic Mute / Unmute */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              style={{
                width: 52, height: 52, borderRadius: '50%', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '.2s',
                background: isMuted ? '#EF5350' : 'rgba(255,255,255,.1)',
                color: '#fff',
                boxShadow: isMuted ? '0 0 14px rgba(239,83,80,.4)' : 'none',
              }}
            >
              {isMuted ? <MicOff size={22} color="#fff" /> : <Mic size={22} color="#fff" />}
            </button>

            {/* Camera On / Off */}
            <button
              onClick={toggleVideo}
              title={isVideoOn ? 'Turn camera off' : 'Turn camera on'}
              style={{
                width: 52, height: 52, borderRadius: '50%', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '.2s',
                background: isVideoOn ? '#00C853' : 'rgba(255,255,255,.1)',
                color: '#fff',
                boxShadow: isVideoOn ? '0 0 14px rgba(0,200,83,.4)' : 'none',
              }}
            >
              {isVideoOn ? <Video size={22} color="#fff" /> : <VideoOff size={22} color="#fff" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
              style={{
                width: 52, height: 52, borderRadius: '50%', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '.2s',
                background: isScreenSharing ? '#1B6EF3' : 'rgba(255,255,255,.1)',
                color: '#fff',
                boxShadow: isScreenSharing ? '0 0 14px rgba(27,110,243,.5)' : 'none',
              }}
            >
              <Monitor size={22} color="#fff" />
            </button>

            {/* Leave Call */}
            <button
              onClick={() => {
                setHuddleActive(false);
                setHuddleMinimized(false);
              }}
              title="Leave huddle"
              style={{
                width: 52, height: 52, borderRadius: '50%', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: '.2s',
                background: '#EF5350', color: '#fff',
                boxShadow: '0 4px 16px rgba(239,83,80,.5)',
              }}
            >
              <PhoneOff size={22} color="#fff" />
            </button>
          </div>
        </div>
      )}

      {/* Channel header */}
      <div style={{ height: 50, background: 'rgba(11,22,40,.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        {isMobile && (
          <button
            onClick={onBack}
            title="Back to workspace"
            style={{ border: 'none', background: 'transparent', color: '#7FA8D4', fontSize: 22, lineHeight: 1, cursor: 'pointer', padding: '4px 8px 4px 0' }}
          >‹</button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            onClick={() => {
              if (!activeDm) {
                setChannelDetailsOpen(o => !o);
                setThreadMsg(null);
                setPinnedOpen(false);
              }
            }}
            title={!activeDm ? "Click for channel details & files" : undefined}
            style={{
              fontSize: 16, fontWeight: 700, color: '#EEF4FF', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '-0.2px',
              cursor: !activeDm ? 'pointer' : 'default', padding: '3px 7px', borderRadius: 6, transition: '.12s',
            }}
            onMouseOver={e => { if (!activeDm) e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {activeDm ? (
              activeDm.includes(',') ? (
                <>
                  <span style={{ fontSize: 16 }}>👥</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {activeDm.split(',').filter(e => e !== user?.email).map(e => e.split('@')[0]).join(', ')}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ color: '#6B93C4', fontSize: 18 }}>@</span>
                  <span>{activeDm.split('@')[0]}</span>
                </>
              )
            ) : (
              <>
                <span style={{ color: '#6B93C4', fontSize: 18 }}>#</span>
                <span>{channelName}</span>
                <span style={{ fontSize: 11, color: '#6B93C4' }}>▾</span>
              </>
            )}
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
            onClick={() => { setPinnedOpen(o => !o); setThreadMsg(null); }}
            title="Pinned messages"
          >
            <Pin size={16} />
          </button>
          <button
            onClick={() => {
              if (!proFeatureAvailable) {
                alert('🔒 Workspace Huddles are a Pro feature. Start your Pro free trial to unlock this feature!');
              } else {
                setHuddleActive(h => !h);
                setHuddleMinimized(false);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
              borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: !proFeatureAvailable ? 'rgba(255,152,0,.1)' : huddleActive ? 'linear-gradient(135deg,#00C853,#009C42)' : 'rgba(0,200,83,.1)',
              color: !proFeatureAvailable ? '#FF8F00' : huddleActive ? '#fff' : '#00C853',
              border: !proFeatureAvailable ? '1px solid rgba(255,152,0,.3)' : huddleActive ? 'none' : '1px solid rgba(0,200,83,.25)',
              boxShadow: !proFeatureAvailable ? 'none' : huddleActive ? '0 2px 14px rgba(0,200,83,.45)' : 'none',
              transition: '.22s cubic-bezier(.34,1.56,.64,1)',
              opacity: !proFeatureAvailable ? 0.7 : 1,
            }}
          >
            {!proFeatureAvailable ? (
              <>
                <Lock size={12} color="#FF8F00" />
                <span>Huddle (Pro)</span>
              </>
            ) : huddleActive ? (
              <>
                <Radio size={13} color="#fff" />
                <span>In Huddle</span>
              </>
            ) : (
              <>
                <Headphones size={13} color="#00C853" />
                <span>Start Huddle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Huddle running bar (minimized for current participant) */}
      {huddleActive && huddleMinimized && (
        <div
          onClick={() => setHuddleMinimized(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px',
            background: 'linear-gradient(90deg,rgba(0,200,83,.15),transparent)',
            borderBottom: '1px solid rgba(0,200,83,.25)', flexShrink: 0, position: 'relative', zIndex: 2, cursor: 'pointer',
          }}
        >
          <Radio size={14} color="#00C853" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#00C853', flex: 1 }}>
            You're in a Huddle — {formatHuddleTime(huddleSecs)} ({huddlePeers.length + 1} participant{huddlePeers.length !== 0 ? 's' : ''})
          </span>
          <button onClick={e => { e.stopPropagation(); setHuddleMinimized(false); }} style={{ fontSize: 11, fontWeight: 700, color: '#00C853', background: 'rgba(0,200,83,.15)', border: '1px solid rgba(0,200,83,.3)', borderRadius: 20, padding: '4px 14px', cursor: 'pointer' }}>
            Open Call
          </button>
          <button onClick={e => { e.stopPropagation(); setHuddleActive(false); setHuddleMinimized(false); }} style={{ fontSize: 11, color: '#EF5350', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Leave
          </button>
        </div>
      )}

      {/* Ongoing Channel Huddle Discovery Banner (when peers are in a huddle and user is not) */}
      {!huddleActive && channelHuddleStatus?.active && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
            background: 'linear-gradient(90deg,rgba(0,200,83,.18),rgba(27,110,243,.1))',
            borderBottom: '1px solid rgba(0,200,83,.3)', flexShrink: 0, position: 'relative', zIndex: 2,
          }}
        >
          <Radio size={15} color="#00C853" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>
            <span style={{ color: '#00C853', fontWeight: 700 }}>Live Huddle in progress: </span>
            {channelHuddleStatus.participants?.map(p => p.userName || p.userEmail?.split('@')[0]).slice(0, 3).join(', ')}
            {channelHuddleStatus.count > 3 && ` +${channelHuddleStatus.count - 3} others`}
          </div>
          <button
            onClick={() => {
              if (!proFeatureAvailable) {
                alert('🔒 Workspace Huddles are a Pro feature. Start your Pro free trial to unlock this feature!');
              } else {
                setHuddleActive(true);
                setHuddleMinimized(false);
              }
            }}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              background: '#00C853', color: '#060D1A', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,200,83,.4)', transition: '.15s',
            }}
          >
            Join Huddle
          </button>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 8px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative', zIndex: 1 }}>
        {displayedMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#2E4D6E' }}>
            <div style={{ fontSize: 36, marginBottom: 12, color: '#6B93C4' }}>#</div>
            <p style={{ fontSize: 14, color: '#6B93C4' }}>
              This is the beginning of <strong style={{ color: '#7FA8D4' }}>#{channelName || 'channel'}</strong>
            </p>
            <p style={{ fontSize: 13, color: '#4B6B94', marginTop: 4 }}>Send a message to start the conversation.</p>
          </div>
        ) : (
          displayedMessages.map(msg => {
            const displayName = msg.sender_name && msg.sender_name !== 'Anonymous' ? msg.sender_name : (msg.sender_email?.split('@')[0] || 'User');
            const senderInitials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const isOwn = msg.sender_email === user?.email;
            const canModify = isOwn;
            const senderProfile = messageProfiles[msg.sender_email];
            const isEditing = editingMsgId === msg.id;
            const isHovered = hoveredMsgId === msg.id;
            const isImage = msg.file_type?.startsWith('image/');
            const isAudio = msg.file_type?.startsWith('audio/') || msg.file_name?.endsWith('.webm') || msg.file_name?.endsWith('.ogg') || msg.file_name?.endsWith('.mp3') || msg.file_name?.endsWith('.wav') || msg.file_name?.startsWith('voice-note-');
            return (
              <div
                key={msg.id}
                style={{ display: 'flex', gap: 12, padding: '5px 10px', borderRadius: 10, margin: '0 -10px', transition: '.15s', position: 'relative', cursor: 'default', background: isEditing ? 'rgba(27,110,243,.06)' : 'transparent' }}
                onMouseEnter={() => setHoveredMsgId(msg.id)}
                onMouseLeave={() => setHoveredMsgId(null)}
              >
                {/* Pin indicator */}
                {msg.is_pinned && (
                  <div style={{ position: 'absolute', left: -2, top: 0, bottom: 0, width: 3, background: '#FFB300', borderRadius: '0 3px 3px 0' }} />
                )}

                {/* Hover action toolbar */}
                {isHovered && !isEditing && (
                  <div style={{
                    position: 'absolute', right: 12, top: -14, zIndex: 20,
                    display: 'flex', gap: 2,
                    background: '#0F1E35', border: '1px solid rgba(255,255,255,.1)',
                    borderRadius: 8, padding: '3px 4px',
                    boxShadow: '0 4px 16px rgba(0,0,0,.4)',
                  }}>
                    {[{ icon: <MessageSquare size={13} />, title: 'Reply in thread', action: () => setThreadMsg(msg) },
                      { icon: <Smile size={13} />, title: 'Add reaction', action: () => {} },
                      { icon: msg.is_pinned ? <Pin size={13} style={{ color: '#FFB300' }} /> : <Pin size={13} />, title: msg.is_pinned ? 'Unpin' : 'Pin message', action: () => handleTogglePin(msg) },
                      ...(canModify ? [
                        { icon: <Pencil size={13} />, title: 'Edit message', action: () => { setEditingMsgId(msg.id); setEditContent(msg.content); } },
                        { icon: <Trash2 size={13} style={{ color: '#EF5350' }} />, title: 'Delete message', action: () => handleDeleteMessage(msg) },
                      ] : [])
                    ].map((btn, i) => (
                      <button key={i} title={btn.title} onClick={btn.action} style={{
                        width: 28, height: 28, border: 'none', background: 'transparent',
                        cursor: 'pointer', borderRadius: 6, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#7FA8D4', transition: '.12s'
                      }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >{btn.icon}</button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/user-profile?userId=${encodeURIComponent(msg.sender_email)}`)}
                  title={`View ${displayName}'s profile`}
                  style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', height: 40 }}
                >
                  <Avatar className="mt-[2px] h-[38px] w-[38px] shrink-0 rounded-[10px]">
                    <AvatarImage src={senderProfile?.avatar_url || undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="rounded-[10px]" style={{
                      background: isOwn ? 'linear-gradient(135deg,#7C4DFF,#F472B6)' : 'linear-gradient(135deg,#1B6EF3,#00B4D8)',
                      color: '#fff', fontSize: 13, fontWeight: 800,
                    }}>{senderInitials}</AvatarFallback>
                  </Avatar>
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/user-profile?userId=${encodeURIComponent(msg.sender_email)}`)}
                      style={{ padding: 0, border: 'none', background: 'transparent', color: '#EEF4FF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                    >{displayName}</button>
                    <span style={{ fontSize: 11, color: '#6B93C4' }}>{formatMsgTime(msg.created_at)}</span>
                    {msg.is_edited && <span style={{ fontSize: 10, color: '#4A6A8A', fontStyle: 'italic' }}>(edited)</span>}
                    {msg.is_pinned && (
                      <span style={{ fontSize: 10, color: '#FFB300', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Pin size={11} color="#FFB300" />
                        <span>pinned</span>
                      </span>
                    )}
                  </div>

                  {/* Message content or inline edit */}
                  {isEditing ? (
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        autoFocus
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(msg); } if (e.key === 'Escape') setEditingMsgId(null); }}
                        style={{
                          width: '100%', background: '#111E33', border: '1px solid rgba(27,110,243,.5)',
                          borderRadius: 8, padding: '8px 10px', color: '#EEF4FF', fontFamily: 'inherit',
                          fontSize: 14, resize: 'none', outline: 'none', lineHeight: 1.55,
                        }}
                        rows={2}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <button onClick={() => handleEditSave(msg)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(27,110,243,.2)', border: '1px solid rgba(27,110,243,.4)', borderRadius: 6, color: '#6AADFF', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}><Check size={12} /> Save</button>
                        <button onClick={() => setEditingMsgId(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6, color: '#7FA8D4', fontSize: 12, cursor: 'pointer' }}><X size={12} /> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: '#C8D8EE', lineHeight: 1.65 }}>
                      <MarkdownMessage content={msg.content} />
                    </div>
                  )}

                  {/* File attachment card */}
                  {msg.file_url && (
                    isImage ? (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8 }}>
                        <img src={msg.file_url} alt={msg.file_name || 'attachment'} style={{ maxWidth: 360, maxHeight: 240, borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', objectFit: 'cover', display: 'block' }} />
                      </a>
                    ) : isAudio ? (
                      <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(27,110,243,.09)', border: '1px solid rgba(27,110,243,.25)', borderRadius: 12, maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ width: 24, height: 24, borderRadius: 12, background: 'linear-gradient(135deg,#1B6EF3,#0D5FDB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <Mic size={13} />
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#EEF4FF' }}>Voice note</span>
                          {msg.file_size && <span style={{ fontSize: 11, color: '#6B93C4', marginLeft: 'auto' }}>{formatFileSize(msg.file_size)}</span>}
                        </div>
                        <audio controls src={msg.file_url} preload="metadata" style={{ width: '100%', height: 38, outline: 'none' }} />
                      </div>
                    ) : (
                      <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 8, padding: '10px 14px', background: 'rgba(27,110,243,.08)', border: '1px solid rgba(27,110,243,.22)', borderRadius: 10, color: '#6AADFF', textDecoration: 'none', maxWidth: 320 }}
                      >
                        <span style={{ color: '#6AADFF', flexShrink: 0 }}>{getFileIcon(msg.file_type)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.file_name || 'Download file'}</div>
                          {msg.file_size && <div style={{ fontSize: 11, color: '#4A6A8A', marginTop: 1 }}>{formatFileSize(msg.file_size)}</div>}
                        </div>
                        <ChevronRight size={14} style={{ flexShrink: 0, marginLeft: 'auto', opacity: 0.6 }} />
                      </a>
                    )
                  )}

                  <MessageReactions msg={msg} userEmail={user?.email} onReact={handleReact} />

                  {/* Thread reply bar */}
                  {msg.reply_count > 0 && (
                    <button
                      onClick={() => setThreadMsg(msg)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                        padding: '4px 10px', border: '1px solid rgba(27,110,243,.2)',
                        borderRadius: 20, background: 'rgba(27,110,243,.07)',
                        color: '#6AADFF', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: '.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(27,110,243,.15)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(27,110,243,.07)'}
                    >
                      <MessageSquare size={12} />
                      {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
                      {msg.latest_reply_at && <span style={{ color: '#4A6A8A', fontWeight: 400 }}>· {formatMsgTime(msg.latest_reply_at)}</span>}
                    </button>
                  )}

                  {/* Read receipts */}
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
                              fontSize: 7, fontWeight: 800, color: '#fff', marginLeft: i > 0 ? -3 : 0,
                            }}>{(m.user_name || m.user_email)[0].toUpperCase()}</div>
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
        {/* Attached file preview */}
        {attachedFile && (
          <div style={{ padding: '8px 12px', background: 'rgba(27,110,243,.08)', borderBottom: '1px solid rgba(27,110,243,.15)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#6AADFF' }}>
            <span>📎 {attachedFile.name}</span>
            <button onClick={() => setAttachedFile(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6AADFF', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Remove</button>
          </div>
        )}

        {/* Input box */}
        <div style={{ position: 'relative', background: '#111E33', border: '1px solid rgba(255,255,255,.11)', borderRadius: 12, transition: '.15s' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(27,110,243,.5)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.11)'}
        >
          {/* Mention autocomplete popup */}
          {mentionQuery !== null && matchingMembers.length > 0 && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8,
              background: '#0B1C32', border: '1px solid rgba(27,110,243,.35)',
              borderRadius: 10, boxShadow: '0 -8px 30px rgba(0,0,0,.55)',
              overflow: 'hidden', zIndex: 40,
            }}>
              <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#6B93C4', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.25)' }}>
                Members matching "@{mentionQuery}" — ↑↓ to navigate, Enter or Tab to select
              </div>
              {matchingMembers.map((m, idx) => {
                const isSelected = idx === mentionIndex;
                const name = m.name || m.full_name || m.email?.split('@')[0];
                return (
                  <div
                    key={m.email}
                    onClick={() => insertMention(m)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(27,110,243,.25)' : 'transparent',
                      color: isSelected ? '#EEF4FF' : '#C8D8EE',
                    }}
                    onMouseEnter={() => setMentionIndex(idx)}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, background: '#1B6EF3',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: '#fff',
                    }}>
                      {(name || 'U')[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 11, color: '#6B93C4', marginLeft: 'auto' }}>{m.email}</span>
                  </div>
                );
              })}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextChange}
            onBlur={onStopTyping}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName}… (Type @ to mention · Enter to send)`}
            rows={1}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#EEF4FF', fontFamily: 'inherit', fontSize: 15, resize: 'none',
              padding: '12px 14px 10px', minHeight: 20, maxHeight: 140, lineHeight: 1.55,
            }}
          />
          {/* ── Emoji Picker Panel ─────────────────────────────── */}
          {emojiPickerOpen && (() => {
            const EMOJI_CATS = [
              { label: '😀 Smileys', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','🥳','🤩','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇'] },
              { label: '👍 Hands', emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','🤜','🤛','✊','👊','🤝','🙌','👐','🤲','🙏','✍️','💅','🤳','💪','🦾'] },
              { label: '❤️ Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','♾️'] },
              { label: '🎉 Fun', emojis: ['🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏆','🥇','🥈','🥉','🎖️','🏅','🎯','🎳','🎮','🕹️','🎲','🃏','🀄','🎴','🧩','🎭','🎨','🖌️','✏️','📝','🔥','⭐','🌟','💫','✨','💥','🌈','☀️','🌙','⚡','❄️','🌊'] },
              { label: '🐶 Animals', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀'] },
              { label: '🍕 Food', emojis: ['🍕','🍔','🌮','🌯','🥗','🍜','🍝','🍛','🍣','🍱','🥘','🍲','🥧','🧆','🧇','🥞','🧈','🍳','🥚','🧀','🥓','🥩','🍗','🍖','🍟','🌭','🍱','🥫','🧂','🍿','🧃','🥤','🧋','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾','🥛','🍼','🫖'] },
              { label: '✅ Signs', emojis: ['✅','❌','⭕','🚫','💯','‼️','❓','❔','❗','❕','🔅','🔆','🔱','⚜️','🔰','♻️','✔️','🔛','🔜','🔝','🆗','🆙','🆕','🆓','🆒','🆖','📶','🎦','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','⛔','🔞','📵','🚷','🚯','🚳','🚱','🔇','📴'] },
            ];
            return (
              <div
                ref={emojiPickerRef}
                style={{
                  position: 'absolute', bottom: 68, left: 12, zIndex: 999,
                  background: '#0E1929', border: '1px solid rgba(255,255,255,.12)',
                  borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.55)',
                  width: 340, maxHeight: 320, overflowY: 'auto',
                  padding: '10px 10px 6px',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {EMOJI_CATS.map(cat => (
                  <div key={cat.label} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#4A7AB5', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 5, padding: '0 2px' }}>{cat.label}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {cat.emojis.map(em => (
                        <button
                          key={em}
                          onClick={() => { setNewMessage(prev => prev + em); setEmojiPickerOpen(false); textareaRef.current?.focus(); }}
                          style={{ width: 32, height: 32, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >{em}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{ display: 'flex', alignItems: 'center', padding: '7px 12px 8px', gap: 4, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <button
              title="Emoji"
              onClick={() => setEmojiPickerOpen(o => !o)}
              style={{ width: 30, height: 30, border: 'none', background: emojiPickerOpen ? 'rgba(255,255,255,.1)' : 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: emojiPickerOpen ? '#EEF4FF' : '#6B93C4', transition: '.15s' }}
              onMouseOver={e => { if (!emojiPickerOpen) e.currentTarget.style.color = '#EEF4FF'; }}
              onMouseOut={e => { if (!emojiPickerOpen) e.currentTarget.style.color = '#6B93C4'; }}
            ><Smile size={16} /></button>
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
            {/* Voice Note Button */}
            {isRecording ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4, background: 'rgba(239,83,80,.12)', border: '1px solid rgba(239,83,80,.3)', borderRadius: 20, padding: '2px 8px 2px 10px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF5350' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF5350', fontVariantNumeric: 'tabular-nums', minWidth: 32 }}>
                  {String(Math.floor(recordingSecs / 60)).padStart(2,'0')}:{String(recordingSecs % 60).padStart(2,'0')}
                </span>
                <button
                  type="button"
                  title="Cancel recording"
                  onClick={cancelRecording}
                  style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF5350' }}
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  title="Send voice note"
                  onClick={stopRecording}
                  style={{ width: 24, height: 24, border: 'none', background: '#00C853', cursor: 'pointer', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                title="Record voice note"
                onClick={startRecording}
                style={{ width: 30, height: 30, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B93C4', transition: '.15s' }}
                onMouseOver={e => e.currentTarget.style.color = '#EEF4FF'}
                onMouseOut={e => e.currentTarget.style.color = '#6B93C4'}
              ><Mic size={16} /></button>
            )}
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

      {/* ── PINNED MESSAGES FLYOUT ── */}
      {pinnedOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 50, bottom: 0, width: 340, zIndex: 30,
          background: '#0B1C32', borderLeft: '1px solid rgba(255,255,255,.08)',
          display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Pin size={16} style={{ color: '#FFB300' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#EEF4FF' }}>Pinned Messages</span>
            </div>
            <button onClick={() => setPinnedOpen(false)} style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', borderRadius: 6, padding: 4, display: 'flex' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.filter(m => m.is_pinned).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4A6A8A' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <Pin size={32} color="#FFB300" style={{ opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#7FA8D4' }}>No pinned messages yet</div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#4B6B94' }}>Hover a message and click the pin icon to pin it here</div>
              </div>
            ) : messages.filter(m => m.is_pinned).map(msg => (
              <div key={msg.id} style={{ background: 'rgba(255,179,0,.06)', border: '1px solid rgba(255,179,0,.18)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFB300' }}>{msg.sender_name || msg.sender_email?.split('@')[0]}</span>
                  <span style={{ fontSize: 11, color: '#4A6A8A' }}>{formatMsgTime(msg.created_at)}</span>
                </div>
                <div style={{ fontSize: 13, color: '#C8D8EE', lineHeight: 1.6 }}>
                  <MarkdownMessage content={msg.content} />
                </div>
                {msg.pinned_by && (
                  <div style={{ fontSize: 11, color: '#6B93C4', marginTop: 6 }}>
                    Pinned by {msg.pinned_by.split('@')[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── THREAD DRAWER ── */}
      {threadMsg && (
        <div style={{
          position: 'absolute', right: 0, top: 50, bottom: 0, width: 400, zIndex: 30,
          background: '#0A1828', borderLeft: '1px solid rgba(255,255,255,.08)',
          display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,.45)',
        }}>
          {/* Thread header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} style={{ color: '#6AADFF' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#EEF4FF' }}>Thread</span>
              {channelName && <span style={{ fontSize: 12, color: '#6B93C4' }}>in #{channelName}</span>}
            </div>
            <button onClick={() => setThreadMsg(null)} style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', borderRadius: 6, padding: 4, display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* Root message */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,#1B6EF3,#00B4D8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
              }}>
                {(threadMsg.sender_name || threadMsg.sender_email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#EEF4FF' }}>{threadMsg.sender_name || threadMsg.sender_email?.split('@')[0]}</span>
                  <span style={{ fontSize: 11, color: '#6B93C4' }}>{formatMsgTime(threadMsg.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, color: '#C8D8EE', lineHeight: 1.6 }}>
                  <MarkdownMessage content={threadMsg.content} />
                </div>
              </div>
            </div>
          </div>

          {/* Thread replies */}
          <ThreadReplies threadMsgId={threadMsg.id} formatMsgTime={formatMsgTime} workspaceId={workspaceId} channelId={channelId} />

          {/* Thread reply input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0 }}>
            <div style={{ background: '#111E33', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, overflow: 'hidden' }}>
              <textarea
                value={threadReply}
                onChange={e => setThreadReply(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendThreadReply(); } }}
                placeholder="Reply in thread… (Enter to send)"
                rows={2}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: '#EEF4FF', fontFamily: 'inherit', fontSize: 14, resize: 'none',
                  padding: '10px 12px 6px', lineHeight: 1.5,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 8px' }}>
                <button
                  onClick={handleSendThreadReply}
                  disabled={!threadReply.trim() || sendingThread}
                  style={{
                    padding: '6px 16px', background: threadReply.trim() ? 'linear-gradient(135deg,#1B6EF3,#0D5FDB)' : 'rgba(27,110,243,.2)',
                    border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: threadReply.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {sendingThread ? <Loader2 size={13} className="animate-spin" /> : null}
                  Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNEL DETAILS DRAWER ── */}
      {channelDetailsOpen && channelId && (
        <ChannelDetailsDrawer
          channel={{ id: channelId, name: channelName }}
          workspaceId={workspaceId}
          user={user}
          userProfiles={messageProfiles}
          onClose={() => setChannelDetailsOpen(false)}
        />
      )}
    </div>
  );
}

// ── Thread Replies sub-component ──
function ThreadReplies({ threadMsgId, formatMsgTime }) {
  const { data: thread } = useQuery({
    queryKey: ['thread', threadMsgId],
    queryFn: async () => {
      return api.get(`/messages/${threadMsgId}/thread`);
    },
    enabled: !!threadMsgId,
    refetchInterval: 8000,
  });

  const replies = thread?.replies || [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {replies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#4A6A8A', fontSize: 13 }}>
          No replies yet — be the first to reply!
        </div>
      ) : replies.map(reply => (
        <div key={reply.id} style={{ display: 'flex', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, flexShrink: 0,
            background: `hsl(${(reply.sender_email?.charCodeAt(0) * 37 || 200) % 360},55%,40%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>
            {(reply.sender_name || reply.sender_email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>{reply.sender_name || reply.sender_email?.split('@')[0]}</span>
              <span style={{ fontSize: 11, color: '#6B93C4' }}>{formatMsgTime(reply.created_at)}</span>
            </div>
            <div style={{ fontSize: 13, color: '#C8D8EE', lineHeight: 1.6 }}>
              <MarkdownMessage content={reply.content} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}