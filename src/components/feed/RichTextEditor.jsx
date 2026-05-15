import React, { useState, useRef } from 'react';
import { Bold, Italic, Code2, Link2, Heading2 } from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder = "Write your post..." }) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const insertMarkdown = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange({ target: { value: newValue } });

    setTimeout(() => {
      textarea.selectionStart = start + before.length + selected.length + after.length;
      textarea.selectionEnd = start + before.length + selected.length + after.length;
      textarea.focus();
    }, 0);
  };

  const tools = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('_', '_') },
    { icon: Code2, label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: Heading2, label: 'Heading', action: () => insertMarkdown('## ', '') },
    { icon: Link2, label: 'Link', action: () => insertMarkdown('[text](url)', '') },
  ];

  return (
    <div className={`border rounded-lg transition-all ${isFocused ? 'border-primary ring-1 ring-primary/30' : 'border-slate-700'}`}>
      <div className="flex gap-1 p-2 border-b border-slate-700 bg-slate-900/50">
        {tools.map(tool => (
          <button
            key={tool.label}
            onClick={tool.action}
            title={tool.label}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-slate-100 p-3 outline-none resize-none min-h-[120px]"
      />
      <div className="text-xs text-slate-500 p-2 border-t border-slate-700">
        Supports **bold**, _italic_, `code`, [links](url), ## headings
      </div>
    </div>
  );
}