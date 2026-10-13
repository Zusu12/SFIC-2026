import React, { useState, useRef } from 'react';
import { AlertCircle, ExternalLink, ArrowRight, FolderOpen, Sparkles, AlertTriangle } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor.jsx';
import { EditorTabs } from '../components/EditorTabs.jsx';
import { AiTutorPanel } from '../components/AiTutorPanel.jsx';
import { ErrorExplainer } from '../components/ErrorExplainer.jsx';
import { saveTranslationRequest } from '../utils/storage.js';

const STARTER_CODE = `name = input("Enter your name: ")

if name:
    print("Hello", name)
else:
    print("No name entered")`;

const MAX_CODE_LENGTH = 5000;

export function Home({
  editorRef: externalEditorRef,
  onOpenHistory,
  isAiTutorOpen = false,
  onToggleAiTutor,
  onOpenApiKey,
}) {
  const [code, setCode] = useState(STARTER_CODE);
  const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [popupNotice, setPopupNotice] = useState(null);
  const [localTutorOpen, setLocalTutorOpen] = useState(false);

  // Explain Python Error state
  const [isErrorExplainerOpen, setIsErrorExplainerOpen] = useState(false);
  const [highlightedErrorLine, setHighlightedErrorLine] = useState(null);

  const localEditorRef = useRef(null);
  const activeEditorRef = externalEditorRef || localEditorRef;

  const activeTutorOpen = onToggleAiTutor ? isAiTutorOpen : localTutorOpen;
  const handleToggleTutor = () => {
    if (onToggleAiTutor) {
      onToggleAiTutor();
    } else {
      setLocalTutorOpen((prev) => !prev);
    }
  };

  const handleCloseTutor = () => {
    if (onToggleAiTutor && isAiTutorOpen) {
      onToggleAiTutor();
    } else {
      setLocalTutorOpen(false);
    }
  };

  const lineCount = code ? code.split('\n').length : 0;
  const characterCount = code.length;
  const isOverLimit = characterCount > MAX_CODE_LENGTH;

  const handleClearCode = () => {
    setCode('');
    setErrorMessage('');
    setHighlightedErrorLine(null);
  };

  const handleApplyCode = (newCode) => {
    if (typeof newCode === 'string') {
      setCode(newCode);
      if (activeEditorRef.current?.setValue) {
        activeEditorRef.current.setValue(newCode);
      }
    }
  };

  const handleTranslate = () => {
    setErrorMessage('');
    setPopupNotice(null);

    // 1. Validate nonempty code
    if (!code || !code.trim()) {
      setErrorMessage('Editor is empty. Paste or type Python code before translating.');
      return;
    }

    if (isOverLimit) {
      setErrorMessage(`Code length exceeds maximum allowed limit of ${MAX_CODE_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 2 & 3. Save to localStorage with unique request ID
      const saveResult = saveTranslationRequest(code, 'telugu');

      if (!saveResult.success || !saveResult.id) {
        setErrorMessage(
          saveResult.error || 'Failed to save translation request to local storage.'
        );
        setIsSubmitting(false);
        return;
      }

      const targetUrl = `/translate?id=${encodeURIComponent(saveResult.id)}`;

      // 4. Open in new tab synchronously inside click handler
      const newTab = window.open(targetUrl, '_blank');

      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Pop-up was blocked by browser
        setPopupNotice({
          url: targetUrl,
          message: 'Your browser prevented opening the new tab automatically. Click below to view the translation:',
        });
      }
    } catch (err) {
      console.error('Translation launch error:', err);
      setErrorMessage('An error occurred while launching the translation workspace.');
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col space-y-4">
      {/* Workspace Heading & AI Companion Quick Launch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-col space-y-1">
          <h1 className="text-lg font-semibold text-[#E6EDF3] tracking-tight">
            Python Workspace
          </h1>
          <p className="text-xs text-[#8B949E]">
            Translate Python concepts into Telugu and understand the logic behind your code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleTutor}
          className={`self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-btn text-xs font-medium border transition-colors ${
            activeTutorOpen
              ? 'bg-[#1F6FEB]/20 border-[#58A6FF] text-[#58A6FF]'
              : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
          title="Toggle AI Coding Companion"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span>{activeTutorOpen ? 'Close AI Tutor' : 'Open AI Tutor'}</span>
        </button>
      </div>

      {/* Editor & AI Tutor Container (Side-by-side when open on desktop, stacked on mobile) */}
      <div className={activeTutorOpen ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 items-start' : 'w-full'}>
        {/* Main Editor Panel (Border #30363D, 8px radius, solid dark surface) */}
        <div className="rounded-panel border border-[#30363D] bg-[#161B22] overflow-hidden flex flex-col justify-between">
          <div>
            {/* Editor Tab Header */}
            <EditorTabs
              fileName="main.py"
              languageLabel="Python 3"
              lineCount={lineCount}
              charCount={characterCount}
              isReadOnly={false}
              onClear={handleClearCode}
            />

            {/* Monaco Editor */}
            <CodeEditor
              value={code}
              onChange={setCode}
              onCursorChange={setCursorPos}
              editorRef={activeEditorRef}
              height={activeTutorOpen ? '500px' : '420px'}
              language="python"
              highlightedLine={highlightedErrorLine}
              highlightClass="monaco-error-active-line"
            />
          </div>

          {/* Editor Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#161B22] border-t border-[#30363D] text-[11px] text-[#8B949E] font-mono">
            <span>Paste or type Python code here</span>
            <div className="flex items-center space-x-3">
              <span className={isOverLimit ? 'text-[#F85149]' : ''}>
                {characterCount} / {MAX_CODE_LENGTH} chars
              </span>
              <span className="text-[#30363D]">|</span>
              <span>
                Ln {cursorPos.lineNumber}, Col {cursorPos.column}
              </span>
              <span className="text-[#30363D]">|</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>

        {/* AI Coding Companion Panel */}
        {activeTutorOpen && (
          <AiTutorPanel
            code={code}
            selectedLine={cursorPos.lineNumber}
            onApplyCode={handleApplyCode}
            onOpenApiKey={onOpenApiKey}
            isOpen={activeTutorOpen}
            onClose={handleCloseTutor}
          />
        )}
      </div>

      {/* Explain Python Error Panel (Appears below editor when opened) */}
      {isErrorExplainerOpen && (
        <div className="pt-1">
          <ErrorExplainer
            code={code}
            onApplyCode={handleApplyCode}
            onHighlightLine={setHighlightedErrorLine}
            onOpenApiKey={onOpenApiKey}
            onClose={() => {
              setIsErrorExplainerOpen(false);
              setHighlightedErrorLine(null);
            }}
          />
        </div>
      )}

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="p-3 rounded-md bg-[#161B22] border border-[#F85149]/40 flex items-center space-x-2 text-xs text-[#F85149]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pop-up blocked notice */}
      {popupNotice && (
        <div className="p-3 rounded-md bg-[#161B22] border border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#E6EDF3]">
          <span>{popupNotice.message}</span>
          <a
            href={popupNotice.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1 text-[#58A6FF] hover:underline shrink-0"
          >
            <span>Open Translation Workspace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main Actions (Directly below editor, left-aligned) */}
      <div className="flex items-center justify-start space-x-2 pt-1 flex-wrap gap-y-2">
        {/* 1. Translate to Telugu */}
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isSubmitting || !code.trim() || isOverLimit}
          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-btn font-medium text-xs transition-colors ${
            isSubmitting || !code.trim() || isOverLimit
              ? 'bg-[#238636]/50 text-white/50 cursor-not-allowed'
              : 'bg-[#238636] hover:bg-[#2EA043] text-white active:bg-[#238636]'
          }`}
          title="Translate code to Telugu"
        >
          <span>Translate to Telugu</span>
          <span className="text-white/70 font-normal">/ Telugu lo ki Marchu</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1 text-white/80" />
        </button>

        {/* 2. Explain Python Error (Matching Reference Design: Dark background, red warning-triangle, subtle border) */}
        <button
          type="button"
          onClick={() => {
            setIsErrorExplainerOpen((prev) => !prev);
          }}
          disabled={!code.trim()}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-btn border text-xs font-medium transition-colors ${
            !code.trim()
              ? 'bg-[#1C2128]/50 text-[#8B949E]/50 border-[#30363D]/50 cursor-not-allowed'
              : isErrorExplainerOpen
              ? 'bg-[#F85149]/20 border-[#F85149] text-[#F85149]'
              : 'bg-[#1C2128] hover:bg-[#30363D]/50 text-[#E6EDF3] border-[#30363D]'
          }`}
          title="Analyze Python code for syntax and runtime errors and explain in Telugu"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#F85149]" />
          <span>Explain Python Error</span>
        </button>

        {/* 3. Ask AI Tutor */}
        <button
          type="button"
          onClick={handleToggleTutor}
          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-btn border text-xs font-medium transition-colors ${
            activeTutorOpen
              ? 'bg-[#1F6FEB]/20 border-[#58A6FF] text-[#58A6FF]'
              : 'bg-[#1C2128] hover:bg-[#30363D]/50 text-[#8B949E] hover:text-[#E6EDF3] border-[#30363D]'
          }`}
          title="Toggle AI Coding Companion"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span>{activeTutorOpen ? 'Close AI Tutor' : 'Ask AI Tutor'}</span>
        </button>

        {/* 4. Open Saved Program */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#8B949E] hover:text-[#E6EDF3] border border-[#30363D] font-medium text-xs transition-colors"
            title="Browse Saved Programs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>Open Saved Program</span>
          </button>
        )}
      </div>
    </main>
  );
}

export default Home;
