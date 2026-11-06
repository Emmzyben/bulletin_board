import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Hash, Lock, MessageSquare, FileText, User as UserIcon, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { api } from '@/api';
import { format } from 'date-fns';

export default function WorkspaceSearchModal({
  open,
  onClose,
  workspaceId,
  channels = [],
  onSelectChannel,
  onSelectDm,
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'messages' | 'channels' | 'files' | 'people'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ messages: [], channels: [], members: [], files: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ messages: [], channels: [], members: [], files: [] });
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || !workspaceId) {
      setResults({ messages: [], channels: [], members: [], files: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get(`/search/workspace?workspace_id=${workspaceId}&q=${encodeURIComponent(query.trim())}`);
        setResults(data || { messages: [], channels: [], members: [], files: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  // Aggregate items for current tab
  const getVisibleItems = () => {
    const items = [];
    if (activeTab === 'all' || activeTab === 'channels') {
      results.channels?.forEach(c => items.push({ type: 'channel', data: c }));
    }
    if (activeTab === 'all' || activeTab === 'people') {
      results.members?.forEach(m => items.push({ type: 'person', data: m }));
    }
    if (activeTab === 'all' || activeTab === 'messages') {
      results.messages?.forEach(m => items.push({ type: 'message', data: m }));
    }
    if (activeTab === 'all' || activeTab === 'files') {
      results.files?.forEach(f => items.push({ type: 'file', data: f }));
    }
    return items;
  };

  const visibleItems = getVisibleItems();

  const handleSelect = (item) => {
    if (!item) return;
    if (item.type === 'channel') {
      onSelectChannel?.(item.data.id);
      onClose();
    } else if (item.type === 'person') {
      onSelectDm?.(item.data.email);
      onClose();
    } else if (item.type === 'message' || item.type === 'file') {
      if (item.data.channel_id) {
        onSelectChannel?.(item.data.channel_id);
      } else if (item.data.is_dm && item.data.dm_recipient) {
        onSelectDm?.(item.data.dm_recipient);
      }
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (visibleItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + visibleItems.length) % (visibleItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleItems[selectedIndex]) {
        handleSelect(visibleItems[selectedIndex]);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-2xl bg-[#0F1B2E] border border-blue-500/20 text-[#EEF4FF] rounded-xl shadow-2xl">
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', gap: 12 }}>
          <Search size={18} className="text-[#6B93C4] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search channels, messages, people, or files..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 15, color: '#EEF4FF', fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', color: '#6B93C4', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} />
            </button>
          )}
          <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,.06)', color: '#6B93C4', border: '1px solid rgba(255,255,255,.1)' }}>
            ESC to close
          </span>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 18px', borderBottom: '1px solid rgba(255,255,255,.05)', background: 'rgba(0,0,0,.15)' }}>
          {[
            { id: 'all', label: 'All Results' },
            { id: 'channels', label: `Channels (${results.channels?.length || 0})` },
            { id: 'messages', label: `Messages (${results.messages?.length || 0})` },
            { id: 'people', label: `People (${results.members?.length || 0})` },
            { id: 'files', label: `Files (${results.files?.length || 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedIndex(0); }}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: '.12s', border: 'none',
                background: activeTab === tab.id ? 'rgba(27,110,243,.25)' : 'transparent',
                color: activeTab === tab.id ? '#6AADFF' : '#7FA8D4',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 14px' }}>
          {loading && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>
              Searching workspace...
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>
              Type a word to search across messages, channels, team members, or shared files.
            </div>
          )}

          {!loading && query && visibleItems.length === 0 && (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6B93C4', fontSize: 13 }}>
              No results found for "<span style={{ color: '#EEF4FF' }}>{query}</span>"
            </div>
          )}

          {!loading && visibleItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={`${item.type}-${item.data.id || item.data.email}-${idx}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 8, cursor: 'pointer', transition: '.1s',
                  background: isSelected ? 'rgba(27,110,243,.18)' : 'transparent',
                  border: isSelected ? '1px solid rgba(27,110,243,.35)' : '1px solid transparent',
                  marginBottom: 3,
                }}
              >
                {/* Item Icon */}
                <div style={{
                  width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: item.type === 'channel' ? 'rgba(27,110,243,.2)' :
                              item.type === 'person' ? 'rgba(16,185,129,.2)' :
                              item.type === 'file' ? 'rgba(245,158,11,.2)' : 'rgba(139,92,246,.2)',
                  color: item.type === 'channel' ? '#6AADFF' :
                         item.type === 'person' ? '#34D399' :
                         item.type === 'file' ? '#FBBF24' : '#A78BFA',
                }}>
                  {item.type === 'channel' ? (item.data.type === 'private' ? <Lock size={15} /> : <Hash size={15} />) :
                   item.type === 'person' ? <UserIcon size={15} /> :
                   item.type === 'file' ? <FileText size={15} /> : <MessageSquare size={15} />}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#EEF4FF' }}>
                      {item.type === 'channel' ? `#${item.data.name}` :
                       item.type === 'person' ? (item.data.name || item.data.full_name || item.data.email) :
                       item.type === 'file' ? (item.data.file_name || 'Shared file') :
                       (item.data.sender_name || item.data.sender_email?.split('@')[0])}
                    </span>
                    <span style={{ fontSize: 11, color: '#6B93C4', textTransform: 'capitalize' }}>
                      {item.type}
                    </span>
                    {item.data.createdAt && (
                      <span style={{ fontSize: 11, color: '#4A6A8A', marginLeft: 'auto' }}>
                        {format(new Date(item.data.createdAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9AB8DC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {item.type === 'channel' ? (item.data.description || 'Channel in workspace') :
                     item.type === 'person' ? item.data.email :
                     item.data.content || item.data.file_name}
                  </div>
                </div>

                {isSelected && (
                  <CornerDownLeft size={14} className="text-[#6AADFF] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: 'rgba(0,0,0,.25)', borderTop: '1px solid rgba(255,255,255,.06)', fontSize: 11, color: '#6B93C4' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <span><kbd style={{ background: 'rgba(255,255,255,.1)', padding: '2px 5px', borderRadius: 3 }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,.1)', padding: '2px 5px', borderRadius: 3 }}>↓</kbd> to navigate</span>
            <span><kbd style={{ background: 'rgba(255,255,255,.1)', padding: '2px 5px', borderRadius: 3 }}>Enter</kbd> to jump</span>
          </div>
          <span>Slack-grade universal search</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
