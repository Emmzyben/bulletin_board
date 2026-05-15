import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { ECOSYSTEMS, FLAIRS } from '@/lib/ecosystems';

export default function AdvancedSearch({ onSearch, onFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ecosystem: '', flair: '', sortBy: 'recent' });

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const activeFilterCount = [filters.ecosystem, filters.flair].filter(v => v).length + (filters.sortBy && filters.sortBy !== 'recent' ? 1 : 0);

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search posts, topics, users..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
        />
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