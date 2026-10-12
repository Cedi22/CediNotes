import React, { useState } from 'react';
import { NodeItem, Breadcrumb } from '../../types';
import { OutlinerNode } from './OutlinerNode';
import { 
  ChevronRight, 
  Plus, 
  Home, 
  Zap, 
  Edit3, 
  Sparkles, 
  LayoutGrid, 
  List, 
  Star, 
  FileText, 
  Trash2, 
  Link as LinkIcon,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

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
  onCreateWikiNote?: (title: string) => Promise<string>;
  onRenameNode?: (id: string, newTitle: string) => void;
  onAddChildBullet?: (parentId: string) => void;
  onAddBullet: () => void;
  onStarNode?: (id: string) => void;
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
  onCreateWikiNote,
  onRenameNode,
  onAddChildBullet,
  onAddBullet,
  onStarNode
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('tree');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // If zoomed in, get current root node
  const currentZoomNode = zoomedNodeId ? nodes.find(n => n.id === zoomedNodeId) : null;

  // Filter root items for the current view
  const rootDisplayNodes = nodes
    .filter(n => n.parent_id === (zoomedNodeId || null))
    .sort((a, b) => a.sort_order - b.sort_order);

  // All root documents for Google Keep card view
  const rootDocuments = nodes
    .filter(n => n.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Handle Quick Note Submission (Google Keep style)
  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickInput.trim();
    if (!text) return;

    if (zoomedNodeId) {
      // Append bullet to current document
      const currentChildren = nodes.filter(n => n.parent_id === zoomedNodeId);
      const maxSort = currentChildren.reduce((max, n) => Math.max(max, n.sort_order), 0);
      onChange('new_bullet_trigger', text); // Or trigger add
      // We can create through onAddBullet with text
    }
    setQuickInput('');
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-8 py-6 select-text">
      {/* Breadcrumb Navigation when zoomed */}
      {zoomedNodeId && (
        <div className="mb-4 flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto pb-1 border-b border-zinc-850">
          <button
            type="button"
            onClick={() => onZoom('')}
            className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded-md hover:bg-zinc-900"
          >
            <Home className="w-3.5 h-3.5 text-red-500" />
            <span>Root Brain</span>
          </button>

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                <button
                  type="button"
                  onClick={() => onZoom(crumb.id)}
                  className={`px-2 py-1 rounded-md transition-colors truncate max-w-[180px] ${
                    isLast
                      ? 'text-red-400 font-semibold bg-red-950/40 border border-red-800/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  {crumb.content || 'Untitled'}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Zoomed Node Header with IN-PAGE RENAMING */}
      {currentZoomNode ? (
        <div className="mb-6 pb-4 border-b border-red-950/40">
          <div className="flex items-start justify-between gap-3 group">
            <div className="flex-1 min-w-0">
              {/* Editable Document Title */}
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={currentZoomNode.content}
                  onChange={(e) => onRenameNode?.(currentZoomNode.id, e.target.value)}
                  onFocus={() => setIsEditingTitle(true)}
                  onBlur={() => setIsEditingTitle(false)}
                  placeholder="Untitled Document"
                  className="w-full text-2xl md:text-3xl font-extrabold text-zinc-100 bg-transparent outline-none border-b-2 border-transparent focus:border-red-600 transition-colors py-1 px-1 tracking-tight placeholder-zinc-600"
                />
                <Edit3 className={`w-4 h-4 text-red-500/50 shrink-0 transition-opacity ${isEditingTitle ? 'opacity-100 text-red-400' : 'opacity-0 group-hover:opacity-100'}`} />
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {rootDisplayNodes.length} bullet{rootDisplayNodes.length === 1 ? '' : 's'}
                </span>

                <button
                  onClick={() => onGenerateFlashcards(currentZoomNode.id)}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-600/30 transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Study Flashcards</span>
                </button>

                <button
                  onClick={() => onShowBacklinks(currentZoomNode.id)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-red-300 hover:bg-zinc-900 px-2 py-0.5 rounded-md transition-colors"
                >
                  <LinkIcon className="w-3 h-3 text-red-400" />
                  <span>Backlinks</span>
                </button>

                {onStarNode && (
                  <button
                    onClick={() => onStarNode(currentZoomNode.id)}
                    className="flex items-center gap-1 text-zinc-400 hover:text-amber-300 hover:bg-zinc-900 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <Star className={`w-3.5 h-3.5 ${currentZoomNode.is_starred ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
                    <span>{currentZoomNode.is_starred ? 'Starred' : 'Star'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Top Header for Root Brain / All Notes */
        <div className="mb-6 flex items-center justify-between pb-3 border-b border-red-950/40">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444]" />
              <span>Shadow Brain</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {rootDocuments.length} document{rootDocuments.length === 1 ? '' : 's'} • {nodes.length} total rem nodes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Google Keep Cards vs Tree) */}
            <div className="flex items-center p-0.5 bg-zinc-900/80 border border-zinc-800 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'tree' ? 'bg-red-950/60 text-red-400 border border-red-800/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Tree Outliner View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'cards' ? 'bg-red-950/60 text-red-400 border border-red-800/40' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Google Keep Card Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onAddBullet}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md shadow-red-950/40 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </button>
          </div>
        </div>
      )}

      {/* Google Keep-Style Note Card Grid (When on Root Brain and Cards View selected) */}
      {!zoomedNodeId && viewMode === 'cards' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {rootDocuments.map((doc) => {
              const children = nodes
                .filter(n => n.parent_id === doc.id)
                .sort((a, b) => a.sort_order - b.sort_order);

              return (
                <div
                  key={doc.id}
                  onClick={() => onZoom(doc.id)}
                  className="keep-card keep-card-accent-red p-4 flex flex-col justify-between cursor-pointer group min-h-[140px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-zinc-100 group-hover:text-red-400 transition-colors line-clamp-1">
                        {doc.content || 'Untitled Note'}
                      </h3>
                      {doc.is_starred ? (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      ) : null}
                    </div>

                    {/* Snippet preview of child bullets */}
                    <div className="space-y-1 text-xs text-zinc-400">
                      {children.slice(0, 4).map(child => (
                        <div key={child.id} className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600/60 shrink-0" />
                          <span className="truncate">{child.content || '...'}</span>
                        </div>
                      ))}
                      {children.length > 4 && (
                        <div className="text-[10px] text-zinc-500 italic">
                          +{children.length - 4} more bullets...
                        </div>
                      )}
                      {children.length === 0 && (
                        <div className="text-zinc-600 italic text-[11px]">Empty document</div>
                      )}
                    </div>
                  </div>

                  {/* Card bottom footer */}
                  <div className="mt-4 pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-mono text-[10px]">
                      {children.length} bullets
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateFlashcards(doc.id);
                        }}
                        className="p-1 text-amber-400 hover:bg-amber-950/40 rounded"
                        title="Study cards"
                      >
                        <Zap className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(doc.id);
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Outliner Tree View */
        <div className="space-y-1">
          {rootDisplayNodes.length > 0 ? (
            rootDisplayNodes.map((childNode) => (
              <OutlinerNode
                key={childNode.id}
                node={childNode}
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
                onCreateWikiNote={onCreateWikiNote}
                onAddChildBullet={onAddChildBullet}
              />
            ))
          ) : (
            <div className="text-center py-12 px-4 border border-dashed border-red-950/50 rounded-2xl bg-[#0d0d12]/60">
              <div className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 mx-auto mb-3 shadow-[0_0_12px_rgba(220,38,38,0.25)]">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">No bullets here yet</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                Click the button below or press Enter to add your first bullet point. Type <code className="text-red-400 font-mono">[[</code> to link notes or <code className="text-rose-400 font-mono">slink</code> to insert a URL.
              </p>
              <button
                type="button"
                onClick={onAddBullet}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Bullet</span>
              </button>
            </div>
          )}

          {/* Bottom Add Bullet Button to make adding notes easy */}
          {rootDisplayNodes.length > 0 && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onAddBullet}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-300 hover:bg-[#15151e] rounded-lg transition-colors border border-transparent hover:border-red-900/40 group"
              >
                <Plus className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                <span>Add bullet (or press Enter)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
