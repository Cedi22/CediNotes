import React, { useEffect, useState } from 'react';
import { LinkItem, NodeItem } from '../../types';
import { api } from '../../services/api';
import { Link as LinkIcon, X, ArrowUpRight, FileText } from 'lucide-react';

interface BacklinksPanelProps {
  nodeId: string | null;
  nodes: NodeItem[];
  onClose: () => void;
  onNavigateToNode: (id: string) => void;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  nodeId,
  nodes,
  onClose,
  onNavigateToNode
}) => {
  const [backlinks, setBacklinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  const currentNode = nodeId ? nodes.find(n => n.id === nodeId) : null;

  useEffect(() => {
    if (!nodeId) return;

    let isMounted = true;
    setLoading(true);

    api.getBacklinks(nodeId)
      .then(links => {
        if (isMounted) setBacklinks(links);
      })
      .catch(err => console.error('Failed to load backlinks:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [nodeId]);

  if (!nodeId) return null;

  return (
    <aside className="w-80 bg-[#0d1322] border-l border-slate-800 flex flex-col shrink-0 h-screen shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-100">Linked References</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Node Context */}
      <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800/80">
        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Active Rem:</span>
        <div className="text-xs font-medium text-sky-300 truncate mt-0.5">
          {currentNode?.content || 'Untitled'}
        </div>
      </div>

      {/* Backlinks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500">Scanning brain backlinks...</div>
        ) : backlinks.length > 0 ? (
          <div className="space-y-2.5">
            <div className="text-xs text-slate-400 font-medium">
              {backlinks.length} incoming {backlinks.length === 1 ? 'reference' : 'references'}:
            </div>
            {backlinks.map((link) => (
              <div
                key={link.source_id}
                onClick={() => onNavigateToNode(link.source_id)}
                className="group p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-slate-300 font-medium group-hover:text-sky-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
                    <span className="truncate">{link.content || 'Untitled Node'}</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-sky-400 transition-opacity shrink-0" />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-400 line-clamp-2">
                  Mentioned in {new Date(link.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 text-slate-500">
            <LinkIcon className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-medium">No incoming backlinks yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Link to this node from elsewhere using <code className="text-sky-400">[[{currentNode?.content || 'title'}]]</code>.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
