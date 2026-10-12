import React from 'react';
import { NodeItem, Breadcrumb } from '../../types';
import { OutlinerNode } from './OutlinerNode';
import { ChevronRight, Plus, Home, Sparkles } from 'lucide-react';

interface OutlinerTreeProps {
  nodes: NodeItem[];
  zoomedNodeId: string | null;
  breadcrumbs: Breadcrumb[];
  registerRef: (id: string, el: HTMLInputElement | null) => void;
  onEnter: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
  onBackspace: (id: string) => void;
  onChange: (id: string, value: string) => void;
  onNavigateVertical: (id: string, dir: 'up' | 'down') => void;
  onToggleExpand: (id: string) => void;
  onZoom: (id: string) => void;
  onGenerateFlashcards: (id: string) => void;
  onShowBacklinks: (id: string) => void;
  onDelete: (id: string) => void;
  onSelectWikiLinkNode: (id: string) => void;
  onAddBullet: () => void;
}

export const OutlinerTree: React.FC<OutlinerTreeProps> = ({
  nodes,
  zoomedNodeId,
  breadcrumbs,
  registerRef,
  onEnter,
  onIndent,
  onOutdent,
  onBackspace,
  onChange,
  onNavigateVertical,
  onToggleExpand,
  onZoom,
  onGenerateFlashcards,
  onShowBacklinks,
  onDelete,
  onSelectWikiLinkNode,
  onAddBullet
}) => {
  // If zoomed in, get the current root node
  const currentZoomNode = zoomedNodeId ? nodes.find(n => n.id === zoomedNodeId) : null;

  // Filter root items for the current view
  const rootDisplayNodes = nodes
    .filter(n => n.parent_id === (zoomedNodeId || null))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-8 py-6">
      {/* Breadcrumb Navigation when zoomed */}
      {zoomedNodeId && (
        <div className="mb-6 flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto pb-1 border-b border-slate-850">
          <button
            type="button"
            onClick={() => onZoom('')}
            className="flex items-center gap-1 hover:text-emerald-400 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Root Brain</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <button
                  type="button"
                  onClick={() => onZoom(crumb.id)}
                  className={`px-1.5 py-0.5 rounded transition-colors truncate max-w-[180px] ${
                    isLast
                      ? 'text-emerald-400 font-semibold bg-emerald-950/30'
                      : 'hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {crumb.content || 'Untitled'}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Zoomed Node Header */}
      {currentZoomNode && (
        <div className="mb-6 pb-4 border-b border-slate-800/80">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-2">
            <span>{currentZoomNode.content || 'Untitled Rem'}</span>
          </h1>
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
            <button
              onClick={() => onGenerateFlashcards(currentZoomNode.id)}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20"
            >
              <Sparkles className="w-3 h-3" /> Generate Flashcards
            </button>
            <button
              onClick={() => onShowBacklinks(currentZoomNode.id)}
              className="text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20"
            >
              References & Backlinks
            </button>
          </div>
        </div>
      )}

      {/* The Outliner Tree List */}
      <div className="space-y-0.5">
        {rootDisplayNodes.length > 0 ? (
          rootDisplayNodes.map(node => (
            <OutlinerNode
              key={node.id}
              node={node}
              allNodes={nodes}
              level={0}
              registerRef={registerRef}
              onEnter={onEnter}
              onIndent={onIndent}
              onOutdent={onOutdent}
              onBackspace={onBackspace}
              onChange={onChange}
              onNavigateVertical={onNavigateVertical}
              onToggleExpand={onToggleExpand}
              onZoom={onZoom}
              onGenerateFlashcards={onGenerateFlashcards}
              onShowBacklinks={onShowBacklinks}
              onDelete={onDelete}
              onSelectWikiLinkNode={onSelectWikiLinkNode}
            />
          ))
        ) : (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">No notes at this level yet.</p>
            <button
              type="button"
              onClick={onAddBullet}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-md hover:bg-emerald-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Bullet
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Bullet at Bottom */}
      {rootDisplayNodes.length > 0 && (
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={onAddBullet}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5 rounded hover:bg-slate-800/50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add new bullet</span>
          </button>
        </div>
      )}
    </div>
  );
};
