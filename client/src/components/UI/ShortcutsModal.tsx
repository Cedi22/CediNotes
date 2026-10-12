import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Enter', desc: 'Create a new sibling bullet below the current one' },
    { key: 'Tab', desc: 'Indent current bullet (nests under immediate previous sibling)' },
    { key: 'Shift + Tab', desc: 'Outdent current bullet (moves to current parent level)' },
    { key: 'Backspace', desc: 'Deletes empty bullet, or promotes children if parent' },
    { key: 'Trash (🗑️)', desc: 'Deletes bullet and ALL its nested child bullets' },
    { key: '↑ / ↓ Arrows', desc: 'Navigate vertically between visible bullet points' },
    { key: 'slink / nlink', desc: 'Auto-expands to (slink="") for clickable hyperlinks' },
    { key: '[[', desc: 'Trigger bidirectional [[WikiLink]] search, create & jump' },
    { key: '::', desc: 'Inline Concept :: Definition flashcard format' },
    { key: 'Space', desc: 'Flip flashcard between Question and Answer during study' },
    { key: '1, 2, 3, 4', desc: 'Rate retention in study session (Again, Hard, Good, Easy)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0e0e13] border border-red-900/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#121218]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-sm text-zinc-100">Keyboard Shortcuts Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#14141c] border border-zinc-850 text-xs"
            >
              <span className="text-zinc-300 font-normal pr-3">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#09090d] border border-red-900/50 text-red-300 font-mono text-[11px] rounded shadow-sm shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-zinc-850 bg-[#0a0a0e] text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
