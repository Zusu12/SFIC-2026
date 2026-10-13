import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-5 space-y-3">
      {/* Header with compact progress indicator */}
      <div className="flex items-center space-x-2.5">
        <Loader2 className="w-4 h-4 text-[#58A6FF] animate-spin shrink-0" />
        <div>
          <h3 className="text-xs font-semibold text-[#E6EDF3]">
            Mee code ni explain chestunnam...
          </h3>
          <p className="text-[11px] text-[#8B949E]">
            Gemini is analyzing the program logic and preparing beginner-friendly Telugu explanations.
          </p>
        </div>
      </div>

      {/* Subtle compact skeleton rows */}
      <div className="space-y-2 pt-1 border-t border-[#30363D]">
        <div className="h-3 bg-[#1C2128] rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-[#1C2128] rounded w-1/2 animate-pulse" />
        <div className="h-8 bg-[#0D1117] rounded border border-[#30363D]/60 animate-pulse" />
      </div>
    </div>
  );
}

export default LoadingState;
