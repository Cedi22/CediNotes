import React, { useEffect, useState } from 'react';
import { FlashcardItem, NodeItem } from '../../types';
import { api } from '../../services/api';
import { Zap, X, Check, ArrowRight } from 'lucide-react';

interface FlashcardModalProps {
  nodeId: string | null;
  nodes: NodeItem[];
  onClose: () => void;
  onCardsUpdated?: () => void;
  onOpenStudyDeck?: () => void;
  onRefreshStats?: () => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({
  nodeId,
  nodes,
  onClose,
  onCardsUpdated,
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
        onCardsUpdated?.();
        onRefreshStats?.();
      })
      .catch(err => {
        console.error('Failed to generate cards:', err);
        setError(err.message || 'Error generating cards');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [nodeId, onCardsUpdated, onRefreshStats]);

  if (!nodeId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e0e13] border border-red-900/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#121218]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm">Flashcards Generated</h3>
              <p className="text-xs text-zinc-400">From "{currentNode?.content || 'Note'}" & children</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-10">
              <Zap className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Extracting flashcard concepts...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
              {error}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400">
              <p>No cards could be extracted automatically.</p>
              <p className="mt-1 text-zinc-500">
                Type <code className="text-red-400 font-mono">Concept :: Definition</code> on any bullet to create instant cards.
              </p>
            </div>
          ) : (
            cards.map(card => (
              <div
                key={card.id}
                className="p-3 bg-[#13131c] border border-zinc-800 rounded-xl flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-zinc-200">
                  <span className="text-red-400 font-mono text-[10px] uppercase tracking-wider">Concept</span>
                  <span className="text-[10px] text-zinc-500">RemNote Q&A</span>
                </div>
                <div className="font-bold text-zinc-100">{card.question}</div>
                <div className="border-t border-zinc-850 pt-1 text-emerald-400 font-medium">
                  {card.answer}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#0a0a0e] flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">
            {cards.length} card{cards.length === 1 ? '' : 's'} in deck
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
