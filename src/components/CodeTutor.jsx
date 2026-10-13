import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { askCodeQuestion, getActiveApiKey } from '../services/gemini.js';

const QUICK_PROMPTS = [
  'Why did we use range()?',
  'What happens if the condition is False?',
  'Explain the selected line in simple Telugu.',
  'What is the difference between = and ==?',
  'Give me another simple example.',
];

export function CodeTutor({ code, selectedLine = null, onOpenApiKey, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'tutor',
      content:
        'Namaskaram! Ee Python code gurinchi meeku edaina doubt unte adagandi. Nenu simple Telugu lo vivaristhanu.',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const apiKey = getActiveApiKey();
    if (!apiKey) {
      setError('A Gemini API key is required to ask questions about your code.');
      return;
    }

    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInputQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await askCodeQuestion(
        code,
        q,
        selectedLine,
        newMessages.slice(-6)
      );
      setMessages((prev) => [
        ...prev,
        { role: 'tutor', content: response.answer },
      ]);
    } catch (err) {
      console.warn('Tutor error:', err);
      setError(err.message || 'Failed to fetch explanation from tutor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'tutor',
        content:
          'Conversation cleared. Ee code gurinchi edaina kotha prashna unte adagandi.',
      },
    ]);
    setError(null);
  };

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs flex flex-col h-[520px] select-text">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-[#58A6FF]" />
          <h3 className="font-semibold text-sm text-[#E6EDF3]">Ask Your Code Anything</h3>
          {selectedLine && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[#8B949E] font-mono">
              Line {selectedLine} focus
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[#8B949E] hover:text-[#E6EDF3] p-1 rounded hover:bg-[#1C2128]"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#8B949E] hover:text-[#E6EDF3] text-xs px-2 py-0.5 rounded border border-[#30363D]"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none border-b border-[#30363D]/60 shrink-0">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded bg-[#1C2128] hover:bg-[#30363D]/60 border border-[#30363D] text-[11px] text-[#8B949E] hover:text-[#E6EDF3] whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] text-[#8B949E] mb-1 font-mono">
                {isUser ? 'You' : 'Telugu Code Tutor'}
              </div>
              <div
                className={`max-w-[88%] p-3 rounded-md text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#1F6FEB]/20 border border-[#1F6FEB]/50 text-[#E6EDF3]'
                    : 'bg-[#0D1117] border border-[#30363D] text-[#E6EDF3]'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#8B949E] p-2 bg-[#0D1117] rounded border border-[#30363D] w-fit">
            <Sparkles className="w-3.5 h-3.5 text-[#58A6FF] animate-spin" />
            <span>Tutor alochinchi Telugu lo samadhanam rastundi...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-2 mb-2 rounded bg-[#161B22] border border-[#F85149]/40 flex items-center justify-between text-xs text-[#F85149]">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          {onOpenApiKey && (
            <button
              type="button"
              onClick={onOpenApiKey}
              className="text-[#58A6FF] underline text-[11px] shrink-0 ml-2"
            >
              Set API Key
            </button>
          )}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 pt-2 border-t border-[#30363D]"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Adagandi (e.g. What does this loop do? / Line 4 explain cheyandi)..."
          disabled={isLoading}
          className="flex-1 bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded px-3 py-2 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuestion.trim()}
          className={`p-2 rounded font-medium text-xs transition-colors ${
            isLoading || !inputQuestion.trim()
              ? 'bg-[#238636]/40 text-white/40 cursor-not-allowed'
              : 'bg-[#238636] hover:bg-[#2EA043] text-white'
          }`}
          title="Send Question"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default CodeTutor;
