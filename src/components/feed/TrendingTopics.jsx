import React, { useMemo } from 'react';
import { TrendingUp, X } from 'lucide-react';

const sideCard = {
  background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.07)',
  borderRadius: 10,
  padding: '14px 12px',
};

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','into',
  'is','are','was','were','be','been','has','have','had','it','its','this','that',
  'as','by','from','they','we','you','i','me','my','our','their','your','yourself',
  'how','what','why','who','when','which','can','will','do','does','did','should',
  'just','more','most','about','than','up','down','out','so','now','all','not','no',
  'new','use','using','used','data','platform','team','work','working','also','there',
  'here','through','after','before','without','under','over','very','same','today',
  'tomorrow','week','month','year','people','person','thing','things','post','posts',
  'topic','topics','discussion','question','news','poll','feed','website','app','board',
  'project','feature','community','example','examples','sample','demo','test','testing',
  'tested','give','full','definition','language','structure','dear'
]);

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .replace(/[#@]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTerms(text) {
  return normalizeText(text)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

function extractTopics(posts) {
  const scores = {};
  const counts = {};

  for (const post of posts) {
    const title = post.title || '';
    const body = post.body || '';
    const text = `${title} ${body}`;
    const engagement = (post.vote_score || 0) * 3 + (post.comment_count || 0) * 2 + 3;

    const hashtags = [...text.matchAll(/#([a-zA-Z][a-zA-Z0-9_]{2,})/g)]
      .map(match => `#${match[1].toLowerCase()}`);

    const titleTerms = extractTerms(title);
    const bodyTerms = extractTerms(body);
    const seen = new Set();

    for (const topic of hashtags) {
      const normalized = topic.toLowerCase();
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      scores[normalized] = (scores[normalized] || 0) + engagement * 6;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }

    for (const topic of [...titleTerms, ...bodyTerms]) {
      const normalized = topic.toLowerCase();
      if (normalized.length < 4 || !/^[a-z]/.test(normalized) || STOP_WORDS.has(normalized)) continue;
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      const weight = title.includes(normalized) ? 4 : 2;
      scores[normalized] = (scores[normalized] || 0) + engagement * weight;
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  }

  return Object.entries(scores)
    .filter(([topic, score]) => score > 0 && (counts[topic] >= 2 || topic.startsWith('#')))
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