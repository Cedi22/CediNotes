import React, { useState, useEffect, useCallback } from 'react';
import { useOutliner } from './hooks/useOutliner';
import { Sidebar } from './components/Sidebar/Sidebar';
import { OutlinerTree } from './components/Outliner/OutlinerTree';
import { BacklinksPanel } from './components/Backlinks/BacklinksPanel';
import { FlashcardModal } from './components/Flashcards/FlashcardModal';
import { StudyDeckModal } from './components/Flashcards/StudyDeckModal';
import { ShortcutsModal } from './components/UI/ShortcutsModal';
import { DocumentTabs } from './components/UI/DocumentTabs';
import { RenameModal } from './components/UI/RenameModal';
import { FlashcardStats, NodeItem } from './types';
import { api } from './services/api';
import { Menu, Keyboard, Brain, Plus, Zap } from 'lucide-react';

export default function App() {
  const {
    nodes,
    loading,
    activeNodeId,
    setActiveNodeId,
    zoomedNodeId,
    setZoomedNodeId,
    breadcrumbs,
    savingStatus,
    registerInputRef,
    focusNode,
    handleEnter,
    handleIndent,
    handleOutdent,
    handleBackspace,
    handleDeleteNode,
    handleRenameNode,
    handleAddChildBullet,
    handleContentChange,
    toggleExpand,
    handleNavigateVertical,
    createRootNode,
    loadNodes
  } = useOutliner();

  // Document Tabs state
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);

  // Modals and side panels
  const [backlinksTargetId, setBacklinksTargetId] = useState<string | null>(null);
  const [flashcardTargetId, setFlashcardTargetId] = useState<string | null>(null);
  const [studyDeckNodeId, setStudyDeckNodeId] = useState<string | null>(null);
  const [isStudyDeckOpen, setIsStudyDeckOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Rename modal state (for tab / sidebar menus)
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);

  // Deck statistics
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats>({
    totalCards: 0,
    dueCards: 0,
    masteredCards: 0
  });

  const refreshStats = useCallback(async () => {
    try {
      const stats = await api.getFlashcardStats();
      setFlashcardStats(stats);
    } catch (err) {
      console.error('Failed to load flashcard stats:', err);
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Sync initial root documents into openTabIds
  useEffect(() => {
    if (nodes.length > 0 && openTabIds.length === 0) {
      const rootDocs = nodes.filter((n) => n.parent_id === null);
      if (rootDocs.length > 0) {
        setOpenTabIds(rootDocs.slice(0, 6).map((n) => n.id));
      }
    }
  }, [nodes, openTabIds.length]);

  // Ensure zoomed node is included in open tabs
  useEffect(() => {
    if (zoomedNodeId && !openTabIds.includes(zoomedNodeId)) {
      setOpenTabIds((prev) => [...prev, zoomedNodeId]);
    }
  }, [zoomedNodeId, openTabIds]);

  // Tab management
  const handleSelectTab = (id: string | null) => {
    setZoomedNodeId(id);
  };

  const handleCloseTab = (id: string) => {
    const updated = openTabIds.filter((t) => t !== id);
    setOpenTabIds(updated);
    if (zoomedNodeId === id) {
      setZoomedNodeId(updated.length > 0 ? updated[updated.length - 1] : null);
    }
  };

  const handleNewTab = async () => {
    const newNode = await createRootNode('Untitled Document');
    if (newNode) {
      setOpenTabIds((prev) => [...prev, newNode.id]);
      setZoomedNodeId(newNode.id);
    }
  };

  // Node Actions (... menu)
  const handleStar = async (id: string) => {
    try {
      await api.toggleStarNode(id);
      loadNodes();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const handleOpenRename = (id: string) => {
    setRenameTargetId(id);
  };

  const handleSaveRename = async (newTitle: string) => {
    if (!renameTargetId) return;
    try {
      await handleRenameNode(renameTargetId, newTitle);
      loadNodes();
    } catch (err) {
      console.error('Failed to rename note:', err);
    } finally {
      setRenameTargetId(null);
    }
  };

  const handleDelete = async (id: string) => {
    const node = nodes.find((n) => n.id === id);
    const title = node?.content || 'this note';
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its contents?`)) {
      return;
    }

    try {
      await handleDeleteNode(id);
      setOpenTabIds((prev) => prev.filter((t) => t !== id));
      if (zoomedNodeId === id) {
        setZoomedNodeId(null);
      }
      refreshStats();
    } catch (err) {
      console.error('Failed to delete node:', err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await api.duplicateNode(id);
      await loadNodes();
      setOpenTabIds((prev) => [...prev, duplicated.id]);
      setZoomedNodeId(duplicated.id);
    } catch (err) {
      console.error('Failed to duplicate node:', err);
    }
  };

  const handleExportMarkdown = (docNode: NodeItem) => {
    const getSubtreeMarkdown = (parentId: string, depth = 0): string => {
      const indent = '  '.repeat(depth);
      const children = nodes
        .filter((n) => n.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order);
      let md = '';
      for (const child of children) {
        md += `${indent}- ${child.content || ''}\n`;
        md += getSubtreeMarkdown(child.id, depth + 1);
      }
      return md;
    };

    let content = `# ${docNode.content || 'Untitled Document'}\n\n`;
    content += getSubtreeMarkdown(docNode.id, 0);

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (docNode.content || 'document').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
    a.download = `${safeTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Automatically create note from [[WikiLink]] and return its ID
  const handleCreateWikiNote = async (title: string): Promise<string> => {
    const newNode = await createRootNode(title);
    if (newNode) {
      setOpenTabIds(prev => [...prev, newNode.id]);
      return newNode.id;
    }
    return '';
  };

  // Handle adding a bullet directly from UI button
  const handleAddBullet = () => {
    if (zoomedNodeId) {
      api.createNode({
        parent_id: zoomedNodeId,
        content: '',
        is_expanded: true
      }).then((created) => {
        loadNodes();
        focusNode(created.id, true);
      });
    } else {
      createRootNode('');
    }
  };

  const nodeBeingRenamed = renameTargetId ? nodes.find((n) => n.id === renameTargetId) : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08080b] text-zinc-100 font-sans">
      {/* Sidebar (Desktop & Mobile drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar
          nodes={nodes}
          zoomedNodeId={zoomedNodeId}
          onZoom={(id) => {
            setZoomedNodeId(id);
            setIsMobileSidebarOpen(false);
          }}
          onCreateRootNode={() => {
            createRootNode();
            setIsMobileSidebarOpen(false);
          }}
          onOpenStudyDeck={(nodeId) => {
            setStudyDeckNodeId(nodeId || null);
            setIsStudyDeckOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenShortcuts={() => {
            setIsShortcutsOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onStar={handleStar}
          onRename={handleOpenRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onExport={handleExportMarkdown}
          flashcardStats={flashcardStats}
          savingStatus={savingStatus}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-[#08080b]">
        {/* Top Navbar - Shadow the Hedgehog styling */}
        <header className="h-14 border-b border-zinc-850 bg-[#0c0c11] px-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_#ef4444]" />
              <span className="font-bold text-xs tracking-wide uppercase text-zinc-300 hidden sm:inline font-mono">
                {zoomedNodeId ? 'DOCUMENT OUTLINER' : 'BRAIN REPOSITORY'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Study Deck Button */}
            <button
              type="button"
              onClick={() => {
                setStudyDeckNodeId(zoomedNodeId || null);
                setIsStudyDeckOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-600/30 rounded-lg transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Study Deck</span>
              {flashcardStats.dueCards > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 rounded-full text-[10px] font-bold">
                  {flashcardStats.dueCards}
                </span>
              )}
            </button>

            {/* Quick Add Bullet */}
            <button
              type="button"
              onClick={handleAddBullet}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm shadow-red-950/50 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Note</span>
            </button>

            {/* Keyboard shortcuts trigger */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors hidden sm:flex"
              title="Keyboard Shortcuts Guide"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Document Tabs Bar */}
        <DocumentTabs
          openTabIds={openTabIds}
          activeTabId={zoomedNodeId}
          nodes={nodes}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={handleNewTab}
          onStar={handleStar}
          onRename={handleOpenRename}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onOpenDeck={(id) => {
            setStudyDeckNodeId(id);
            setIsStudyDeckOpen(true);
          }}
          onExport={handleExportMarkdown}
        />

        {/* Outliner Body Container */}
        <main className="flex-1 overflow-y-auto flex relative bg-[#09090d]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              <div className="flex flex-col items-center gap-2">
                <Brain className="w-8 h-8 text-red-500 animate-pulse" />
                <span>Loading your brain...</span>
              </div>
            </div>
          ) : (
            <OutlinerTree
              nodes={nodes}
              zoomedNodeId={zoomedNodeId}
              breadcrumbs={breadcrumbs}
              registerRef={registerInputRef}
              onEnter={handleEnter}
              onIndent={handleIndent}
              onOutdent={handleOutdent}
              onBackspace={handleBackspace}
              onChange={handleContentChange}
              onNavigateVertical={handleNavigateVertical}
              onToggleExpand={toggleExpand}
              onZoom={(id) => setZoomedNodeId(id || null)}
              onGenerateFlashcards={(id) => setFlashcardTargetId(id)}
              onShowBacklinks={(id) => setBacklinksTargetId(id)}
              onDelete={handleDeleteNode}
              onSelectWikiLinkNode={(id) => setZoomedNodeId(id)}
              onCreateWikiNote={handleCreateWikiNote}
              onRenameNode={handleRenameNode}
              onAddChildBullet={handleAddChildBullet}
              onAddBullet={handleAddBullet}
              onStarNode={handleStar}
            />
          )}

          {/* Linked References / Backlinks Panel */}
          {backlinksTargetId && (
            <BacklinksPanel
              nodeId={backlinksTargetId}
              nodes={nodes}
              onClose={() => setBacklinksTargetId(null)}
              onNavigateToNode={(targetId) => {
                setZoomedNodeId(targetId);
                setBacklinksTargetId(null);
              }}
            />
          )}
        </main>
      </div>

      {/* Spaced Repetition Study Deck Modal */}
      {isStudyDeckOpen && (
        <StudyDeckModal
          initialNodeId={studyDeckNodeId}
          allNodes={nodes}
          onClose={() => setIsStudyDeckOpen(false)}
          onRefreshStats={refreshStats}
        />
      )}

      {/* Flashcard Extractor Modal */}
      {flashcardTargetId && (
        <FlashcardModal
          nodeId={flashcardTargetId}
          nodes={nodes}
          onClose={() => setFlashcardTargetId(null)}
          onCardsUpdated={refreshStats}
        />
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {/* Rename Document Modal (triggered from ... menu) */}
      {renameTargetId && nodeBeingRenamed && (
        <RenameModal
          node={nodeBeingRenamed}
          onClose={() => setRenameTargetId(null)}
          onSave={handleSaveRename}
        />
      )}
    </div>
  );
}
