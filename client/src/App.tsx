import React, { useState, useEffect, useCallback } from 'react';
import { useOutliner } from './hooks/useOutliner';
import { Sidebar } from './components/Sidebar/Sidebar';
import { OutlinerTree } from './components/Outliner/OutlinerTree';
import { BacklinksPanel } from './components/Backlinks/BacklinksPanel';
import { FlashcardModal } from './components/Flashcards/FlashcardModal';
import { StudyDeckModal } from './components/Flashcards/StudyDeckModal';
import { ShortcutsModal } from './components/UI/ShortcutsModal';
import { FlashcardStats } from './types';
import { api } from './services/api';
import { Sparkles, Menu, X, Keyboard, Search, Brain } from 'lucide-react';

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
    handleContentChange,
    toggleExpand,
    handleNavigateVertical,
    createRootNode,
    loadNodes
  } = useOutliner();

  // Modals and side panels
  const [backlinksTargetId, setBacklinksTargetId] = useState<string | null>(null);
  const [flashcardTargetId, setFlashcardTargetId] = useState<string | null>(null);
  const [isStudyDeckOpen, setIsStudyDeckOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Handle adding a bullet directly from UI button
  const handleAddBullet = () => {
    if (zoomedNodeId) {
      // Add child under zoomed node
      api.createNode({
        parent_id: zoomedNodeId,
        content: '',
        is_expanded: true
      }).then(created => {
        loadNodes();
        focusNode(created.id, true);
      });
    } else {
      createRootNode('');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1d] text-slate-100 font-sans">
      {/* Sidebar (Desktop & Mobile drawer) */}
      <div className={`fixed inset-y-0 left-0 z-40 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
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
          onOpenStudyDeck={() => {
            setIsStudyDeckOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          onOpenShortcuts={() => {
            setIsShortcutsOpen(true);
            setIsMobileSidebarOpen(false);
          }}
          flashcardStats={flashcardStats}
          savingStatus={savingStatus}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-[#0c1222] px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(prev => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-200 hidden sm:inline">
                {zoomedNodeId ? 'Zoomed View' : 'Brain Outliner'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Study Deck Button */}
            <button
              type="button"
              onClick={() => setIsStudyDeckOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Study Deck</span>
              {flashcardStats.dueCards > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold">
                  {flashcardStats.dueCards}
                </span>
              )}
            </button>

            {/* Keyboard shortcuts trigger */}
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors hidden sm:flex"
              title="Keyboard Shortcuts Guide"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Outliner Body Container */}
        <main className="flex-1 overflow-y-auto flex">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              <div className="flex flex-col items-center gap-2">
                <Brain className="w-8 h-8 text-emerald-400 animate-pulse" />
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
              onDelete={handleBackspace}
              onSelectWikiLinkNode={(id) => setZoomedNodeId(id)}
              onAddBullet={handleAddBullet}
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

      {/* Step 5: Flashcard Generation Modal */}
      {flashcardTargetId && (
        <FlashcardModal
          nodeId={flashcardTargetId}
          nodes={nodes}
          onClose={() => setFlashcardTargetId(null)}
          onOpenStudyDeck={() => setIsStudyDeckOpen(true)}
          onRefreshStats={refreshStats}
        />
      )}

      {/* Spaced Repetition Study Deck Modal */}
      {isStudyDeckOpen && (
        <StudyDeckModal
          onClose={() => setIsStudyDeckOpen(false)}
          onRefreshStats={refreshStats}
        />
      )}

      {/* Keyboard Shortcuts Reference Modal */}
      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}
    </div>
  );
}
