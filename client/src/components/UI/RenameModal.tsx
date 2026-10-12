import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit3 } from 'lucide-react';

interface RenameModalProps {
  node: { id: string; content: string };
  onClose: () => void;
  onSave: (newTitle: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  node,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(node.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(node.content);
  }, [node.content]);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#0e0e13] border border-red-900/60 rounded-2xl shadow-2xl p-5 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
            <Edit3 className="w-4 h-4 text-red-500" />
            <span>Rename Document</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              Document Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-3.5 py-2.5 bg-[#14141c] border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
