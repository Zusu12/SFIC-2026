import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Copy, Check, Terminal } from 'lucide-react';

export function ExplanationCard({
  step,
  index,
  isCurrentSpeaking = false,
  onSpeakStep,
}) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!step.codeReference) return;
    navigator.clipboard.writeText(step.codeReference);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className={`group relative rounded-xl border p-4 sm:p-5 transition-all duration-200 ${
        isCurrentSpeaking
          ? 'bg-gradient-to-br from-indigo-950/70 via-surface-card to-cyan-950/50 border-cyan-500 shadow-glow-cyan'
          : 'bg-surface-card/90 hover:bg-surface-cardHover/90 border-surface-border hover:border-surface-borderLight shadow-card'
      }`}
    >
      {/* Header of Step Card */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center space-x-3">
          {/* Step Number Badge */}
          <div
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-colors ${
              isCurrentSpeaking
                ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
            }`}
          >
            {step.stepNumber || index + 1}
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
              {step.title}
              {isCurrentSpeaking && (
                <span className="text-[10px] font-medium text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full animate-pulse">
                  Playing Audio
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Listen to this single step button */}
        <button
          type="button"
          onClick={() => onSpeakStep && onSpeakStep(step, index)}
          className={`p-1.5 rounded-lg border transition-all ${
            isCurrentSpeaking
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-surface-darkest/70 hover:bg-surface-border text-surface-muted hover:text-cyan-300 border-surface-border'
          }`}
          title="Listen to this step in Telugu"
          aria-label={`Listen to step ${step.stepNumber || index + 1}`}
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Telugu Explanation Text */}
      <div className="text-surface-subtext text-xs sm:text-sm leading-relaxed mb-3 whitespace-pre-line font-telugu pl-10 sm:pl-11">
        {step.explanation}
      </div>

      {/* Code Reference block (if provided) */}
      {step.codeReference && (
        <div className="mt-3 ml-10 sm:ml-11 rounded-lg bg-surface-darkest/90 border border-surface-border/80 p-2.5 flex items-center justify-between group/code">
          <div className="flex items-center space-x-2 font-mono text-xs text-indigo-300 overflow-x-auto">
            <Terminal className="w-3.5 h-3.5 text-surface-muted shrink-0" />
            <code className="text-[12px]">{step.codeReference}</code>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1 rounded hover:bg-surface-border text-surface-muted hover:text-white transition-colors shrink-0 ml-2"
            title="Copy snippet"
            aria-label="Copy code snippet"
          >
            {copiedCode ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default ExplanationCard;
