import React, { useState, useRef, useEffect } from 'react';
import { NodeItem } from '../../types';
import { Search } from 'lucide-react';

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
  onSelectWikiLinkNode
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
    .slice(0, 6);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. If WikiLink autocomplete dropdown is open
    if (showWikiDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setWikiSelectedIndex(prev => (prev + 1) % (matchingWikiNodes.length || 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setWikiSelectedIndex(prev => (prev - 1 + (matchingWikiNodes.length || 1)) % (matchingWikiNodes.length || 1));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (matchingWikiNodes[wikiSelectedIndex]) {
          insertWikiLink(matchingWikiNodes[wikiSelectedIndex].content);
        } else if (wikiQuery) {
          insertWikiLink(wikiQuery);
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

    // 4. Backspace: If node is empty, delete it and focus previous node
    if (e.key === 'Backspace') {
      const input = inputRef.current;
      if (!node.content || node.content.length === 0 || (input && input.selectionStart === 0 && input.selectionEnd === 0)) {
        if (!node.content || node.content.length === 0) {
          e.preventDefault();
          onBackspace(node.id);
          return;
        }
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
    const val = e.target.value;
    const cur = e.target.selectionStart || 0;
    setCursorPos(cur);
    onChange(node.id, val);

    // Check for [[ trigger
    const textBeforeCursor = val.slice(0, cur);
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

  const insertWikiLink = (title: string) => {
    const val = node.content;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf('[[');
    if (lastOpenBrackets !== -1) {
      const prefix = val.slice(0, lastOpenBrackets);
      const suffix = val.slice(cursorPos);
      const newText = `${prefix}[[${title}]] ${suffix}`;
      onChange(node.id, newText);
      setShowWikiDropdown(false);
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = prefix.length + title.length + 5;
          inputRef.current.setSelectionRange(newPos, newPos);
        }
      }, 10);
    }
  };

  // Render clickable [[WikiLinks]] and RemNote "::" concepts when not actively focused
  const renderFormattedPreview = () => {
    const text = node.content;
    if (!text) {
      return <span className="text-slate-500 italic select-none">Empty bullet...</span>;
    }

    // Check if RemNote concept delimiter "::" exists
    if (text.includes('::')) {
      const [concept, ...rest] = text.split('::');
      const definition = rest.join('::');
      return (
        <span className="inline-flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/50">
            {concept.trim()}
          </span>
          <span className="text-emerald-500 font-mono text-xs px-1 select-none">::</span>
          <span className="text-slate-200">{renderWikiLinkSpans(definition.trim())}</span>
        </span>
      );
    }

    return renderWikiLinkSpans(text);
  };

  const renderWikiLinkSpans = (raw: string) => {
    const parts = [];
    const regex = /\[\[(.*?)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        parts.push(raw.slice(lastIndex, match.index));
      }
      const linkTitle = match[1];
      const matchedNode = allNodes.find(n => n.content.toLowerCase().includes(linkTitle.toLowerCase()));

      parts.push(
        <span
          key={match.index}
          onClick={(e) => {
            e.stopPropagation();
            if (matchedNode && onSelectWikiLinkNode) {
              onSelectWikiLinkNode(matchedNode.id);
            }
          }}
          className="wikilink-badge mx-0.5"
          title={`Jump to [[${linkTitle}]]`}
        >
          [[{linkTitle}]]
        </span>
      );
      lastIndex = regex.lastIndex;
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
            // Delay closing to allow clicking dropdown items
            setTimeout(() => {
              setIsEditing(false);
              setShowWikiDropdown(false);
            }, 180);
          }}
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base outline-none focus:ring-0 border-b border-transparent focus:border-slate-700 transition-colors py-0.5 px-1 font-normal font-sans"
          placeholder="Type something or [[ to link..."
          autoFocus
        />
      ) : (
        <div
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => inputRef.current?.focus(), 10);
          }}
          className="w-full text-slate-200 text-sm md:text-base py-0.5 px-1 cursor-text hover:bg-slate-800/40 rounded transition-colors break-words min-h-[1.75rem]"
        >
          {renderFormattedPreview()}
        </div>
      )}

      {/* [[WikiLink]] Auto-complete dropdown */}
      {showWikiDropdown && (
        <div className="absolute left-0 top-full mt-1 w-72 max-w-sm bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden py-1 backdrop-blur-md">
          <div className="px-2.5 py-1.5 text-xs text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-sky-400">
              <Search className="w-3 h-3" /> Link to node:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">↵ select</span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {matchingWikiNodes.length > 0 ? (
              matchingWikiNodes.map((target, idx) => (
                <button
                  key={target.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertWikiLink(target.content);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    idx === wikiSelectedIndex ? 'bg-sky-600/30 text-sky-200' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate pr-2">{target.content}</span>
                  <span className="text-[10px] text-slate-500">Node</span>
                </button>
              ))
            ) : (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (wikiQuery.trim()) insertWikiLink(wikiQuery.trim());
                }}
                className="px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Create new note <span className="text-sky-400 font-semibold">[[{wikiQuery}]]</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
