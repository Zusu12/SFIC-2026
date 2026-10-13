import React from 'react';
import { FileCode, Trash2, Copy, Check } from 'lucide-react';

export function EditorTabs({
  fileName = 'main.py',
  languageLabel = 'Python',
  lineCount = 1,
  charCount = 0,
  isReadOnly = false,
  onClear,
  onCopy,
  copied = false,
  badge,
}) {
  return (
    <div className="flex items-center justify-between h-9 bg-[#161B22] border-b border-[#30363D] px-2 text-xs select-none">
      {/* Left: Active Tab */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0D1117] border-t-2 border-t-[#58A6FF] border-r border-l border-[#30363D] text-[#E6EDF3] font-mono text-[12px] font-medium -mb-[1px]">
          <FileCode className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span>{fileName}</span>
        </div>

        {badge && (
          <span className="text-[11px] text-[#8B949E] px-1.5 py-0.5 rounded bg-[#1C2128] border border-[#30363D]">
            {badge}
          </span>
        )}
      </div>

      {/* Right: Meta Information & Action Buttons */}
      <div className="flex items-center space-x-3 text-[#8B949E] text-[11px]">
        <span className="hidden sm:inline font-mono">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
        <span className="hidden sm:inline font-mono">
          {charCount} chars
        </span>
        <span className="hidden md:inline px-1.5 py-0.5 rounded bg-[#1C2128] text-[#8B949E] border border-[#30363D]">
          {languageLabel}
        </span>

        {/* Clear Code Action (if provided) */}
        {onClear && !isReadOnly && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[#8B949E] hover:text-[#F85149] hover:bg-[#1C2128] transition-colors"
            title="Clear editor code"
            aria-label="Clear code"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}

        {/* Copy Action (if provided) */}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] transition-colors"
            title="Copy code"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                <span className="text-[#3FB950]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default EditorTabs;
