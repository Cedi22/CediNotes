import React, { useEffect, useState } from 'react';
import { FlashcardItem, NodeItem } from '../../types';
import { api } from '../../services/api';
import { Zap, X, Check, Sparkles, Brain, ArrowRight } from 'lucide-react';

interface FlashcardModalProps {
  nodeId: string | null;
  nodes: NodeItem[];
  onClose: () => void;
  onOpenStudyDeck: () => void;
  onRefreshStats: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  nodeId,
  nodes,
  onClose,
  onOpenStudyDeck,
  onRefreshStats
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentNode = nodeId ? nodes.find(n => n.id === nodeId) : null;

  useEffect(() => {
    if (!nodeId) return;
    setLoading(true);
    setError(null);

    api.generateFlashcards(nodeId)
      .then(generated => {
        setCards(generated);
        onRefreshStats();
      })
      .catch(err => {
        console.error('Failed to generate cards:', err);
        setError(err.message || 'Error generating cards');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [nodeId, onRefreshStats]);

  if (!nodeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">Flashcards Generated</h3>
              <p className="text-xs text-slate-400">From "{currentNode?.content || 'Rem'}" & children</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-amber-400 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-300">Extracting Q&A flashcards...</p>
              <p className="text-xs text-slate-500 mt-1">Analyzing hierarchy and concept structures</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          ) : cards.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Created {cards.length} flashcard{cards.length === 1 ? '' : 's'}:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Added to Brain Deck
                </span>
              </div>

              {cards.map((card, i) => (
                <div
                  key={card.id || i}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {card.card_type || 'concept'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">Ready to Study</span>
                  </div>

                  <div>
                    <div className="text-[11px] font-medium text-slate-400 uppercase">Question / Prompt</div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">{card.question}</div>
                  </div>

                  <div className="pt-1 border-t border-slate-850">
                    <div className="text-[11px] font-medium text-slate-400 uppercase">Expected Answer</div>
                    <div className="text-xs text-emerald-300 mt-0.5 whitespace-pre-line font-normal">
                      {card.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No flashcards could be generated from this empty bullet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenStudyDeck();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <span>Open Study Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
