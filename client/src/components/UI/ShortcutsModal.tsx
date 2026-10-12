import React from 'react';
import { X, Keyboard, ArrowRight } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Enter', desc: 'Create a new sibling bullet below the current one' },
    { key: 'Tab', desc: 'Indent current bullet (nests under immediate previous sibling)' },
    { key: 'Shift + Tab', desc: 'Outdent current bullet (moves to current parent level)' },
    { key: 'Backspace', desc: 'On empty bullet, deletes it and focuses previous bullet' },
    { key: '↑ / ↓ Arrows', desc: 'Navigate vertically between visible bullet points' },
    { key: '[[', desc: 'Trigger bidirectional [[WikiLink]] search and autocomplete' },
    { key: '::', desc: 'Inline Concept :: Definition flashcard format' },
    { key: 'Space', desc: 'Flip flashcard between Question and Answer during study' },
    { key: '1, 2, 3, 4', desc: 'Rate retention in study session (Again, Hard, Good, Easy)' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-slate-100">Keyboard Shortcuts Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-normal pr-3">{s.desc}</span>
              <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 text-emerald-300 font-mono text-[11px] rounded shadow-sm shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
