import React, { useState } from 'react';
import { NodeItem } from '../../types';
import { NodeEditor } from './NodeEditor';
import { ChevronRight, ChevronDown, Zap, Link as LinkIcon, Trash2, Plus, Sparkles } from 'lucide-react';

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
  onSelectWikiLinkNode
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Direct children of this node
  const children = allNodes
    .filter(n => n.parent_id === node.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const hasChildren = children.length > 0;
  const isExpanded = node.is_expanded === 1 || node.is_expanded === true;

  return (
    <div
      className="group/node relative flex flex-col transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Node Row */}
      <div className="flex items-center gap-1.5 py-0.5 px-1 rounded-md hover:bg-slate-850/50 transition-colors">
        {/* Toggle Expand / Collapse arrow */}
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.id)}
              className="text-slate-400 hover:text-slate-200 transition-transform p-0.5"
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
        />

        {/* Hover Action Bar */}
        <div
          className={`flex items-center gap-1 ml-2 transition-opacity duration-150 shrink-0 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Flashcard Generator Button (Step 5) */}
          <button
            type="button"
            onClick={() => onGenerateFlashcards(node.id)}
            className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors"
            title="Generate Q&A Flashcard from this Rem & children"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Card</span>
          </button>

          {/* Backlinks Button */}
          <button
            type="button"
            onClick={() => onShowBacklinks(node.id)}
            className="p-1 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded transition-colors"
            title="View Backlinks"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
            title="Delete bullet"
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
            />
          ))}
        </div>
      )}
    </div>
  );
};
