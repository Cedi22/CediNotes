import React from 'react';
import { NodeItem } from '../../types';
import { DocumentMenu } from './DocumentMenu';
import { Star, FileText, Plus, X, Layers } from 'lucide-react';

interface DocumentTabsProps {
  openTabIds: string[];
  activeTabId: string | null;
  nodes: NodeItem[];
  onSelectTab: (id: string | null) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onStar: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenDeck?: (id: string) => void;
  onExport?: (node: NodeItem) => void;
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({
  openTabIds,
  activeTabId,
  nodes,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onStar,
  onRename,
  onDelete,
  onDuplicate,
  onOpenDeck,
  onExport
}) => {
  return (
    <div className="flex items-center bg-[#07070b] border-b border-zinc-850 px-2 overflow-x-auto no-scrollbar select-none shrink-0 h-10">
      <div className="flex items-center gap-1 min-w-max">
        {/* All Notes / Brain Root Tab */}
        <button
          type="button"
          onClick={() => onSelectTab(null)}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTabId === null
              ? 'bg-[#12121a] text-red-400 border border-red-950/80 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5 shrink-0 text-red-500" />
          <span>All Notes</span>
        </button>

        {/* Dynamic Document Tabs */}
        {openTabIds.map((tabId) => {
          const node = nodes.find((n) => n.id === tabId);
          if (!node) return null;

          const isActive = activeTabId === tabId;
          const isStarred = node.is_starred === 1 || node.is_starred === true;

          return (
            <div
              key={tabId}
              onClick={() => onSelectTab(tabId)}
              className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                isActive
                  ? 'bg-[#12121a] text-zinc-100 border-red-950/80 shadow-sm border-b-red-600'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-transparent'
              }`}
            >
              {/* Starred or File Icon */}
              {isStarred ? (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 shrink-0 transition-colors" />
              )}

              {/* Title */}
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {node.content || 'Untitled Document'}
              </span>

              {/* '...' Menu on Tab */}
              <div
                className={`transition-opacity ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <DocumentMenu
                  node={node}
                  onStar={onStar}
                  onRename={onRename}
                  onDelete={(id) => {
                    onCloseTab(id);
                    onDelete(id);
                  }}
                  onDuplicate={onDuplicate}
                  onOpenDeck={onOpenDeck}
                  onExport={onExport}
                />
              </div>

              {/* Close Tab Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabId);
                }}
                className="p-0.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Close Tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Plus button to open new tab */}
        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors ml-1"
          title="New Document Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
