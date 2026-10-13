import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';
import { traceExecution } from '../services/tracerService.js';
import { VariableInspector } from './VariableInspector.jsx';
import { useGamification } from '../context/GamificationContext.jsx';

export function ExecutionTracer({ code, onStepLineChange, onClose }) {
  const { awardXp } = useGamification();
  const [traceResult, setTraceResult] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  // Compute trace on mount or when code changes
  useEffect(() => {
    if (!code || !code.trim()) {
      setTraceResult(null);
      return;
    }

    const result = traceExecution(code);
    setTraceResult(result);
    setCurrentStepIndex(0);
    setIsPlaying(false);

    if (result.success && result.steps.length > 0 && onStepLineChange) {
      onStepLineChange(result.steps[0].lineNumber);
    }
  }, [code]);

  // Synchronize active line to parent editor
  const syncLine = (stepIdx) => {
    if (traceResult?.steps?.[stepIdx] && onStepLineChange) {
      onStepLineChange(traceResult.steps[stepIdx].lineNumber);
    }
  };

  // Step control handlers
  const handleNext = () => {
    if (!traceResult?.steps) return;
    if (currentStepIndex < traceResult.steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      syncLine(nextIdx);

      if (nextIdx === traceResult.steps.length - 1) {
        awardXp(
          'LEARNING_LESSON',
          `trace_${traceResult.steps.length}_${code.slice(0, 30).trim()}`,
          'Completed visual execution trace lesson (+15 XP)'
        );
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      syncLine(prevIdx);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
    syncLine(0);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (traceResult?.steps && currentStepIndex >= traceResult.steps.length - 1) {
        // If at end, loop back to start
        setCurrentStepIndex(0);
        syncLine(0);
      }
      setIsPlaying(true);
    }
  };

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (!traceResult?.steps || prev >= traceResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          syncLine(next);

          if (next === traceResult.steps.length - 1) {
            awardXp(
              'LEARNING_LESSON',
              `trace_${traceResult.steps.length}_${code.slice(0, 30).trim()}`,
              'Completed visual execution trace lesson (+15 XP)'
            );
          }

          return next;
        });
      }, 1200);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, traceResult, code, awardXp]);

  if (!traceResult) {
    return null;
  }

  // Unsupported syntax view
  if (!traceResult.success) {
    return (
      <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
          <div className="flex items-center space-x-2 text-[#F85149]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-sm">Visual Execution Tracer — Unsupported Code</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#8B949E] hover:text-[#E6EDF3] text-xs px-2 py-0.5 rounded border border-[#30363D] hover:bg-[#1C2128]"
            >
              Close
            </button>
          )}
        </div>

        <p className="text-[#E6EDF3] leading-relaxed">
          {traceResult.error}
        </p>

        <div className="p-3 rounded bg-[#0D1117] border border-[#30363D] space-y-1.5 text-[11px] text-[#8B949E]">
          <div className="flex items-center space-x-1.5 text-[#58A6FF] font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>Supported Python Tracer Subset:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>Variable assignments (numbers, strings, booleans, lists)</li>
            <li>Binary arithmetic (+, -, *, /, //, %) &amp; comparisons (==, !=, &lt;, &gt;)</li>
            <li>Conditions (if, elif, and else)</li>
            <li>Bounded loops (for i in range(...), up to 50 iterations)</li>
            <li>Output statements (print(...))</li>
          </ul>
        </div>
      </div>
    );
  }

  const steps = traceResult.steps;
  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex >= steps.length - 1;

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs space-y-3 select-text">
      {/* Top Header & Step Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#30363D] gap-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#3FB950]" />
          <h2 className="font-semibold text-sm text-[#E6EDF3]">Visual Execution Tracer</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[#8B949E] font-mono">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          {currentStep?.lineNumber && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2128] border border-[#58A6FF]/40 text-[#58A6FF] font-mono">
              Ln {currentStep.lineNumber}
            </span>
          )}
        </div>

        {/* Step Buttons */}
        <div className="flex items-center space-x-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isFirst}
            className={`p-1.5 rounded border border-[#30363D] ${
              isFirst
                ? 'opacity-40 cursor-not-allowed bg-[#161B22]'
                : 'bg-[#1C2128] hover:bg-[#30363D] text-[#E6EDF3]'
            }`}
            title="Previous Step"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className={`px-2.5 py-1 rounded border border-[#30363D] flex items-center space-x-1 font-medium text-xs ${
              isPlaying
                ? 'bg-[#F85149]/20 text-[#F85149] border-[#F85149]/40 hover:bg-[#F85149]/30'
                : 'bg-[#238636] hover:bg-[#2EA043] text-white border-transparent'
            }`}
            title={isPlaying ? 'Pause Execution' : 'Play Step-by-Step'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLast}
            className={`p-1.5 rounded border border-[#30363D] ${
              isLast
                ? 'opacity-40 cursor-not-allowed bg-[#161B22]'
                : 'bg-[#1C2128] hover:bg-[#30363D] text-[#E6EDF3]'
            }`}
            title="Next Step"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded border border-[#30363D] bg-[#1C2128] hover:bg-[#30363D] text-[#8B949E] hover:text-[#E6EDF3]"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 rounded border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs hover:bg-[#1C2128] ml-2"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Current Executing Statement */}
      <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <span className="text-[10px] text-[#8B949E] uppercase font-mono shrink-0">
            Current Line:
          </span>
          <code className="font-mono text-xs text-[#3FB950] truncate">
            {currentStep?.lineContent || '#'}
          </code>
        </div>
      </div>

      {/* Conversational Telugu Step Narration */}
      <div className="p-3 rounded bg-[#1C2128] border border-[#30363D] space-y-1">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-[#58A6FF]">
          Execution Step Explanation (Telugu)
        </div>
        <p className="text-[#E6EDF3] leading-relaxed text-xs">
          {currentStep?.narrationTelugu}
        </p>
      </div>

      {/* Side-by-side Variable Inspector and Output Console */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Variable Inspector */}
        <VariableInspector
          variables={currentStep?.variables || {}}
          changedVariable={currentStep?.changedVariable || null}
        />

        {/* Console Output */}
        <div className="rounded-md border border-[#30363D] bg-[#0D1117] overflow-hidden text-xs flex flex-col">
          <div className="px-3 py-1.5 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[#8B949E]">
              <Terminal className="w-3.5 h-3.5 text-[#3FB950]" />
              <span className="font-medium text-[#E6EDF3]">Output Console</span>
            </div>
            <span className="text-[10px] text-[#8B949E] font-mono">stdout</span>
          </div>

          <div className="p-2.5 max-h-48 overflow-y-auto font-mono text-[11px] space-y-1 flex-1">
            {currentStep?.output?.length === 0 ? (
              <div className="text-[#8B949E] text-[11px] italic py-3 text-center">
                (No output printed yet)
              </div>
            ) : (
              currentStep?.output?.map((line, idx) => (
                <div key={idx} className="text-[#E6EDF3] flex items-start space-x-2">
                  <span className="text-[#8B949E] select-none">&gt;</span>
                  <span>{line}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutionTracer;
