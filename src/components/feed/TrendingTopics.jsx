import React, { useMemo } from 'react';
import { TrendingUp, X } from 'lucide-react';

const sideCard = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 10,
  padding: '14px 12px',
};

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','has','have','had','it','its','this',
  'that','as','by','from','they','we','you','i','me','my','our','their','your',
  'how','what','why','who','when','which','can','will','do','does','did',
  'just','more','most','about','than','up','down','out','so','now','all',
  'not','no','new','ai','use','using','using','data','platform','using','into',
]);

function extractTopics(posts) {
  const scores = {};   // topic → engagement score
  const counts = {};   // topic → post count

  for (const post of posts) {
    const text = `${post.title || ''} ${post.body || ''}`;
    const engagement = (post.vote_score || 0) * 2 + (post.comment_count || 0);

    // Extract explicit #hashtags
    const hashtags = [...text.matchAll(/#([a-zA-Z][a-zA-Z0-9_]{2,})/g)].map(m => '#' + m[1].toLowerCase());

    // Extract meaningful 1–2 word phrases (stop-word filtered)
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s#]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w) && !w.startsWith('#'));

    const topics = [...new Set([...hashtags, ...words.slice(0, 12)])];

    for (const topic of topics) {
      scores[topic] = (scores[topic] || 0) + Math.max(1, engagement);
      counts[topic] = (counts[topic] || 0) + 1;
    }
  }

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([topic, score]) => ({ topic, score, count: counts[topic] || 1 }));
}

export default function TrendingTopics({ posts = [], activeTopic, onTopicClick }) {
  const topics = useMemo(() => extractTopics(posts), [posts]);

  if (topics.length === 0) return null;

  const maxScore = topics[0]?.score || 1;

  return (
    <div style={sideCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <TrendingUp style={{ width: 14, height: 14, color: '#1B6EF3' }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(150,190,240,.65)', textTransform: 'uppercase', letterSpacing: '.8px' }}>
            Trending Topics
          </span>
        </div>
        {activeTopic && (
          <button
            onClick={() => onTopicClick(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B93C4', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '2px 8px', cursor: 'pointer' }}
          >
            <X style={{ width: 10, height: 10 }} /> Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {topics.map(({ topic, score, count }) => {
          const isActive = activeTopic === topic;
          const barWidth = Math.max(8, Math.round((score / maxScore) * 100));
          const isHashtag = topic.startsWith('#');

          return (
            <button
              key={topic}
              onClick={() => onTopicClick(isActive ? null : topic)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '7px 10px', borderRadius: 8, border: '1px solid',
                cursor: 'pointer', textAlign: 'left', transition: '.15s',
                background: isActive ? 'rgba(27,110,243,.15)' : 'rgba(255,255,255,.02)',
                borderColor: isActive ? 'rgba(27,110,243,.4)' : 'rgba(255,255,255,.06)',
              }}
            >
              {/* Bar indicator */}
              <div style={{ width: 28, flexShrink: 0 }}>
                <div style={{ height: 3, borderRadius: 2, background: isActive ? '#1B6EF3' : 'rgba(107,147,196,.3)', width: `${barWidth}%`, minWidth: 4 }} />
              </div>

              <span style={{
                flex: 1, fontSize: 12, fontWeight: isHashtag ? 700 : 500,
                color: isActive ? '#6AADFF' : isHashtag ? '#7FA8D4' : '#6B93C4',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {topic}
              </span>

              <span style={{ fontSize: 10, color: '#2E4D6E', fontWeight: 600, flexShrink: 0 }}>
                {count} {count === 1 ? 'post' : 'posts'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}