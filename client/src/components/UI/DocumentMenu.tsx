import React, { useState, useRef, useEffect } from 'react';
import { NodeItem } from '../../types';
import { 
  MoreVertical, 
  Star, 
  Edit3, 
  Trash2, 
  Copy, 
  Download,
  Zap
} from 'lucide-react';

interface DocumentMenuProps {
  node: NodeItem;
  onStar: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenDeck?: (id: string) => void;
  onExport?: (node: NodeItem) => void;
  className?: string;
  align?: 'left' | 'right';
}

export const DocumentMenu: React.FC<DocumentMenuProps> = ({
  node,
  onStar,
  onRename,
  onDelete,
  onDuplicate,
  onOpenDeck,
  onExport,
  className = '',
  align = 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isStarred = node.is_starred === 1 || node.is_starred === true;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    action();
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        title="More options"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors ${
          isOpen ? 'bg-zinc-800 text-zinc-100' : ''
        }`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1.5 w-44 bg-[#121218] border border-red-950/70 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-md text-xs select-none`}
        >
          {/* Star / Unstar */}
          <button
            type="button"
            onClick={(e) => handleAction(e, () => onStar(node.id))}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-amber-300 transition-colors"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isStarred ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
              }`}
            />
            <span>{isStarred ? 'Unstar' : 'Star'}</span>
          </button>

          {/* Rename */}
          <button
            type="button"
            onClick={(e) => handleAction(e, () => onRename(node.id))}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-red-300 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Rename</span>
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={(e) => handleAction(e, () => onDuplicate(node.id))}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-500" />
            <span>Duplicate</span>
          </button>

          {/* Flashcards */}
          {onOpenDeck && (
            <button
              type="button"
              onClick={(e) => handleAction(e, () => onOpenDeck(node.id))}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-amber-300 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Study Flashcards</span>
            </button>
          )}

          {/* Export */}
          {onExport && (
            <button
              type="button"
              onClick={(e) => handleAction(e, () => onExport(node))}
              className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export Markdown</span>
            </button>
          )}

          <div className="my-1 border-t border-zinc-800" />

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => handleAction(e, () => onDelete(node.id))}
            className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
