import React, { useState, useEffect } from 'react';
import { AISettings } from '../../types';
import { api } from '../../services/api';
import { 
  X, 
  Sparkles, 
  Server, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved
}) => {
  const [settings, setSettings] = useState<AISettings>({
    ai_provider: 'gemini',
    gemini_api_key: '',
    gemini_model: 'gemini-3.8-flash',
    local_endpoint: 'http://localhost:11434',
    local_model: 'llama3.2'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setTestStatus({ testing: false });
      api.getAISettings()
        .then((s) => {
          if (s) setSettings(s);
        })
        .catch((err) => console.error('Failed to load AI settings:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    try {
      const res = await api.testAIConnection(settings);
      setTestStatus({
        testing: false,
        success: res.success,
        message: res.message || 'Connection successful!'
      });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: err.message || 'Connection failed'
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.saveAISettings(settings);
      onSettingsSaved?.(updated);
      onClose();
    } catch (err) {
      console.error('Failed to save AI settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#0d1424] border border-slate-750 rounded-2xl shadow-2xl p-6 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">AI Model Settings</h2>
              <p className="text-xs text-slate-400">Connect Google Gemini or a Local LLM (Ollama / LM Studio)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span>Loading AI preferences...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-5 space-y-5">
            {/* Provider Switch Tabs */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Active Provider
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSettings({ ...settings, ai_provider: 'gemini' });
                    setTestStatus({ testing: false });
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    settings.ai_provider === 'gemini'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Gemini</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettings({ ...settings, ai_provider: 'local' });
                    setTestStatus({ testing: false });
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    settings.ai_provider === 'local'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>Local LLM</span>
                </button>
              </div>
            </div>

            {/* Gemini Settings */}
            {settings.ai_provider === 'gemini' && (
              <div className="space-y-4 p-4 rounded-xl bg-purple-950/15 border border-purple-800/30">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Key className="w-3 h-3 text-purple-400" />
                      Gemini API Key
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      Get API Key <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={settings.gemini_api_key}
                    onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Stored locally in your CediNote database.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Gemini Model
                  </label>
                  <select
                    value={settings.gemini_model}
                    onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="gemini-3.8-flash">Gemini 3.8 Flash (Latest - Recommended)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
                </div>
              </div>
            )}

            {/* Local LLM Settings */}
            {settings.ai_provider === 'local' && (
              <div className="space-y-4 p-4 rounded-xl bg-emerald-950/15 border border-emerald-800/30">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Endpoint URL
                  </label>
                  <input
                    type="text"
                    value={settings.local_endpoint}
                    onChange={(e) => setSettings({ ...settings, local_endpoint: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Default Ollama is <code className="text-emerald-400">http://localhost:11434</code>. LM Studio is usually <code className="text-emerald-400">http://localhost:1234</code>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={settings.local_model}
                    onChange={(e) => setSettings({ ...settings, local_model: e.target.value })}
                    placeholder="llama3.2, mistral, qwen2.5, deepseek-r1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ensure the model is pulled locally via <code>ollama run llama3.2</code>
                  </p>
                </div>
              </div>
            )}

            {/* Test Status Banner */}
            {testStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
                  testStatus.success
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                    : 'bg-red-950/40 text-red-300 border-red-800/60'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span className="truncate">{testStatus.message}</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus.testing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {testStatus.testing && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                <span>{testStatus.testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
