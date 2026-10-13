import React from 'react';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-select" className="text-xs text-surface-subtext flex items-center space-x-1.5">
        <Languages className="w-3.5 h-3.5 text-cyan-400" />
        <span>Target Language:</span>
      </label>
      <div className="relative inline-flex items-center">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs font-medium text-white shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Telugu (తెలుగు)</span>
          <span className="text-[10px] text-surface-muted bg-surface-darkest px-1.5 py-0.5 rounded border border-surface-border">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelector;
