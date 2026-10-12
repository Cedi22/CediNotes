import React, { useState } from 'react';
import { NodeItem } from '../../types';
import { NodeEditor } from './NodeEditor';
import { ChevronRight, ChevronDown, Zap, Link as LinkIcon, Trash2, Plus } from 'lucide-react';

interface OutlinerNodeProps {
  node: NodeItem;
  allNodes: NodeItem[];
  level: number;
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
  onAddChildBullet?: (parentId: string) => void;
}

export const OutlinerNode: React.FC<OutlinerNodeProps> = ({
  node,
  allNodes,
  level,
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
  onAddChildBullet
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Direct children of this node
  const children = allNodes
    .filter(n => n.parent_id === node.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const hasChildren = children.length > 0;
  const isExpanded = node.is_expanded === 1 || node.is_expanded === true;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node.id);
  };

  return (
    <div
      className="group/node relative flex flex-col transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Row */}
      <div className="flex items-center gap-1.5 py-0.5 px-1.5 rounded-lg hover:bg-[#13131b] border border-transparent hover:border-red-950/40 transition-colors">
        {/* Toggle Expand / Collapse arrow */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.id)}
              className="text-zinc-500 hover:text-red-400 transition-colors p-0.5"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Bullet Point (Click to Zoom) */}
        <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
          <button
            type="button"
            onClick={() => onZoom(node.id)}
            className={`bullet-dot ${hasChildren && !isExpanded ? 'has-children-folded' : ''}`}
            title="Click to zoom in"
          />
        </div>

        {/* Text Input / Inline Markdown View */}
        <NodeEditor
          node={node}
          allNodes={allNodes}
          registerRef={registerRef}
          onEnter={onEnter}
          onIndent={onIndent}
          onOutdent={onOutdent}
          onBackspace={onBackspace}
          onChange={onChange}
          onNavigateVertical={onNavigateVertical}
          onSelectWikiLinkNode={onSelectWikiLinkNode}
          onCreateWikiNote={onCreateWikiNote}
        />

        {/* Hover Action Bar */}
        <div
          className={`flex items-center gap-1 ml-2 transition-opacity duration-150 shrink-0 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Quick Add Child Bullet Button */}
          {onAddChildBullet && (
            <button
              type="button"
              onClick={() => onAddChildBullet(node.id)}
              className="p-1 text-zinc-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors"
              title="Add sub-bullet"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Flashcard Generator Button */}
          <button
            type="button"
            onClick={() => onGenerateFlashcards(node.id)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-600/30 rounded transition-colors"
            title="Generate Q&A Flashcard from this note & children"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Card</span>
          </button>

          {/* Backlinks Button */}
          <button
            type="button"
            onClick={() => onShowBacklinks(node.id)}
            className="p-1 text-zinc-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
            title="View Backlinks"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (deletes parent and any child bullets) */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
            title={hasChildren ? 'Delete bullet and its contents' : 'Delete bullet'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Children Container */}
      {hasChildren && isExpanded && (
        <div className="outliner-children-indent">
          {children.map(child => (
            <OutlinerNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              level={level + 1}
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
          ))}
        </div>
      )}
    </div>
  );
};
