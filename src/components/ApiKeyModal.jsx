import React, { useState, useEffect } from 'react';
import { X, Key, Check, Trash2, ExternalLink } from 'lucide-react';
import { getUserApiKey, setUserApiKey } from '../utils/storage.js';

export function ApiKeyModal({ isOpen, onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState('');
  const [persist, setPersist] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getUserApiKey() || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setUserApiKey(apiKey, persist);
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setUserApiKey('', false);
    setApiKey('');
    if (onKeySaved) onKeySaved();
  };

  const envKeyConfigured = Boolean(
    import.meta.env.VITE_GEMINI_API_KEY &&
    !import.meta.env.VITE_GEMINI_API_KEY.includes('your_api_key_here')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/80 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-panel bg-[#161B22] border border-[#30363D] p-5 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-[#58A6FF]" />
            <h3 className="font-semibold text-sm text-[#E6EDF3]">Gemini API Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Environment key indicator if detected */}
        {envKeyConfigured && (
          <div className="p-2.5 rounded bg-[#1C2128] border border-[#30363D] flex items-center justify-between text-[11px] text-[#3FB950]">
            <div className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-[#3FB950]" />
              <span>Key detected in local .env</span>
            </div>
            <span className="font-mono text-[#8B949E]">VITE_GEMINI_API_KEY</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label
              htmlFor="gemini-key-input"
              className="block text-xs font-medium text-[#E6EDF3] mb-1"
            >
              Enter API Key (or override .env):
            </label>
            <input
              id="gemini-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-2.5 py-1.5 rounded-btn bg-[#0D1117] border border-[#30363D] text-[#E6EDF3] text-xs font-mono focus:border-[#58A6FF] focus:outline-none"
            />
            <p className="text-[11px] text-[#8B949E] mt-1 flex items-center space-x-1">
              <span>Get a key from</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#58A6FF] hover:underline inline-flex items-center space-x-0.5"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#8B949E]">
            <input
              id="persist-checkbox"
              type="checkbox"
              checked={persist}
              onChange={(e) => setPersist(e.target.checked)}
              className="rounded bg-[#0D1117] border-[#30363D] text-[#238636] focus:ring-0"
            />
            <label htmlFor="persist-checkbox" className="cursor-pointer">
              Remember in browser localStorage
            </label>
          </div>

          {/* Prototype notice */}
          <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] text-[11px] text-[#8B949E] leading-relaxed">
            Client-side keys are stored locally in browser storage for development. For production deployments, Gemini API calls should be routed through a serverless backend (/api/explain.js).
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#30363D]">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center space-x-1 text-[#F85149] hover:underline text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Key</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#8B949E] hover:text-[#E6EDF3] border border-[#30363D] transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium transition-colors flex items-center space-x-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Key</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApiKeyModal;
