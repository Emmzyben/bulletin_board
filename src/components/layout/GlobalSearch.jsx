import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Loader2 } from 'lucide-react';
import { getEcosystem, getFlair } from '@/lib/ecosystems';
import { useQuery } from '@tanstack/react-query';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = query.trim().toLowerCase();

  const { data: matchedPosts = [], isFetching: fetchingPosts } = useQuery({
    queryKey: ['search-posts', trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .or(`title.ilike.%${trimmed}%,body.ilike.%${trimmed}%,author_name.ilike.%${trimmed}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: trimmed.length >= 2,
    staleTime: 30000,
  });

  const { data: matchedUsers = [], isFetching: fetchingUsers } = useQuery({
    queryKey: ['search-users', trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .limit(4);
      if (error) throw error;
      return data || [];
    },
    enabled: trimmed.length >= 2,
    staleTime: 30000,
  });

  const isLoading = fetchingPosts || fetchingUsers;

  // Ecosystem / community search
  const ECOSYSTEMS = [
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'corporate', label: 'Corporate', icon: '🏢' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'government', label: 'Government', icon: '🏛️' },
    { id: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { id: 'hospitality', label: 'Hospitality', icon: '🏨' },
    { id: 'careers', label: 'Careers', icon: '💼' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  ];
  const matchedEcosystems = trimmed.length >= 2
    ? ECOSYSTEMS.filter(e => e.label.toLowerCase().includes(trimmed)).slice(0, 3)
    : [];

  const hasResults = matchedPosts.length > 0 || matchedUsers.length > 0 || matchedEcosystems.length > 0;

  const handlePostClick = (post) => {
    setOpen(false);
    setQuery('');
    navigate(`/?post=${post.id}`);
  };

  const handleUserClick = (u) => {
    setOpen(false);
    setQuery('');
    navigate(`/user-profile?email=${encodeURIComponent(u.email)}`);
  };

  const handleEcoClick = (eco) => {
    setOpen(false);
    setQuery('');
    navigate(`/?ecosystem=${eco.id}`);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: focused ? '#F8FAFC' : '#F1F5F9',
        border: `1px solid ${focused ? '#3D5A80' : '#E2E8F0'}`,
        borderRadius: 20, padding: '6px 14px',
        color: '#64748B', fontSize: 13, transition: '.2s',
        boxShadow: focused ? '0 0 0 3px rgba(61,90,128,.08)' : 'none',
      }}>
        <span>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder="Search posts, people, communities…"
          style={{ background: 'none', border: 'none', outline: 'none', color: '#1F3A5F', fontFamily: 'inherit', fontSize: 13, width: 240 }}
        />
        {isLoading ? (
          <Loader2 style={{ width: 12, height: 12, color: '#94A3B8', flexShrink: 0 }} className="animate-spin" />
        ) : (
          <span style={{ fontSize: 10, fontFamily: 'monospace', background: '#E2E8F0', padding: '1px 6px', borderRadius: 4, color: '#64748B', flexShrink: 0 }}>⌘K</span>
        )}
      </div>

      {/* Dropdown */}
      {open && trimmed.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          width: 420, background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.15)', zIndex: 9999,
          maxHeight: 480, overflowY: 'auto',
        }}>
          {!hasResults && !isLoading && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}

          {/* Posts */}
          {matchedPosts.length > 0 && (
            <Section label="Posts">
              {matchedPosts.map(p => {
                const flair = getFlair(p.flair);
                return (
                  <ResultRow key={p.id} onClick={() => handlePostClick(p)}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{flair?.icon || '📝'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>by {p.author_name || 'Anonymous'} · {p.ecosystem}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>↗</span>
                  </ResultRow>
                );
              })}
            </Section>
          )}

          {/* Users */}
          {matchedUsers.length > 0 && (
            <Section label="People">
              {matchedUsers.map(u => {
                const initials = u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || u.email?.[0]?.toUpperCase() || 'U';
                return (
                  <ResultRow key={u.id} onClick={() => handleUserClick(u)}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7C4DFF,#1B6EF3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F' }}>{u.full_name || u.email?.split('@')[0]}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>@{u.email?.split('@')[0]}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>↗</span>
                  </ResultRow>
                );
              })}
            </Section>
          )}

          {/* Communities */}
          {matchedEcosystems.length > 0 && (
            <Section label="Communities">
              {matchedEcosystems.map(eco => (
                <ResultRow key={eco.id} onClick={() => handleEcoClick(eco)}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{eco.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F' }}>{eco.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Browse {eco.label} community</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0 }}>↗</span>
                </ResultRow>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <div style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 800, color: '#94A3B8', letterSpacing: '.8px', textTransform: 'uppercase' }}>
        {label}
      </div>
      {children}
      <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0' }} />
    </div>
  );
}

function ResultRow({ onClick, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px',
        cursor: 'pointer', background: hovered ? '#F8FAFC' : 'transparent', transition: '.1s',
      }}
    >
      {children}
    </div>
  );
}