import React, { useState } from 'react';
import { NodeItem, FlashcardStats } from '../../types';
import { DocumentMenu } from '../UI/DocumentMenu';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Brain, 
  Layers, 
  Keyboard, 
  CheckCircle2, 
  Star, 
  FileText,
  Zap
} from 'lucide-react';

interface SidebarProps {
  nodes: NodeItem[];
  zoomedNodeId: string | null;
  onZoom: (id: string | null) => void;
  onCreateRootNode: () => void;
  onOpenStudyDeck: (nodeId?: string) => void;
  onOpenShortcuts: () => void;
  onStar: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport?: (node: NodeItem) => void;
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
  onStar,
  onRename,
  onDelete,
  onDuplicate,
  onExport,
  flashcardStats,
  savingStatus
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Top level root documents
  const rootDocuments = nodes
    .filter((n) => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const starredDocuments = rootDocuments.filter(
    (n) => n.is_starred === 1 || n.is_starred === true
  );

  const unstarredDocuments = rootDocuments.filter(
    (n) => !(n.is_starred === 1 || n.is_starred === true)
  );

  const filteredNodes = searchQuery.trim()
    ? nodes
        .filter((n) => n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 8)
    : [];

  const renderDocumentItem = (doc: NodeItem) => {
    const isSelected = zoomedNodeId === doc.id;
    const isStarred = doc.is_starred === 1 || doc.is_starred === true;

    return (
      <div
        key={doc.id}
        onClick={() => onZoom(doc.id)}
        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
          isSelected
            ? 'bg-red-950/40 text-red-200 font-semibold border-l-2 border-red-500 shadow-sm'
            : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-100'
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {isStarred ? (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 shrink-0 transition-colors" />
          )}
          <span className="truncate">{doc.content || 'Untitled Document'}</span>
        </div>

        {/* '...' menu */}
        <div
          className={`shrink-0 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <DocumentMenu
            node={doc}
            onStar={onStar}
            onRename={onRename}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onOpenDeck={(id) => onOpenStudyDeck(id)}
            onExport={onExport}
          />
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-[#0a0a0f] border-r border-red-950/40 flex flex-col justify-between select-none">
      {/* Top Header / App Branding */}
      <div>
        <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(220,38,38,0.35)]">
              <span className="font-black text-sm tracking-tighter">CN</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-zinc-100 tracking-tight">CediNote</span>
                <span className="px-1 py-0.2 text-[9px] font-bold bg-red-900/60 text-red-300 rounded border border-red-700/40 font-mono">
                  DARK
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                {savingStatus === 'saving' && (
                  <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                    Saving...
                  </span>
                )}
                {savingStatus === 'saved' && (
                  <span className="text-red-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                  </span>
                )}
                {savingStatus === 'idle' && <span>Local-First Brain</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search brain..."
              className="w-full bg-[#121218] border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {/* Quick search popup results */}
          {searchQuery.trim() && (
            <div className="mt-2 bg-[#121218] border border-red-950/80 rounded-lg shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onZoom(n.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-red-950/40 hover:text-red-200 truncate flex items-center gap-1.5"
                  >
                    <FileText className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{n.content || 'Untitled'}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-zinc-500 italic">No notes found</div>
              )}
            </div>
          )}
        </div>

        {/* Actions Button Bar */}
        <div className="px-3 space-y-1.5">
          <button
            type="button"
            onClick={onCreateRootNode}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-950/50 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenStudyDeck()}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-600/30 rounded-lg transition-colors font-medium"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Study Deck</span>
            </div>
            {flashcardStats.dueCards > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded-full text-[10px] font-bold">
                {flashcardStats.dueCards}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Middle Scrollable Section: Root & Starred Documents */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* All Notes Root Option */}
        <div>
          <button
            type="button"
            onClick={() => onZoom(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
              zoomedNodeId === null
                ? 'bg-red-950/40 text-red-200 font-bold border-l-2 border-red-500'
                : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>All Notes (Brain)</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {nodes.length}
            </span>
          </button>
        </div>

        {/* Starred Section */}
        {starredDocuments.length > 0 && (
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-widest px-2 py-1 flex items-center gap-1.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Starred</span>
            </div>
            {starredDocuments.map(renderDocumentItem)}
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-zinc-600" />
            <span>Documents</span>
          </div>

          {unstarredDocuments.length > 0 ? (
            unstarredDocuments.map(renderDocumentItem)
          ) : starredDocuments.length === 0 ? (
            <div className="text-xs text-zinc-500 px-2 py-2 italic">
              No documents created yet.
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer / Keyboard shortcuts guide */}
      <div className="p-3 border-t border-zinc-850 bg-[#08080c] flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5 text-zinc-500" />
          <span>Shortcuts</span>
        </button>

        <span className="text-[10px] text-zinc-600 font-mono">v1.1</span>
      </div>
    </aside>
  );
};
