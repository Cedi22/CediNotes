import React, { useState, useRef, useEffect } from 'react';
import { NodeItem } from '../../types';
import { Search, ExternalLink, FileText, Plus } from 'lucide-react';

interface NodeEditorProps {
  node: NodeItem;
  allNodes: NodeItem[];
  registerRef: (id: string, el: HTMLInputElement | null) => void;
  onEnter: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onBackspace: (id: string) => void;
  onChange: (id: string, value: string) => void;
  onNavigateVertical: (id: string, dir: 'up' | 'down') => void;
  onSelectWikiLinkNode?: (targetNodeId: string) => void;
  onCreateWikiNote?: (title: string) => Promise<string>;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  node,
  allNodes,
  registerRef,
  onEnter,
  onIndent,
  onOutdent,
  onBackspace,
  onChange,
  onNavigateVertical,
  onSelectWikiLinkNode,
  onCreateWikiNote
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showWikiDropdown, setShowWikiDropdown] = useState(false);
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiSelectedIndex, setWikiSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    registerRef(node.id, inputRef.current);
    return () => {
      registerRef(node.id, null);
    };
  }, [node.id, registerRef]);

  // Autocomplete matching nodes for [[
  const matchingWikiNodes = allNodes
    .filter(n => n.id !== node.id && n.content.trim().length > 0)
    .filter(n => n.content.toLowerCase().includes(wikiQuery.toLowerCase()))
    .sort((a, b) => {
      const aRoot = a.parent_id === null ? -1 : 1;
      const bRoot = b.parent_id === null ? -1 : 1;
      return aRoot - bRoot;
    })
    .slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. If WikiLink autocomplete dropdown is open
    if (showWikiDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWikiSelectedIndex(prev => (prev + 1) % (matchingWikiNodes.length + 1 || 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWikiSelectedIndex(prev => (prev - 1 + (matchingWikiNodes.length + 1 || 1)) % (matchingWikiNodes.length + 1 || 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (wikiSelectedIndex < matchingWikiNodes.length && matchingWikiNodes[wikiSelectedIndex]) {
          insertWikiLink(matchingWikiNodes[wikiSelectedIndex].content);
        } else if (wikiQuery.trim()) {
          insertWikiLink(wikiQuery.trim(), true);
        }
        setShowWikiDropdown(false);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowWikiDropdown(false);
        return;
      }
    }

    // 2. Tab / Shift+Tab: Indent / Outdent
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent(node.id);
      } else {
        onIndent(node.id);
      }
      return;
    }

    // 3. Enter: Create new sibling node below
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter(node.id);
      return;
    }

    // 4. Backspace: If node is empty, delete it
    if (e.key === 'Backspace') {
      const input = inputRef.current;
      if (!node.content || node.content.length === 0 || (input && input.selectionStart === 0 && input.selectionEnd === 0)) {
        e.preventDefault();
        onBackspace(node.id);
        return;
      }
    }

    // 5. Arrow Up / Down navigation
    if (e.key === 'ArrowUp') {
      const input = inputRef.current;
      if (input && input.selectionStart === 0) {
        e.preventDefault();
        onNavigateVertical(node.id, 'up');
      }
    } else if (e.key === 'ArrowDown') {
      const input = inputRef.current;
      if (input && input.selectionStart === input.value.length) {
        e.preventDefault();
        onNavigateVertical(node.id, 'down');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    let cur = e.target.selectionStart || 0;

    // Detect "slink" or "nlink" trigger
    // If the word immediately before cursor is "slink" or "nlink"
    const textBeforeCursor = val.slice(0, cur);
    const slinkMatch = textBeforeCursor.match(/(?:^|\s)(slink|nlink)$/i);
    if (slinkMatch) {
      const trigger = slinkMatch[1];
      const matchStart = cur - trigger.length;
      const prefix = val.slice(0, matchStart);
      const suffix = val.slice(cur);
      const replacement = `(slink="")`;
      const newVal = `${prefix}${replacement}${suffix}`;
      const newCursor = prefix.length + `(slink="`.length;
      
      onChange(node.id, newVal);
      setCursorPos(newCursor);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
      return;
    }

    setCursorPos(cur);
    onChange(node.id, val);

    // Check for [[ trigger
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');
    const lastCloseBrackets = textBeforeCursor.lastIndexOf(']]');

    if (lastOpenBrackets !== -1 && lastOpenBrackets > lastCloseBrackets) {
      const query = textBeforeCursor.slice(lastOpenBrackets + 2);
      setWikiQuery(query);
      setShowWikiDropdown(true);
      setWikiSelectedIndex(0);
    } else {
      setShowWikiDropdown(false);
    }
  };

  const insertWikiLink = async (title: string, createIfNew = false) => {
    const val = node.content;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');
    if (lastOpenBrackets !== -1) {
      const prefix = val.slice(0, lastOpenBrackets);
      const suffix = val.slice(cursorPos);
      const newText = `${prefix}[[${title}]] ${suffix}`;
      onChange(node.id, newText);
      setShowWikiDropdown(false);

      if (createIfNew && onCreateWikiNote) {
        // Automatically create the linked document if it doesn't already exist
        const exists = allNodes.some(n => n.content.trim().toLowerCase() === title.trim().toLowerCase());
        if (!exists) {
          await onCreateWikiNote(title.trim());
        }
      }

      setTimeout(() => {
        if (inputRef.current) {
          const newPos = prefix.length + title.length + 5;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  const handleWikiBadgeClick = async (e: React.MouseEvent, linkTitle: string) => {
    e.stopPropagation();
    e.preventDefault();

    const normalized = linkTitle.trim().toLowerCase();
    // Prioritize root documents or exact content matches
    let matched = allNodes.find(n => n.content.trim().toLowerCase() === normalized);
    if (!matched) {
      matched = allNodes.find(n => n.content.toLowerCase().includes(normalized));
    }

    if (matched && onSelectWikiLinkNode) {
      onSelectWikiLinkNode(matched.id);
    } else if (onCreateWikiNote) {
      // Create and navigate directly
      const newId = await onCreateWikiNote(linkTitle.trim());
      if (newId && onSelectWikiLinkNode) {
        onSelectWikiLinkNode(newId);
      }
    }
  };

  // Render clickable [[WikiLinks]], (slink="..."), and RemNote "::" concepts
  const renderFormattedPreview = () => {
    const text = node.content;
    if (!text) {
      return <span className="text-zinc-500 italic select-none">Empty bullet...</span>;
    }

    // Check if RemNote concept delimiter "::" exists
    if (text.includes('::')) {
      const [concept, ...rest] = text.split('::');
      const definition = rest.join('::');
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-red-400 bg-red-950/40 px-2 py-0.5 rounded-md border border-red-700/50 shadow-sm shadow-red-950/30">
            {concept.trim()}
          </span>
          <span className="text-red-500 font-mono text-xs px-1 select-none font-bold">::</span>
          <span className="text-zinc-200">{renderTokens(definition.trim())}</span>
        </span>
      );
    }

    return renderTokens(text);
  };

  const renderTokens = (raw: string) => {
    // Regex matching both [[WikiLinks]], [Label](slink="url"), and standalone (slink="url")
    // or (nlink="url")
    const combinedRegex = /(\[\[(.*?)\]\])|(?:\[(.*?)\])?\((?:slink|nlink)="(.*?)"\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(raw.slice(lastIndex, match.index));
      }

      if (match[1]) {
        // [[WikiLink]] match
        const linkTitle = match[2];
        parts.push(
          <span
            key={`wiki_${match.index}`}
            onClick={(e) => handleWikiBadgeClick(e, linkTitle)}
            className="wikilink-badge mx-0.5"
            title={`Open note [[${linkTitle}]]`}
          >
            <FileText className="w-3 h-3 text-red-400 inline shrink-0" />
            <span>[[{linkTitle}]]</span>
          </span>
        );
      } else {
        // (slink="url") match
        const label = match[3];
        let url = match[4] || '';
        const displayLabel = label || url || 'Link';
        const formattedHref = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

        parts.push(
          <a
            key={`slink_${match.index}`}
            href={formattedHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="slink-badge mx-0.5"
            title={`Open external link: ${formattedHref}`}
          >
            <ExternalLink className="w-3 h-3 text-rose-400 shrink-0" />
            <span>{displayLabel}</span>
          </a>
        );
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < raw.length) {
      parts.push(raw.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className="relative flex-1 min-w-0 py-0.5">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={node.content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => {
              setIsEditing(false);
              setShowWikiDropdown(false);
            }, 180);
          }}
          className="w-full bg-transparent text-zinc-100 placeholder-zinc-600 text-sm md:text-base outline-none focus:ring-0 border-b border-red-900/40 focus:border-red-500 transition-colors py-0.5 px-1 font-normal font-sans"
          placeholder="Type bullet, [[ for note link, or slink for URL..."
          autoFocus
        />
      ) : (
        <div
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => inputRef.current?.focus(), 10);
          }}
          className="w-full text-zinc-200 text-sm md:text-base py-0.5 px-1 cursor-text hover:bg-zinc-900/60 rounded transition-colors break-words min-h-[1.75rem]"
        >
          {renderFormattedPreview()}
        </div>
      )}

      {/* [[WikiLink]] Auto-complete dropdown - Shadow styled */}
      {showWikiDropdown && (
        <div className="absolute left-0 top-full mt-1.5 w-80 max-w-sm bg-[#101015] border border-red-900/60 rounded-xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur-md">
          <div className="px-3 py-1.5 text-xs text-zinc-400 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/60">
            <span className="flex items-center gap-1.5 font-medium text-red-400">
              <Search className="w-3 h-3" /> Link to Note:
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">↵ select / esc</span>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {matchingWikiNodes.map((target, idx) => (
              <button
                key={target.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertWikiLink(target.content);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  idx === wikiSelectedIndex
                    ? 'bg-red-950/50 text-red-200 font-medium border-l-2 border-red-500'
                    : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{target.content}</span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 font-mono">
                  {target.parent_id === null ? 'Doc' : 'Bullet'}
                </span>
              </button>
            ))}

            {/* Option to create new note if query provided */}
            {wikiQuery.trim() && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertWikiLink(wikiQuery.trim(), true);
                }}
                className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors border-t border-zinc-800/60 ${
                  wikiSelectedIndex === matchingWikiNodes.length
                    ? 'bg-red-950/60 text-red-300 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-red-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>
                  Create new note: <strong className="text-red-400">[[{wikiQuery.trim()}]]</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
