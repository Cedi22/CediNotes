import React, { useEffect, useState, useCallback } from 'react';
import { FlashcardItem } from '../../types';
import { api } from '../../services/api';
import { Sparkles, X, RotateCw, Trophy, ArrowRight, Brain } from 'lucide-react';

interface StudyDeckModalProps {
  onClose: () => void;
  onRefreshStats: () => void;
}

export const StudyDeckModal: React.FC<StudyDeckModalProps> = ({
  onClose,
  onRefreshStats
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  // Load cards
  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      let due = await api.getDueFlashcards();
      if (due.length === 0) {
        // Fall back to all cards for review if no cards are strictly overdue
        due = await api.getAllFlashcards();
      }
      setCards(due);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const currentCard = cards[currentIndex];

  const handleGrade = async (rating: number) => {
    if (!currentCard) return;

    try {
      await api.reviewFlashcard(currentCard.id, rating);
      onRefreshStats();
      setStudiedCount(prev => prev + 1);

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col min-h-[480px] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-100">Spaced Repetition Study Session</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-300">Loading flashcards...</p>
            </div>
          ) : sessionCompleted ? (
            <div className="text-center py-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Deck Mastered!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You reviewed {studiedCount} card{studiedCount === 1 ? '' : 's'} in this session. Your memory retention is scheduled via SM-2.
                </p>
              </div>
              <div className="pt-4 flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={loadCards}
                  className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Study Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                >
                  Return to Outliner
                </button>
              </div>
            </div>
          ) : currentCard ? (
            <div className="w-full flex-1 flex flex-col justify-between">
              {/* Progress Bar */}
              <div className="w-full mb-4">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
                  <span>Card {currentIndex + 1} of {cards.length}</span>
                  <span className="text-slate-500">Spacebar to flip</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* The Interactive Flashcard */}
              <div
                onClick={() => setIsFlipped(prev => !prev)}
                className={`w-full min-h-[220px] rounded-2xl p-6 border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-xl ${
                  isFlipped
                    ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/40'
                    : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase text-slate-500 mb-3">
                    <span>{isFlipped ? 'Answer Revealed' : 'Question Prompt'}</span>
                    <span className="flex items-center gap-1 text-slate-400 hover:text-slate-200">
                      <RotateCw className="w-3 h-3" /> Flip
                    </span>
                  </div>

                  <div className="text-lg md:text-xl font-medium text-slate-100">
                    {currentCard.question}
                  </div>
                </div>

                {isFlipped ? (
                  <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
                    <div className="text-sm md:text-base text-emerald-300 font-normal whitespace-pre-line leading-relaxed">
                      {currentCard.answer}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 mt-6 text-center">
                    Click card or press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Space</kbd> to see answer
                  </div>
                )}
              </div>

              {/* SM-2 Rating Controls (Revealed after flip) */}
              <div className="mt-6 w-full">
                {isFlipped ? (
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleGrade(1)}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-bold">Again</span>
                      <span className="text-[10px] text-rose-400 font-mono mt-0.5">[1] &lt;10m</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrade(2)}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-bold">Hard</span>
                      <span className="text-[10px] text-amber-400 font-mono mt-0.5">[2] 1d</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrade(3)}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-bold">Good</span>
                      <span className="text-[10px] text-sky-400 font-mono mt-0.5">[3] 3d</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGrade(4)}
                      className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all hover:scale-105"
                    >
                      <span className="text-xs font-bold">Easy</span>
                      <span className="text-[10px] text-emerald-400 font-mono mt-0.5">[4] 7d</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <span>Show Answer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <Brain className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium">No flashcards in your brain yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Click the ⚡ Card button on any bullet in the outliner to generate flashcards!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
