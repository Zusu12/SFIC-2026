import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, BookOpen, Key, Plus } from 'lucide-react';

export function Header({ onOpenAbout, onOpenApiKey, hasApiKey }) {
  const location = useLocation();
  const isTranslatePage = location.pathname.startsWith('/translate');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border/80 bg-surface-darkest/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-2.5 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
            aria-label="CodeToTelugu Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 p-0.5 shadow-glow group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-surface-darkest rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-cyan-300 bg-clip-text text-transparent">
                  CodeToTelugu
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Python Learning Studio
                </span>
              </div>
              <p className="text-[11px] text-surface-muted hidden md:block">
                Understand Code. Learn in Telugu.
              </p>
            </div>
          </Link>

          {/* Breadcrumb if on translate page */}
          {isTranslatePage && (
            <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-surface-border text-xs text-surface-subtext">
              <Link to="/" className="hover:text-white transition-colors flex items-center">
                Home
              </Link>
              <span className="text-surface-muted">/</span>
              <span className="text-cyan-400 font-medium">Translation</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* New Translation Button (when on translate page) */}
          {isTranslatePage && (
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-card hover:bg-surface-cardHover text-surface-text border border-surface-border hover:border-surface-borderLight transition-all"
              title="Start a new translation"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">New Translation</span>
            </Link>
          )}

          {/* Dictionary / About Button */}
          <button
            type="button"
            onClick={onOpenAbout}
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-card/80 hover:bg-surface-cardHover text-surface-subtext hover:text-white border border-surface-border/70 hover:border-surface-borderLight transition-all"
            aria-label="View Telugu Dictionary and Learning Guide"
            title="Telugu Keyword Dictionary"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Dictionary</span>
          </button>

          {/* Gemini API Key Button */}
          <button
            type="button"
            onClick={onOpenApiKey}
            className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              hasApiKey
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 animate-pulse-slow'
            }`}
            aria-label="Configure Gemini API Key"
            title={hasApiKey ? 'Gemini API Key Configured' : 'Configure Gemini API Key'}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasApiKey ? 'AI Connected' : 'Set API Key'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
