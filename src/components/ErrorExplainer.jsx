import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Sparkles,
  CheckCircle2,
  Undo2,
  X,
  Code,
  Languages,
  RotateCcw
} from 'lucide-react';
import { analyzePythonCode } from '../services/pythonDiagnostics.js';
import { explainPythonError, getActiveApiKey } from '../services/gemini.js';
import { getExplanationCache } from '../utils/storage.js';

export function ErrorExplainer({
  code = '',
  onApplyCode,
  onHighlightLine,
  onOpenApiKey,
  onClose,
  autoRun = true,
}) {
  const [diagnostic, setDiagnostic] = useState(null);
  const [enrichedExplanation, setEnrichedExplanation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiNotice, setGeminiNotice] = useState(null);

  // User controls
  const [languageMode, setLanguageMode] = useState('both'); // 'both' | 'en' | 'te'
  const [copiedCode, setCopiedCode] = useState(false);

  // Apply Fix confirmation & undo state
  const [isConfirmingApply, setIsConfirmingApply] = useState(false);
  const [previousCodeBeforeFix, setPreviousCodeBeforeFix] = useState(null);
  const [fixAppliedSuccess, setFixAppliedSuccess] = useState(false);

  const enrichmentTimerRef = useRef(null);

  // Run analysis when code changes or when Check Again is clicked
  const runDiagnostic = useCallback(async (targetCode = code, isImmediate = false) => {
    setIsAnalyzing(true);
    setIsConfirmingApply(false);
    setFixAppliedSuccess(false);

    // Cancel any pending debounced Gemini enrichment from prior typing
    if (enrichmentTimerRef.current) {
      clearTimeout(enrichmentTimerRef.current);
      enrichmentTimerRef.current = null;
    }

    // 1. Run instant local static Python diagnostic engine (0 tokens, 0ms)
    const result = analyzePythonCode(targetCode);
    setDiagnostic(result);
    setIsAnalyzing(false);

    // Highlight the error line in editor if available
    if (result.hasError && result.line && onHighlightLine) {
      onHighlightLine(result.line);
    } else if (onHighlightLine) {
      onHighlightLine(null);
    }

    if (!result.hasError) {
      setEnrichedExplanation(null);
      setIsGeminiLoading(false);
      return;
    }

    // 2. Error detected: Check persistent cache first (instant, 0 tokens)
    const subKey = `err:${result.errorType}:${result.line || 0}`;
    const cached = getExplanationCache(targetCode, undefined, subKey);
    if (cached) {
      setEnrichedExplanation(cached);
      setIsGeminiLoading(false);
      return;
    }

    // If no cache, check if Gemini key is available
    const apiKey = getActiveApiKey();
    if (!apiKey) {
      setGeminiNotice('Diagnosed via built-in Python static analysis engine.');
      setIsGeminiLoading(false);
      return;
    }

    const executeEnrichment = async () => {
      setIsGeminiLoading(true);
      try {
        const aiRes = await explainPythonError(targetCode, result);
        setEnrichedExplanation(aiRes);
      } catch (err) {
        console.warn('Gemini enrichment notice:', err);
        setGeminiNotice('Static Python diagnostics active. (AI explanation service unavailable).');
      } finally {
        setIsGeminiLoading(false);
      }
    };

    if (isImmediate) {
      // Manual click or instant trigger
      executeEnrichment();
    } else {
      // Debounce by 1500ms during typing so incomplete syntax doesn't drain API limits
      enrichmentTimerRef.current = setTimeout(executeEnrichment, 1500);
    }
  }, [code, onHighlightLine]);

  useEffect(() => {
    if (autoRun && code) {
      runDiagnostic(code, false);
    }
    return () => {
      if (enrichmentTimerRef.current) {
        clearTimeout(enrichmentTimerRef.current);
      }
    };
  }, [autoRun, code, runDiagnostic]);

  // Copy corrected code
  const handleCopyCode = () => {
    const codeToCopy = enrichedExplanation?.correctedCode || diagnostic?.suggestedCorrection;
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Apply fix flow with confirmation
  const handleInitiateApply = () => {
    setIsConfirmingApply(true);
  };

  const handleConfirmApply = () => {
    const correction = enrichedExplanation?.correctedCode || diagnostic?.suggestedCorrection;
    if (correction && onApplyCode) {
      setPreviousCodeBeforeFix(code);
      onApplyCode(correction);
      setIsConfirmingApply(false);
      setFixAppliedSuccess(true);
      if (onHighlightLine) onHighlightLine(null);
    }
  };

  const handleCancelApply = () => {
    setIsConfirmingApply(false);
  };

  const handleUndoFix = () => {
    if (previousCodeBeforeFix && onApplyCode) {
      onApplyCode(previousCodeBeforeFix);
      setPreviousCodeBeforeFix(null);
      setFixAppliedSuccess(false);
    }
  };

  if (!diagnostic && !isAnalyzing) {
    return null;
  }

  // Active explanations (prefer Gemini enriched if available, fallback to built-in template)
  const englishMeaning = enrichedExplanation?.englishMeaning || diagnostic?.englishExplanation?.meaning;
  const englishReason = enrichedExplanation?.englishReason || diagnostic?.englishExplanation?.reason;
  const englishFix = enrichedExplanation?.englishFix || diagnostic?.englishExplanation?.fix;

  const teluguMeaning = enrichedExplanation?.meaningTelugu || diagnostic?.teluguExplanation?.meaning;
  const teluguReason = enrichedExplanation?.reasonTelugu || diagnostic?.teluguExplanation?.reason;
  const teluguFix = enrichedExplanation?.fixTelugu || diagnostic?.teluguExplanation?.fix;

  const correctedSnippet = enrichedExplanation?.correctedCode || diagnostic?.suggestedCorrection;
  const whatChangedText = enrichedExplanation?.whatChanged || diagnostic?.whatChanged;

  return (
    <div
      className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs space-y-3.5 select-text animate-in fade-in duration-150 shadow-xl"
      role="region"
      aria-label="Python Error Explanation Panel"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363D] gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-[#F85149]/15 border border-[#F85149]/40 text-[#F85149]">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#E6EDF3] flex items-center space-x-2">
              <span>Python Diagnostic &amp; Error Explainer</span>
              {diagnostic?.hasError ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#F85149]/20 border border-[#F85149]/50 text-[#F85149] font-mono font-medium">
                  {diagnostic.errorCategory}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#238636]/20 border border-[#3FB950]/50 text-[#3FB950] font-mono font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>No Errors Found</span>
                </span>
              )}
            </h3>
            <span className="text-[10px] text-[#8B949E]">
              Real-time Python syntax and runtime error analyzer
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Language Selector */}
          {diagnostic?.hasError && (
            <div className="flex items-center rounded border border-[#30363D] bg-[#0D1117] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLanguageMode('both')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  languageMode === 'both'
                    ? 'bg-[#1C2128] text-[#58A6FF] font-medium'
                    : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
                title="Show both English and Romanized Telugu explanations"
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('en')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  languageMode === 'en'
                    ? 'bg-[#1C2128] text-[#58A6FF] font-medium'
                    : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
                title="Explain in English"
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguageMode('te')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  languageMode === 'te'
                    ? 'bg-[#1C2128] text-[#58A6FF] font-medium'
                    : 'text-[#8B949E] hover:text-[#E6EDF3]'
                }`}
                title="Explain in Romanized Telugu"
              >
                Telugu
              </button>
            </div>
          )}

          {/* Check Again Button */}
          <button
            type="button"
            onClick={() => runDiagnostic(code, true)}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded border border-[#30363D] bg-[#1C2128] hover:bg-[#30363D]/60 text-[#8B949E] hover:text-[#E6EDF3] transition-colors flex items-center space-x-1"
            title="Re-analyze current editor code"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Check Again</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128]"
              title="Close error explanation"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] flex items-center space-x-2 text-[#8B949E]">
          <Sparkles className="w-4 h-4 text-[#58A6FF] animate-spin" />
          <span>Analyzing Python code for syntax and runtime errors...</span>
        </div>
      )}

      {/* CASE 1: NO ERROR DETECTED */}
      {!isAnalyzing && !diagnostic.hasError && (
        <div className="p-4 rounded bg-[#0D1117] border border-[#238636]/40 space-y-3">
          <div className="flex items-start space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#3FB950] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-[#3FB950]">
                No Python Error Detected!
              </h4>
              <p className="text-xs text-[#E6EDF3] leading-relaxed">
                Your code passed syntax structure, parenthesis matching, indentation alignment, and variable scope checks without errors.
              </p>
              <p className="text-[11px] text-[#8B949E] italic">
                Telugu: Ee code lo elanti syntax leda runtime errors kanipinchaledu. Statements and indentation anni valid ga unayi.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#30363D] flex items-center justify-between text-[11px] text-[#8B949E]">
            <span>Ready to translate to Telugu or run in the workspace!</span>
            <button
              type="button"
              onClick={() => runDiagnostic(code)}
              className="text-[#58A6FF] hover:underline"
            >
              Re-scan Code
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: CONFIRMED PYTHON ERROR DETECTED */}
      {!isAnalyzing && diagnostic.hasError && (
        <div className="space-y-3">
          {/* Diagnostic Info Banner */}
          <div className="p-3 rounded bg-[#0D1117] border border-[#F85149]/40 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-sm text-[#F85149]">
                  {diagnostic.errorType}
                </span>
                <span className="text-[#30363D]">|</span>
                <span className="text-xs text-[#E6EDF3] font-mono">
                  {diagnostic.message}
                </span>
              </div>

              {diagnostic.line && (
                <span className="self-start sm:self-auto px-2 py-0.5 rounded bg-[#1C2128] border border-[#F85149]/40 text-[#F85149] font-mono text-[11px]">
                  Line {diagnostic.line}
                  {diagnostic.column ? `, Col ${diagnostic.column}` : ''}
                </span>
              )}
            </div>

            {/* Source code line snippet */}
            {diagnostic.sourceLine && (
              <div className="pt-1">
                <div className="text-[10px] uppercase font-semibold text-[#8B949E] mb-1">
                  Responsible Code Line:
                </div>
                <pre className="p-2 rounded bg-[#161B22] border border-[#30363D] font-mono text-xs text-[#F85149] overflow-x-auto whitespace-pre">
                  <code>{diagnostic.sourceLine}</code>
                </pre>
              </div>
            )}
          </div>

          {/* AI Enrichment Notice */}
          {geminiNotice && (
            <div className="text-[10px] text-[#8B949E] flex items-center justify-between px-1">
              <span>{geminiNotice}</span>
              {onOpenApiKey && !getActiveApiKey() && (
                <button
                  type="button"
                  onClick={onOpenApiKey}
                  className="text-[#58A6FF] underline"
                >
                  Configure Gemini API Key
                </button>
              )}
            </div>
          )}

          {isGeminiLoading && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[#8B949E] px-1">
              <Sparkles className="w-3.5 h-3.5 text-[#58A6FF] animate-spin" />
              <span>Enriching diagnostic with Telugu teacher explanations...</span>
            </div>
          )}

          {/* Fix Applied Success Banner */}
          {fixAppliedSuccess && (
            <div className="p-2.5 rounded bg-[#238636]/20 border border-[#3FB950] text-[#3FB950] flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Check className="w-4 h-4" />
                <span>Fix applied to editor! Your code has been updated.</span>
              </div>
              <button
                type="button"
                onClick={handleUndoFix}
                className="text-xs underline font-mono text-[#E6EDF3] flex items-center space-x-1"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo Fix</span>
              </button>
            </div>
          )}

          {/* Confirmation Dialog for Apply Fix */}
          {isConfirmingApply && (
            <div className="p-3 rounded bg-[#0D1117] border border-[#58A6FF] space-y-2 animate-in fade-in duration-100">
              <div className="font-semibold text-xs text-[#58A6FF]">
                Confirm Apply Fix:
              </div>
              <p className="text-xs text-[#E6EDF3]">
                This will update your editor with the suggested correction below. Your previous code will be saved and can be undone immediately.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium"
                >
                  Confirm &amp; Apply to Editor
                </button>
                <button
                  type="button"
                  onClick={handleCancelApply}
                  className="px-3 py-1.5 rounded-btn bg-[#1C2128] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bilingual Explanations Grid */}
          <div className="space-y-2.5">
            {/* ENGLISH EXPLANATION */}
            {(languageMode === 'both' || languageMode === 'en') && (
              <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#58A6FF] pb-1 border-b border-[#30363D]">
                  <Languages className="w-3.5 h-3.5" />
                  <span>English Explanation:</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-[#8B949E]">
                    What Went Wrong:
                  </div>
                  <p className="text-xs text-[#E6EDF3] leading-relaxed">
                    {englishMeaning}
                  </p>
                </div>

                {englishReason && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-[#8B949E]">
                      Why It Happened:
                    </div>
                    <p className="text-xs text-[#8B949E] leading-relaxed">
                      {englishReason}
                    </p>
                  </div>
                )}

                {englishFix && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-[#3FB950]">
                      How To Fix It:
                    </div>
                    <p className="text-xs text-[#E6EDF3] leading-relaxed">
                      {englishFix}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ROMANIZED TELUGU EXPLANATION */}
            {(languageMode === 'both' || languageMode === 'te') && (
              <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#3FB950] pb-1 border-b border-[#30363D]">
                  <Languages className="w-3.5 h-3.5" />
                  <span>Romanized Telugu Explanation:</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-semibold text-[#8B949E]">
                    Ee Error Ardham / Meaning:
                  </div>
                  <p className="text-xs text-[#E6EDF3] leading-relaxed">
                    {teluguMeaning}
                  </p>
                </div>

                {teluguReason && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-[#8B949E]">
                      Enduku Vachindi / Reason:
                    </div>
                    <p className="text-xs text-[#8B949E] leading-relaxed">
                      {teluguReason}
                    </p>
                  </div>
                )}

                {teluguFix && (
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-[#3FB950]">
                      Ela Sari Cheyali / How to Fix:
                    </div>
                    <p className="text-xs text-[#E6EDF3] leading-relaxed">
                      {teluguFix}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Corrected Code Block & What Changed */}
          {correctedSnippet && (
            <div className="p-3.5 rounded bg-[#0D1117] border border-[#30363D] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-semibold text-xs text-[#3FB950]">
                  <Code className="w-3.5 h-3.5" />
                  <span>Suggested Correction:</span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[10px] text-[#8B949E] hover:text-[#E6EDF3] flex items-center space-x-1 transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-[#3FB950]" />
                      <span className="text-[#3FB950]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Corrected Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-2.5 rounded bg-[#161B22] border border-[#30363D] font-mono text-xs text-[#E6EDF3] overflow-x-auto whitespace-pre">
                <code>{correctedSnippet}</code>
              </pre>

              {whatChangedText && (
                <div className="space-y-0.5 text-[11px]">
                  <span className="font-semibold text-[#58A6FF]">What Changed: </span>
                  <span className="text-[#8B949E]">{whatChangedText}</span>
                </div>
              )}

              {/* Action Buttons: Apply Fix & Undo */}
              <div className="pt-2 flex items-center space-x-2 border-t border-[#30363D]">
                <button
                  type="button"
                  onClick={handleInitiateApply}
                  className="px-3.5 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Fix to Editor</span>
                </button>

                {previousCodeBeforeFix && (
                  <button
                    type="button"
                    onClick={handleUndoFix}
                    className="px-3 py-1.5 rounded-btn bg-[#1C2128] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs flex items-center space-x-1"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Undo Applied Fix</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorExplainer;
