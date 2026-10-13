import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Clock,
  Code
} from 'lucide-react';
import {
  getSavedPrograms,
  deleteSavedProgram,
  renameSavedProgram,
  clearProgramHistory
} from '../utils/storage.js';

export function ProgramHistory({ isOpen, onClose, onOpenProgram }) {
  const [programs, setPrograms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const refreshList = () => {
    setPrograms(getSavedPrograms());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setConfirmClear(false);
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredPrograms = programs.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q))
    );
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    deleteSavedProgram(id);
    refreshList();
  };

  const handleStartRename = (program, e) => {
    e.stopPropagation();
    setEditingId(program.id);
    setEditingName(program.name);
  };

  const handleSaveRename = (id, e) => {
    e.stopPropagation();
    if (editingName.trim()) {
      renameSavedProgram(id, editingName.trim());
      setEditingId(null);
      refreshList();
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleClearAll = () => {
    clearProgramHistory();
    setConfirmClear(false);
    refreshList();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-panel shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-150 text-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] bg-[#161B22]">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4 text-[#58A6FF]" />
            <h2 id="history-dialog-title" className="text-sm font-semibold text-[#E6EDF3]">
              Saved Programs &amp; History
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[#8B949E] font-mono">
              {programs.length} saved
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 border-b border-[#30363D] bg-[#0D1117] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#8B949E] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved programs by name or code..."
              className="w-full bg-[#161B22] border border-[#30363D] focus:border-[#58A6FF] rounded pl-8 pr-3 py-1.5 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none"
            />
          </div>

          {programs.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-2 py-1 rounded bg-[#F85149] hover:bg-[#F85149]/90 text-white text-[11px] font-medium"
                  >
                    Confirm Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1 rounded bg-[#1C2128] text-[#8B949E] text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="px-2.5 py-1.5 rounded border border-[#30363D] hover:border-[#F85149]/50 text-[#8B949E] hover:text-[#F85149] text-xs flex items-center space-x-1"
                  title="Clear all program history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Programs List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPrograms.length === 0 ? (
            <div className="py-12 text-center text-[#8B949E] space-y-2">
              <Code className="w-8 h-8 mx-auto text-[#30363D]" />
              <p className="text-xs">
                {searchQuery ? 'No saved programs match your search.' : 'No saved programs yet.'}
              </p>
              <p className="text-[11px] text-[#8B949E]">
                Save programs from the top File menu or Translation page to review them later.
              </p>
            </div>
          ) : (
            filteredPrograms.map((prog) => {
              const isEditing = editingId === prog.id;

              return (
                <div
                  key={prog.id}
                  onClick={() => {
                    if (!isEditing && onOpenProgram) {
                      onOpenProgram(prog);
                      onClose();
                    }
                  }}
                  className="p-3 rounded border border-[#30363D] bg-[#161B22] hover:bg-[#1C2128] transition-colors cursor-pointer group space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Program Title */}
                    {isEditing ? (
                      <div
                        className="flex items-center space-x-1.5 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-[#0D1117] border border-[#58A6FF] rounded px-2 py-1 text-xs text-[#E6EDF3] flex-1 outline-none font-medium"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={(e) => handleSaveRename(prog.id, e)}
                          className="p-1 rounded text-[#3FB950] hover:bg-[#0D1117]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelRename}
                          className="p-1 rounded text-[#8B949E] hover:bg-[#0D1117]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-[#E6EDF3] group-hover:text-[#58A6FF] transition-colors">
                          {prog.name}
                        </span>
                        <span className="text-[10px] text-[#8B949E] flex items-center space-x-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatDate(prog.updatedAt || prog.createdAt)}</span>
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(prog, e)}
                          className="p-1 rounded hover:bg-[#0D1117] text-[#8B949E] hover:text-[#E6EDF3]"
                          title="Rename program"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(prog.id, e)}
                          className="p-1 rounded hover:bg-[#0D1117] text-[#8B949E] hover:text-[#F85149]"
                          title="Delete program"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="inline-flex items-center space-x-1 text-[11px] text-[#58A6FF] font-medium pl-1">
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Code Snippet Preview */}
                  <pre className="p-2 rounded bg-[#0D1117] border border-[#30363D] font-mono text-[11px] text-[#8B949E] overflow-hidden text-ellipsis line-clamp-2">
                    {prog.code}
                  </pre>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t border-[#30363D] bg-[#161B22] flex items-center justify-between text-[11px] text-[#8B949E]">
          <span>Programs saved locally in your browser</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#1C2128] border border-[#30363D] text-[#E6EDF3] hover:bg-[#30363D]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgramHistory;
