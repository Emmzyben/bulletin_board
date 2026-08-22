import React, { useState } from 'react';
import { Search, Filter, X, Loader2, Cpu, Stethoscope, Building2, BookOpen, Building, Home, Hotel, Briefcase, Music } from 'lucide-react';
import { ECOSYSTEMS, FLAIRS, getFlair } from '@/lib/ecosystems';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { useNavigate } from 'react-router-dom';

export default function AdvancedSearch({ onSearch, onFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ecosystem: '', flair: '', sortBy: 'recent' });
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = searchQuery.trim().toLowerCase();

  const { data: matchedPosts = [], isFetching: fetchingPosts } = useQuery({
    queryKey: ['feed-search-posts', trimmed],
    queryFn: async () => {
      try {
        const data = await api.get(`/search/posts?q=${encodeURIComponent(trimmed)}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: trimmed.length >= 2,
    staleTime: 30000,
  });

  const { data: matchedUsers = [], isFetching: fetchingUsers } = useQuery({
    queryKey: ['feed-search-users', trimmed],
    queryFn: async () => {
      try {
        const data = await api.get(`/search/users?q=${encodeURIComponent(trimmed)}`);
        return data || [];
      } catch (err) {
        return [];
      }
    },
    enabled: trimmed.length >= 2,
    staleTime: 30000,
  });

  const isLoading = fetchingPosts || fetchingUsers;

  const matchedEcosystems = trimmed.length >= 2
    ? ECOSYSTEMS.filter(e => e.label.toLowerCase().includes(trimmed)).slice(0, 3)
    : [];

  const hasResults = matchedPosts.length > 0 || matchedUsers.length > 0 || matchedEcosystems.length > 0;

  const handlePostClick = (post) => {
    setOpen(false);
    navigate(`/?post=${post.id}`);
  };

  const handleUserClick = (u) => {
    setOpen(false);
    navigate(`/user-profile?email=${encodeURIComponent(u.email)}`);
  };

  const handleEcoClick = (eco) => {
    setOpen(false);
    navigate(`/?ecosystem=${eco.id}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
    setOpen(true);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const activeFilterCount = [filters.ecosystem, filters.flair].filter(v => v).length + (filters.sortBy && filters.sortBy !== 'recent' ? 1 : 0);

  return (
    <div className="mb-4 space-y-3" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search posts, topics, users..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
        )}

        {/* Dropdown */}
        {open && trimmed.length >= 2 && (
          <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
            {!hasResults && !isLoading && (
              <div className="p-4 text-center text-sm text-slate-400">
                No results for "{searchQuery}"
              </div>
            )}

            {matchedPosts.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">Posts</div>
                {matchedPosts.map(p => {
                  const flair = getFlair(p.flair);
                  const FlairIcon = flair?.icon || BookOpen;
                  return (
                    <div key={p.id} onClick={() => handlePostClick(p)} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <FlairIcon className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{p.title}</div>
                        <div className="text-xs text-slate-500">by {p.author_name || 'Anonymous'} · {p.ecosystem}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {matchedUsers.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 border-t border-slate-700/50">People</div>
                {matchedUsers.map(u => {
                  const initials = u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || u.email?.[0]?.toUpperCase() || 'U';
                  return (
                    <div key={u.id} onClick={() => handleUserClick(u)} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200">{u.full_name || u.email?.split('@')[0]}</div>
                        <div className="text-xs text-slate-500">@{u.email?.split('@')[0]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {matchedEcosystems.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 border-t border-slate-700/50">Communities</div>
                {matchedEcosystems.map(eco => {
                  const EcoIcon = eco.icon;
                  return (
                    <div key={eco.id} onClick={() => handleEcoClick(eco)} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <EcoIcon className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200">{eco.label}</div>
                        <div className="text-xs text-slate-500">Browse {eco.label} community</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filters {activeFilterCount > 0 && <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>}
      </button>

      {showFilters && (
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Ecosystem</label>
            <select
              value={filters.ecosystem}
              onChange={e => handleFilterChange('ecosystem', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
            >
              <option value="">All</option>
              {ECOSYSTEMS.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Type</label>
            <select
              value={filters.flair}
              onChange={e => handleFilterChange('flair', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
            >
              <option value="">All</option>
              {FLAIRS.map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Sort</label>
            <select
              value={filters.sortBy}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200"
            >
              <option value="recent">Recent</option>
              <option value="trending">Trending</option>
              <option value="most-comments">Most Comments</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}