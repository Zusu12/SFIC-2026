import React from 'react';
import { AlertCircle, RefreshCw, Key } from 'lucide-react';

export function ErrorState({
  error,
  onRetry,
  onOpenApiKey,
}) {
  const code = error?.code || '';
  const message = error?.message || '';

  const isKeyMissing = code === 'NO_API_KEY' || message.includes('GEMINI_API_KEY_MISSING');
  const isKeyInvalid = code === 'INVALID_KEY';
  const isRateLimit = code === 'RATE_LIMIT';

  const getMessage = () => {
    if (isKeyMissing) {
      return 'Gemini API key is required for logic explanations. Configure VITE_GEMINI_API_KEY in .env or set it via the API Key Settings.';
    }
    if (isKeyInvalid) {
      return 'The configured Gemini API key is invalid or unauthorized. Please verify your key in Google AI Studio.';
    }
    if (isRateLimit) {
      return 'Gemini API request limit or quota exceeded. Please wait a moment before retrying.';
    }
    return (
      message ||
      'An error occurred while communicating with Google Gemini. Check your connection or retry.'
    );
  };

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Message */}
        <div className="flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#F85149] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h3 className="font-semibold text-[#E6EDF3]">
              Explanation Could Not Be Generated
            </h3>
            <p className="text-[#8B949E] leading-relaxed max-w-xl">
              {getMessage()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          {isKeyMissing ? (
            <button
              type="button"
              onClick={onOpenApiKey}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#E6EDF3] border border-[#30363D] transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>Configure API Key</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenApiKey}
                className="px-2.5 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#8B949E] hover:text-[#E6EDF3] border border-[#30363D] transition-colors"
              >
                Key Settings
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#E6EDF3] border border-[#30363D] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#58A6FF]" />
                <span>Retry Explanation</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
