import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Terminal, HelpCircle, Layers } from 'lucide-react';
import { getLineDetails, getDeterministicLineExplanation } from '../utils/lineMapper.js';
import { explainLineWithGemini, getActiveApiKey } from '../services/gemini.js';
import { getExplanationCache } from '../utils/storage.js';

export function LineExplanation({
  selectedLine = 1,
  sourceCode = '',
  translatedCode = '',
  onOpenApiKey,
}) {
  const lineDetails = getLineDetails(sourceCode, translatedCode, selectedLine);
  const localExp = getDeterministicLineExplanation(
    lineDetails.sourceText,
    lineDetails.translatedText,
    selectedLine
  );

  const [aiExplanation, setAiExplanation] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const abortControllerRef = useRef(null);

  // Manual trigger function to fetch immediately without waiting for debounce
  const triggerAiForLine = useCallback(async () => {
    const trimmed = (lineDetails.sourceText || '').trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const apiKey = getActiveApiKey();
    if (!apiKey) return;

    setIsAiLoading(true);
    try {
      const result = await explainLineWithGemini(
        sourceCode,
        selectedLine,
        lineDetails.sourceText
      );
      if (result) {
        setAiExplanation(result);
      }
    } catch (err) {
      // Local deterministic explanation remains active
    } finally {
      setIsAiLoading(false);
    }
  }, [lineDetails.sourceText, selectedLine, sourceCode]);

  // Synchronous cache check + 1800ms debounced lookup to protect API quota
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.aborted = true;
    }

    const currentController = { aborted: false };
    abortControllerRef.current = currentController;

    const trimmed = (lineDetails.sourceText || '').trim();
    if (!trimmed || trimmed.startsWith('#')) {
      setAiExplanation(null);
      setIsAiLoading(false);
      return;
    }

    // 1. Immediate synchronous cache hit (0ms, 0 API tokens consumed)
    const cached = getExplanationCache(sourceCode, undefined, `line:${selectedLine}`);
    if (cached) {
      setAiExplanation(cached);
      setIsAiLoading(false);
      return;
    }

    // Reset AI state so instant deterministic explanation is visible cleanly
    setAiExplanation(null);

    const apiKey = getActiveApiKey();
    if (!apiKey) {
      setIsAiLoading(false);
      return;
    }

    // 2. Debounce by 1800ms to avoid firing requests on casual cursor navigation
    const timer = setTimeout(async () => {
      if (currentController.aborted) return;
      setIsAiLoading(true);

      try {
        const result = await explainLineWithGemini(
          sourceCode,
          selectedLine,
          lineDetails.sourceText
        );
        if (!currentController.aborted && result) {
          setAiExplanation(result);
        }
      } catch (err) {
        // Silently fall back to deterministic explanation on background failure
      } finally {
        if (!currentController.aborted) {
          setIsAiLoading(false);
        }
      }
    }, 1800);

    return () => {
      clearTimeout(timer);
      currentController.aborted = true;
    };
  }, [selectedLine, sourceCode, lineDetails.sourceText]);

  const whatItDoes = aiExplanation?.whatItDoes || localExp.whatItDoes;
  const whyItIsUsed = aiExplanation?.whyItIsUsed || localExp.whyItIsUsed;
  const variables = aiExplanation?.variablesInvolved?.length
    ? aiExplanation.variablesInvolved
    : lineDetails.variables;

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs select-text">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#30363D] mb-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[11px] font-mono text-[#58A6FF] font-medium">
            Line {lineDetails.lineNumber}
          </span>
          <span className="text-[#8B949E] text-xs">Contextual Line Explanation</span>
        </div>

        {isAiLoading ? (
          <span className="text-[11px] text-[#8B949E] flex items-center space-x-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#58A6FF] animate-pulse" />
            <span>AI analyzing line...</span>
          </span>
        ) : aiExplanation ? (
          <span className="text-[10px] text-[#3FB950] flex items-center space-x-1 font-mono">
            <Sparkles className="w-3 h-3 text-[#3FB950]" />
            <span>AI Contextual Active</span>
          </span>
        ) : getActiveApiKey() ? (
          <button
            type="button"
            onClick={triggerAiForLine}
            className="text-[10px] text-[#58A6FF] hover:text-[#79C0FF] hover:underline flex items-center space-x-1 font-mono transition-colors"
            title="Fetch full AI contextual deep dive for this line immediately"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Deep Dive</span>
          </button>
        ) : onOpenApiKey ? (
          <button
            type="button"
            onClick={onOpenApiKey}
            className="text-[10px] text-[#58A6FF] hover:underline font-mono"
          >
            Connect Gemini Key
          </button>
        ) : null}
      </div>

      {/* Code statement comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D]">
          <div className="text-[10px] text-[#8B949E] uppercase font-semibold tracking-wider mb-1">
            Original Statement (English)
          </div>
          <code className="font-mono text-xs text-[#E6EDF3] break-all block">
            {lineDetails.sourceText || <span className="text-[#8B949E] italic">(empty line)</span>}
          </code>
        </div>

        <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D]">
          <div className="text-[10px] text-[#8B949E] uppercase font-semibold tracking-wider mb-1">
            Learning Representation (Telugu)
          </div>
          <code className="font-mono text-xs text-[#58A6FF] break-all block">
            {lineDetails.translatedText || <span className="text-[#8B949E] italic">(empty line)</span>}
          </code>
        </div>
      </div>

      {/* Explanation Points */}
      <div className="space-y-2">
        <div className="p-2.5 rounded bg-[#1C2128] border border-[#30363D]/80">
          <div className="flex items-center space-x-1.5 text-[#58A6FF] font-medium mb-1">
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span>What this line does / Ee line emi chestundi:</span>
          </div>
          <p className="text-[#E6EDF3] leading-relaxed pl-5">
            {whatItDoes}
          </p>
        </div>

        <div className="p-2.5 rounded bg-[#1C2128] border border-[#30363D]/80">
          <div className="flex items-center space-x-1.5 text-[#3FB950] font-medium mb-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Why it is used / Enduku vadatham:</span>
          </div>
          <p className="text-[#E6EDF3] leading-relaxed pl-5">
            {whyItIsUsed}
          </p>
        </div>

        {/* Variables or Identifiers Involved */}
        {variables && variables.length > 0 && (
          <div className="flex items-center space-x-2 pt-1 text-[11px] text-[#8B949E]">
            <span className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-[#58A6FF]" />
              <span>Variables involved:</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {variables.map((v) => (
                <span
                  key={v}
                  className="px-1.5 py-0.5 rounded bg-[#0D1117] border border-[#30363D] font-mono text-[#E6EDF3]"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LineExplanation;
