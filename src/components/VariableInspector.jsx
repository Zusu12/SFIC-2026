import React from 'react';
import { Database } from 'lucide-react';

export function VariableInspector({ variables = {}, changedVariable = null }) {
  const entries = Object.entries(variables);

  return (
    <div className="rounded-md border border-[#30363D] bg-[#0D1117] overflow-hidden text-xs">
      <div className="px-3 py-1.5 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[#8B949E]">
          <Database className="w-3.5 h-3.5 text-[#58A6FF]" />
          <span className="font-medium text-[#E6EDF3]">Variable Inspector</span>
        </div>
        <span className="text-[11px] text-[#8B949E] font-mono">
          {entries.length} {entries.length === 1 ? 'variable' : 'variables'}
        </span>
      </div>

      <div className="p-2.5 max-h-48 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-[#8B949E] text-[11px] italic text-center py-3">
            No variables initialized yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entries.map(([name, val]) => {
              const isChanged = changedVariable === name;
              const valType = Array.isArray(val)
                ? 'list'
                : typeof val === 'number'
                ? Number.isInteger(val) ? 'int' : 'float'
                : typeof val;

              return (
                <div
                  key={name}
                  className={`p-2 rounded border transition-colors ${
                    isChanged
                      ? 'bg-[#1C2128] border-[#3FB950] ring-1 ring-[#3FB950]/50'
                      : 'bg-[#161B22] border-[#30363D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-medium text-[#58A6FF]">{name}</span>
                    <span className="text-[10px] text-[#8B949E] font-mono bg-[#0D1117] px-1 py-0.5 rounded">
                      {valType}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#E6EDF3] truncate">
                    {JSON.stringify(val)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VariableInspector;
