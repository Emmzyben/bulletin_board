import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function NewsCard({ article }) {
  const timeAgo = article.published
    ? formatDistanceToNow(new Date(article.published), { addSuffix: true })
    : '';

  const sourceColor = article.source === 'AP News' ? '#CC0000' : '#FF8000';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <a href={article.url} target="_blank" rel="noopener noreferrer" className="block">
        <Card className="overflow-hidden hover:shadow-md transition-all !bg-slate-950/60 border border-slate-800 border-l-4 cursor-pointer group"
          style={{ borderLeftColor: sourceColor }}>
          <div className="flex gap-3 p-4">
            {/* Left: source badge + text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge
                  className="text-white text-xs font-bold px-2 py-0.5"
                  style={{ background: sourceColor }}
                >
                  📰 {article.source}
                </Badge>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                  📡 Live News
                </Badge>
                {timeAgo && (
                  <span className="text-xs text-slate-500">{timeAgo}</span>
                )}
              </div>

              <h3 className="font-bold text-sm leading-snug text-slate-100 group-hover:text-primary transition-colors mb-1.5 line-clamp-2">
                {article.title}
              </h3>

              {article.description && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              )}

              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 group-hover:text-primary transition-colors">
                <ExternalLink className="w-3 h-3" />
                Read full story
              </div>
            </div>

            {/* Right: thumbnail */}
            {article.image_url && (
              <img
                src={article.image_url}
                alt=""
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
        </Card>
      </a>
    </motion.div>
  );
}