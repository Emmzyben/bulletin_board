import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      margin: '6px 0',
      background: '#091322',
      border: '1px solid rgba(255,255,255,.09)',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 12.5,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 10px',
        background: 'rgba(255,255,255,.04)',
        borderBottom: '1px solid rgba(255,255,255,.06)',
        color: '#6B93C4',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '.5px'
      }}>
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: copied ? '#00C853' : '#6B93C4',
            cursor: 'pointer',
            fontSize: 11,
            padding: '2px 4px',
            borderRadius: 4,
          }}
          title="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '10px 12px',
        overflowX: 'auto',
        color: '#EEF4FF',
        lineHeight: 1.5,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Tokenize and render inline text (bold, italic, strike, code, links, mentions)
function formatInlineText(text) {
  if (!text) return null;

  // Regex for code block placeholder, links, inline code, bold, italic, strike, mentions
  // We handle tokens sequentially with regex replace or split
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|https?:\/\/[^\s]+|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|(?:\s|^)(@[a-zA-Z0-9._-]+)|\*([^*]+)\*|_([^_]+)_)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];

    // Markdown link: [label](url)
    if (match[2] && match[3]) {
      parts.push(
        <a
          key={match.index}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1B6EF3', textDecoration: 'underline', textUnderlineOffset: 2, wordBreak: 'break-all' }}
        >
          {match[2]}
        </a>
      );
    }
    // Raw URL: https://...
    else if (fullMatch.startsWith('http://') || fullMatch.startsWith('https://')) {
      parts.push(
        <a
          key={match.index}
          href={fullMatch}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1B6EF3', textDecoration: 'underline', textUnderlineOffset: 2, wordBreak: 'break-all' }}
        >
          {fullMatch}
        </a>
      );
    }
    // Inline code: `code`
    else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: 'rgba(255,255,255,.09)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 4,
            padding: '1px 5px',
            fontSize: '0.88em',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#FFB74D',
          }}
        >
          {match[4]}
        </code>
      );
    }
    // Bold: **text** or __text__
    else if (match[5] || match[6]) {
      parts.push(
        <strong key={match.index} style={{ color: '#EEF4FF', fontWeight: 700 }}>
          {match[5] || match[6]}
        </strong>
      );
    }
    // Strikethrough: ~~text~~
    else if (match[7]) {
      parts.push(
        <del key={match.index} style={{ opacity: 0.65 }}>
          {match[7]}
        </del>
      );
    }
    // Mention: @user
    else if (match[8]) {
      parts.push(
        <span
          key={match.index}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(27,110,243,.18)',
            border: '1px solid rgba(27,110,243,.35)',
            color: '#6AADFF',
            padding: '0 5px',
            borderRadius: 4,
            fontWeight: 600,
            fontSize: '0.92em',
          }}
        >
          {match[8].trim()}
        </span>
      );
    }
    // Italic: *text* or _text_
    else if (match[9] || match[10]) {
      parts.push(
        <em key={match.index} style={{ fontStyle: 'italic', color: '#D4E2F5' }}>
          {match[9] || match[10]}
        </em>
      );
    } else {
      parts.push(fullMatch);
    }

    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function MarkdownMessage({ content = '' }) {
  if (!content) return null;

  // Split content by multi-line code blocks ```lang\ncode\n```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      language: match[1]?.trim() || 'text',
      code: match[2]?.replace(/\n$/, '') || '',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return (
    <div style={{ lineHeight: 1.6, wordBreak: 'break-word' }}>
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return <CodeBlock key={idx} language={seg.language} code={seg.code} />;
        }

        // Split text by newlines into paragraphs
        const lines = seg.text.split('\n');
        return (
          <React.Fragment key={idx}>
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {formatInlineText(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}
