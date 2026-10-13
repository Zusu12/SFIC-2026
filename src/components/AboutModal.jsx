import React from 'react';
import { X, BookOpen } from 'lucide-react';
import teluguDictionary from '../dictionary/telugu.json' with { type: 'json' };

export function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const dictionaryEntries = Object.entries(teluguDictionary);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/80 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-panel bg-[#161B22] border border-[#30363D] p-5 space-y-4 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-[#58A6FF]" />
            <div>
              <h3 className="font-semibold text-sm text-[#E6EDF3]">Telugu Dictionary Reference</h3>
              <p className="text-[11px] text-[#8B949E]">
                Keyword mappings for educational learning representation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Philosophy Note */}
        <div className="space-y-1.5 text-[#8B949E] leading-relaxed">
          <p>
            <strong className="text-[#E6EDF3]">CodeToTelugu</strong> maps core Python statements into Romanized Telugu keywords so beginners can build intuition around control flow without language syntax friction.
          </p>
          <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] text-[11px]">
            <span className="text-[#E6EDF3] font-medium">Important:</span> Translated code is for visual conceptual learning. The original Python source is preserved verbatim for execution.
          </div>
        </div>

        {/* Dictionary Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[#8B949E]">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Keyword Mappings</span>
            <span className="font-mono text-[11px]">{dictionaryEntries.length} keywords</span>
          </div>

          <div className="rounded border border-[#30363D] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1C2128] border-b border-[#30363D] text-[#8B949E]">
                  <th className="py-2 px-3 font-medium">Python Keyword</th>
                  <th className="py-2 px-3 font-medium">Telugu Transliteration</th>
                  <th className="py-2 px-3 font-medium hidden sm:table-cell">Meaning / Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363D] font-mono text-[12px]">
                {dictionaryEntries.map(([py, tel]) => (
                  <tr key={py} className="hover:bg-[#1C2128]/40 transition-colors">
                    <td className="py-1.5 px-3 text-[#58A6FF]">{py}</td>
                    <td className="py-1.5 px-3 text-[#E6EDF3] font-telugu">{tel}</td>
                    <td className="py-1.5 px-3 text-[#8B949E] font-sans text-xs hidden sm:table-cell">
                      {py === 'if' && 'ఒక వేళ (Condition branch)'}
                      {py === 'else' && 'లేకపోతే (Alternative branch)'}
                      {py === 'elif' && 'లేకపోతే ఒక వేళ అయితే (Secondary condition)'}
                      {py === 'for' && 'ప్రతీ దానికి (Iteration loop)'}
                      {py === 'while' && 'వరకు (Condition loop)'}
                      {py === 'print' && 'చూపించు (Display output)'}
                      {py === 'input' && 'అడుగు (Get user input)'}
                      {py === 'def' && 'నిర్వచించు (Define function)'}
                      {py === 'return' && 'తిరిగి ఇవ్వు (Return output)'}
                      {py === 'in' && 'లో (Membership check)'}
                      {py === 'and' && 'మరియు (Logical AND)'}
                      {py === 'or' && 'లేదా (Logical OR)'}
                      {py === 'True' && 'నిజం (Boolean True)'}
                      {py === 'False' && 'అబద్ధం (Boolean False)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#30363D]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D]/50 text-[#E6EDF3] border border-[#30363D] transition-colors text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AboutModal;
