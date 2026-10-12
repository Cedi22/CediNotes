import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { FlashcardItem, NodeItem } from '../../types';
import { api } from '../../services/api';
import { Sparkles, X, RotateCw, Trophy, ArrowRight, Brain, Filter, CheckCircle2, Zap } from 'lucide-react';

interface StudyDeckModalProps {
  onClose: () => void;
  onRefreshStats: () => void;
  initialNodeId?: string | null;
  allNodes: NodeItem[];
}

export const StudyDeckModal: React.FC<StudyDeckModalProps> = ({
  onClose,
  onRefreshStats,
  initialNodeId,
  allNodes
}) => {
  const [allCards, setAllCards] = useState<FlashcardItem[]>([]);
  const [dueCards, setDueCards] = useState<FlashcardItem[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(initialNodeId || null);
  const [studyMode, setStudyMode] = useState<'due' | 'all'>('due');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  // Root documents list for context selection
  const rootDocuments = useMemo(() => {
    return allNodes.filter(n => n.parent_id === null);
  }, [allNodes]);

  // Load cards from API
  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const [due, all] = await Promise.all([
        api.getDueFlashcards(),
        api.getAllFlashcards()
      ]);
      setDueCards(due);
      setAllCards(all);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Filter cards based on selected context and study mode
  const activeDeckCards = useMemo(() => {
    const baseCards = studyMode === 'due' ? (dueCards.length > 0 ? dueCards : allCards) : allCards;

    if (!selectedContextId) {
      return baseCards;
    }

    // Collect all descendant IDs under selectedContextId
    const contextIds = new Set<string>([selectedContextId]);
    function collectChildren(id: string) {
      const children = allNodes.filter(n => n.parent_id === id);
      for (const c of children) {
        contextIds.add(c.id);
        collectChildren(c.id);
      }
    }
    collectChildren(selectedContextId);

    return baseCards.filter(c => contextIds.has(c.node_id));
  }, [dueCards, allCards, studyMode, selectedContextId, allNodes]);

  const currentCard = activeDeckCards[currentIndex];

  const handleGrade = async (rating: number) => {
    if (!currentCard) return;

    try {
      await api.reviewFlashcard(currentCard.id, rating);
      onRefreshStats();
      setStudiedCount(prev => prev + 1);

      if (currentIndex + 1 < activeDeckCards.length) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  // Reset session when context or mode changes
  const handleContextChange = (contextId: string | null) => {
    setSelectedContextId(contextId);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  const handleModeChange = (mode: 'due' | 'all') => {
    setStudyMode(mode);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
  };

  // Keyboard navigation for study session
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionCompleted || loading || !currentCard) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleGrade(1);
        if (e.key === '2') handleGrade(2);
        if (e.key === '3') handleGrade(3);
        if (e.key === '4') handleGrade(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sessionCompleted, loading, isFlipped, currentCard]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0e0e13] border border-red-900/50 rounded-2xl w-full max-w-xl shadow-2xl shadow-red-950/40 flex flex-col min-h-[500px] max-h-[92vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-850 flex items-center justify-between bg-[#121218]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Study Flashcards</h2>
              <p className="text-[11px] text-zinc-400">Spaced repetition review (SM-2)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context & Mode Selection Toolbar */}
        <div className="px-4 py-2.5 bg-[#14141c] border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-red-500" /> Context:
            </span>
            <select
              value={selectedContextId || ''}
              onChange={(e) => handleContextChange(e.target.value || null)}
              className="bg-[#0b0b10] border border-red-950/70 focus:border-red-500 rounded-md px-2.5 py-1 text-xs text-zinc-200 outline-none"
            >
              <option value="">All Documents ({allCards.length} cards)</option>
              {rootDocuments.map(doc => {
                const count = allCards.filter(c => {
                  const set = new Set<string>([doc.id]);
                  allNodes.filter(n => n.parent_id === doc.id).forEach(n => set.add(n.id));
                  return set.has(c.node_id);
                }).length;
                return (
                  <option key={doc.id} value={doc.id}>
                    {doc.content || 'Untitled'} ({count} cards)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#0b0b10] p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => handleModeChange('due')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                studyMode === 'due'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Due ({dueCards.length})
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                studyMode === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cram All ({allCards.length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-center py-12">
              <Zap className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Loading your flashcards...</p>
            </div>
          ) : sessionCompleted ? (
            <div className="text-center py-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-zinc-100">Session Complete!</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  You reviewed {studiedCount} card{studiedCount === 1 ? '' : 's'} in this context. Intervals scheduled via SM-2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFlipped(false);
                  setSessionCompleted(false);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Review Again</span>
              </button>
            </div>
          ) : activeDeckCards.length === 0 ? (
            <div className="text-center py-8 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mx-auto">
                <CheckCircle2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-200">No cards in this context</h3>
              <p className="text-xs text-zinc-400">
                To create flashcards, type <code className="text-red-400 font-mono">Concept :: Definition</code> on any bullet or click the Card (⚡) icon.
              </p>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col justify-between">
              {/* Progress Bar */}
              <div className="w-full mb-4">
                <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
                  <span>Card {currentIndex + 1} of {activeDeckCards.length}</span>
                  <span>{Math.round(((currentIndex + 1) / activeDeckCards.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / activeDeckCards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* 3D Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full flex-1 min-h-[220px] bg-[#12121a] border border-red-950/60 rounded-xl p-6 flex flex-col justify-between cursor-pointer hover:border-red-600/50 transition-all select-none shadow-lg relative group"
              >
                <div className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center justify-between">
                  <span>{isFlipped ? 'Answer' : 'Question / Concept'}</span>
                  <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-normal">
                    Click or Space to flip
                  </span>
                </div>

                <div className="my-auto py-4 text-center">
                  {isFlipped ? (
                    <div className="text-lg md:text-xl font-bold text-emerald-400 animate-in fade-in duration-150">
                      {currentCard.answer}
                    </div>
                  ) : (
                    <div className="text-lg md:text-xl font-bold text-zinc-100">
                      {currentCard.question}
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-zinc-500 text-center font-mono">
                  Repetitions: {currentCard.repetitions} • Ease: {currentCard.ease_factor.toFixed(2)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-zinc-850">
                {!isFlipped ? (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>Show Answer</span>
                    <span className="text-[10px] font-mono opacity-70">(Space)</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGrade(1)}
                      className="py-2 px-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 text-red-300 text-xs font-semibold flex flex-col items-center transition-all"
                    >
                      <span>Again</span>
                      <span className="text-[10px] text-zinc-400 font-mono">(1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGrade(2)}
                      className="py-2 px-1 rounded-lg bg-orange-950/50 hover:bg-orange-900/60 border border-orange-700/50 text-orange-300 text-xs font-semibold flex flex-col items-center transition-all"
                    >
                      <span>Hard</span>
                      <span className="text-[10px] text-zinc-400 font-mono">(2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGrade(3)}
                      className="py-2 px-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold flex flex-col items-center transition-all"
                    >
                      <span>Good</span>
                      <span className="text-[10px] text-zinc-400 font-mono">(3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGrade(4)}
                      className="py-2 px-1 rounded-lg bg-sky-950/50 hover:bg-sky-900/60 border border-sky-700/50 text-sky-300 text-xs font-semibold flex flex-col items-center transition-all"
                    >
                      <span>Easy</span>
                      <span className="text-[10px] text-zinc-400 font-mono">(4)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
