import React, { useState } from 'react';
import { NodeItem, FlashcardStats } from '../../types';
import { BookOpen, Plus, Search, Sparkles, Brain, Layers, Keyboard, CheckCircle2 } from 'lucide-react';

interface SidebarProps {
  nodes: NodeItem[];
  zoomedNodeId: string | null;
  onZoom: (id: string | null) => void;
  onCreateRootNode: () => void;
  onOpenStudyDeck: () => void;
  onOpenShortcuts: () => void;
  flashcardStats: FlashcardStats;
  savingStatus: 'idle' | 'saving' | 'saved';
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  zoomedNodeId,
  onZoom,
  onCreateRootNode,
  onOpenStudyDeck,
  onOpenShortcuts,
  flashcardStats,
  savingStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Top level root documents
  const rootDocuments = nodes
    .filter(n => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const filteredNodes = searchQuery.trim()
    ? nodes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  return (
    <aside className="w-64 md:w-72 bg-[#090d16] border-r border-slate-800 flex flex-col shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onZoom(null)}>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-slate-100">CediNote</h1>
            <p className="text-[10px] text-slate-400 font-mono">Local Knowledge Brain</p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          {savingStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Syncing
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Local DB
            </span>
          )}
          {savingStatus === 'idle' && (
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 space-y-1.5 border-b border-slate-800/80">
        <button
          type="button"
          onClick={onCreateRootNode}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors group shadow-sm"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>New Document</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">↵</span>
        </button>

        {/* Flashcard Study Action */}
        <button
          type="button"
          onClick={onOpenStudyDeck}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Study Flashcards</span>
          </span>
          {flashcardStats.dueCards > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
              {flashcardStats.dueCards}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">{flashcardStats.totalCards} cards</span>
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or [[WikiLinks]]..."
            className="w-full bg-slate-900/80 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-md border border-slate-800 focus:border-sky-500/60 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Search Results (if searching) */}
      {searchQuery.trim() && (
        <div className="px-3 pb-2 max-h-48 overflow-y-auto space-y-1">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-1">
            Matching Rems ({filteredNodes.length})
          </div>
          {filteredNodes.length > 0 ? (
            filteredNodes.map(node => (
              <button
                key={node.id}
                onClick={() => {
                  onZoom(node.id);
                  setSearchQuery('');
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 rounded truncate block transition-colors"
              >
                {node.content || 'Untitled'}
              </button>
            ))
          ) : (
            <div className="text-xs text-slate-500 px-1 py-1">No matches found.</div>
          )}
        </div>
      )}

      {/* Documents Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-slate-500" />
          <span>Documents</span>
        </div>

        <button
          type="button"
          onClick={() => onZoom(null)}
          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
            zoomedNodeId === null
              ? 'bg-slate-800 text-emerald-400 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">All Notes</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">{nodes.length}</span>
        </button>

        {rootDocuments.map(doc => {
          const isSelected = zoomedNodeId === doc.id;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onZoom(doc.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-slate-800 text-sky-300 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <span className="truncate pr-1">{doc.content || 'Untitled Document'}</span>
            </button>
          );
        })}
      </div>

      {/* Footer / Keyboard shortcuts guide */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5 text-slate-500" />
          <span>Keyboard Shortcuts</span>
        </button>
      </div>
    </aside>
  );
};
