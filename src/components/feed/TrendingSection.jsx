import React from 'react';
import { TrendingUp, MessageSquare } from 'lucide-react';

export default function TrendingSection({ posts = [] }) {
  const trending = [...posts]
    .sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0))
    .slice(0, 5);

  if (trending.length === 0) return null;

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 mb-4">
      <h3 className="flex items-center gap-2 font-bold text-slate-100 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        Trending Now
      </h3>
      <div className="space-y-2">
        {trending.map((post, i) => (
          <div key={post.id} className="p-2 bg-slate-800/50 rounded hover:bg-slate-800 transition-colors cursor-pointer group">
            <div className="flex gap-2 items-start">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 group-hover:text-slate-100 truncate font-medium">{post.title}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span>👍</span> {post.vote_score || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}