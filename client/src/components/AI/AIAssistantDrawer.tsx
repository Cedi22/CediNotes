import React, { useState, useRef, useEffect } from 'react';
import { NodeItem, AISettings, ChatMessage } from '../../types';
import { api } from '../../services/api';
import { 
  Sparkles, 
  Send, 
  X, 
  Settings, 
  FileText, 
  Copy, 
  Check, 
  ArrowDownToLine, 
  Loader2,
  ListPlus,
  HelpCircle,
  Zap,
  Server
} from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNode: NodeItem | null;
  onOpenSettings: () => void;
  onInsertBullets: (parentId: string | null, bullets: string[]) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  activeNode,
  onOpenSettings,
  onInsertBullets
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getAISettings().then(setSettings).catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.chatWithAI({
        message: text,
        history,
        nodeId: activeNode ? activeNode.id : null
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...nextMessages, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Failed to get AI response'}. Check your AI Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (action: 'summarize' | 'expand' | 'flashcards' | 'takeaways') => {
    if (!activeNode || loading) return;

    let userLabel = '';
    if (action === 'summarize') userLabel = '📝 Summarize this document';
    else if (action === 'expand') userLabel = '💡 Expand with new bullet points';
    else if (action === 'flashcards') userLabel = '⚡ Generate Q&A flashcards';
    else if (action === 'takeaways') userLabel = '🎯 Extract key takeaways';

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await api.runAIAction({
        action,
        nodeId: activeNode.id
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...nextMessages, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Action failed'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = (msgId: string, text: string) => {
    // Parse response into clean bullet lines
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((l) => l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''));

    if (lines.length > 0) {
      onInsertBullets(activeNode ? activeNode.id : null, lines);
      setInsertedId(msgId);
      setTimeout(() => setInsertedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 md:w-[420px] bg-[#0c1222] border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-100">CediNote Copilot</span>
              {settings && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {settings.ai_provider === 'gemini' ? (
                    <span className="flex items-center gap-1 text-purple-300">
                      <Sparkles className="w-2.5 h-2.5" /> Gemini
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <Server className="w-2.5 h-2.5" /> Local
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="AI Model Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Note Context Bar */}
      <div className="px-3.5 py-2 bg-slate-900/70 border-b border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate max-w-[280px]">
          <FileText className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="text-slate-500">Context:</span>
          <span className="text-slate-300 font-medium truncate">
            {activeNode ? (activeNode.content || 'Untitled Note') : 'Entire Brain'}
          </span>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      {activeNode && (
        <div className="p-2.5 border-b border-slate-850 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-slate-950/20">
          <button
            type="button"
            onClick={() => handleActionClick('summarize')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-850 hover:bg-purple-950/50 hover:text-purple-300 hover:border-purple-800 text-slate-300 border border-slate-750 transition-colors shrink-0 disabled:opacity-50"
          >
            <FileText className="w-3 h-3 text-purple-400" />
            <span>Summarize</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('expand')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-850 hover:bg-emerald-950/50 hover:text-emerald-300 hover:border-emerald-800 text-slate-300 border border-slate-750 transition-colors shrink-0 disabled:opacity-50"
          >
            <ListPlus className="w-3 h-3 text-emerald-400" />
            <span>Expand Bullets</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('flashcards')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-850 hover:bg-amber-950/50 hover:text-amber-300 hover:border-amber-800 text-slate-300 border border-slate-750 transition-colors shrink-0 disabled:opacity-50"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Flashcards</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick('takeaways')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-850 hover:bg-sky-950/50 hover:text-sky-300 hover:border-sky-800 text-slate-300 border border-slate-750 transition-colors shrink-0 disabled:opacity-50"
          >
            <HelpCircle className="w-3 h-3 text-sky-400" />
            <span>Takeaways</span>
          </button>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300 mb-1">
              Ask CediNote AI anything
            </h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Brainstorm, structure ideas, generate flashcards, or summarize notes using Google Gemini or your Local LLM.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs select-text ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-xs shadow-md'
                    : 'bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-750 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Assistant Action Bar */}
                {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInsert(msg.id, msg.content)}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors ml-auto"
                      title="Insert as bullets into current note"
                    >
                      {insertedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowDownToLine className="w-3 h-3" />
                      )}
                      <span>{insertedId === msg.id ? 'Inserted!' : 'Insert into note'}</span>
                    </button>
                  </div>
                )}
              </div>
              {msg.timestamp && (
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp}
                </span>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs px-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span className="italic">CediNote AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-3 bg-[#0a0f1d] border-t border-slate-800 shrink-0">
        <div className="relative flex items-end bg-slate-900 border border-slate-750 focus-within:border-purple-500 rounded-xl px-3 py-2 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask AI or type a prompt..."
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none max-h-28"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="p-1.5 ml-2 text-purple-400 hover:text-purple-300 disabled:opacity-40 disabled:hover:text-purple-400 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
