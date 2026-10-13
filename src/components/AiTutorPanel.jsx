import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  HelpCircle,
  Bug,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Send,
  Code,
  Wand2,
  ArrowRight,
  Undo2,
  Check,
  AlertCircle,
  Layers,
  X
} from 'lucide-react';
import {
  askCodeQuestion,
  getAiTutorHint,
  getAiTutorBugAnalysis,
  getAiTutorCodeImprovement,
  getAiTutorPracticeQuestion,
  getActiveApiKey
} from '../services/gemini.js';
import { useGamification } from '../context/GamificationContext.jsx';

const LANGUAGE_MODES = [
  { id: 'simple_telugu', label: 'Simple Telugu' },
  { id: 'detailed_telugu', label: 'Detailed Telugu' },
  { id: 'english', label: 'English' },
  { id: 'interview', label: 'Interview Style' },
];

export function AiTutorPanel({
  code = '',
  selectedLine = null,
  onApplyCode,
  onOpenApiKey,
  isOpen,
  onClose,
}) {
  const { awardXp } = useGamification();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'hint' | 'bugs' | 'improve' | 'practice'
  const [languageMode, setLanguageMode] = useState('simple_telugu');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([
    {
      role: 'tutor',
      content:
        'Namaskaram! Nenu mee AI Coding Companion ni. Ee code gurinchi emaina doubt unte adagandi leda kindi quick actions use cheyandi.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Hint mode state
  const [hintLevel, setHintLevel] = useState(1);
  const [hintData, setHintData] = useState(null);

  // Bug analysis state
  const [bugData, setBugData] = useState(null);
  const [previousCodeBeforeApply, setPreviousCodeBeforeApply] = useState(null);
  const [appliedNotice, setAppliedNotice] = useState(false);

  // Code improvement state
  const [improvementData, setImprovementData] = useState(null);

  // Practice question state
  const [practiceQ, setPracticeQ] = useState(null);
  const [selectedPracticeOpt, setSelectedPracticeOpt] = useState(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const validateHasCode = () => {
    if (!code || !code.trim()) {
      setError('Please paste or write Python code in the editor before using the AI Tutor.');
      return false;
    }
    return true;
  };

  const validateApiKey = () => {
    const key = getActiveApiKey();
    if (!key) {
      setError('A Gemini API key is required to use the AI Coding Companion.');
      return false;
    }
    return true;
  };

  // 1. Explain My Code / Explain This Line
  const handleExplainCode = async (lineSpecific = false) => {
    if (!validateHasCode() || !validateApiKey()) return;

    setActiveTab('chat');
    setIsLoading(true);
    setError(null);

    const questionText = lineSpecific && selectedLine
      ? `Explain Line ${selectedLine} in detail.`
      : `Explain what this whole Python program does.`;

    const userMsg = { role: 'user', content: questionText };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await askCodeQuestion(code, questionText, lineSpecific ? selectedLine : null, messages);
      setMessages((prev) => [...prev, { role: 'tutor', content: res.answer }]);
    } catch (err) {
      setError(err.message || 'Failed to explain code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Progressive Hint Mode
  const handleFetchHint = async (level = hintLevel) => {
    if (!validateHasCode() || !validateApiKey()) return;

    setActiveTab('hint');
    setIsLoading(true);
    setError(null);

    try {
      const res = await getAiTutorHint(code, level, languageMode);
      setHintData(res);
      setHintLevel(level);
    } catch (err) {
      setError(err.message || 'Failed to generate hint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextHint = () => {
    const nextLvl = Math.min(3, hintLevel + 1);
    handleFetchHint(nextLvl);
  };

  // 3. Find Bugs
  const handleFindBugs = async () => {
    if (!validateHasCode() || !validateApiKey()) return;

    setActiveTab('bugs');
    setIsLoading(true);
    setError(null);
    setAppliedNotice(false);

    try {
      const res = await getAiTutorBugAnalysis(code, languageMode);
      setBugData(res);
    } catch (err) {
      setError(err.message || 'Failed to analyze code for bugs.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply suggested code with undo capability
  const handleApplySuggestion = (suggestedCode) => {
    if (!suggestedCode || !onApplyCode) return;
    setPreviousCodeBeforeApply(code);
    onApplyCode(suggestedCode);
    setAppliedNotice(true);

    // Award Bug Hunter XP (+25 XP)
    awardXp('BUG_FIX', `bug_fix_${Date.now()}`, 'Fixed code bug and applied suggestion (+25 XP)');
  };

  const handleUndoApply = () => {
    if (previousCodeBeforeApply && onApplyCode) {
      onApplyCode(previousCodeBeforeApply);
      setPreviousCodeBeforeApply(null);
      setAppliedNotice(false);
    }
  };

  // 4. Improve Code
  const handleImproveCode = async () => {
    if (!validateHasCode() || !validateApiKey()) return;

    setActiveTab('improve');
    setIsLoading(true);
    setError(null);

    try {
      const res = await getAiTutorCodeImprovement(code, languageMode);
      setImprovementData(res);
    } catch (err) {
      setError(err.message || 'Failed to improve code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Generate Practice Question
  const handleGeneratePractice = async () => {
    if (!validateHasCode() || !validateApiKey()) return;

    setActiveTab('practice');
    setIsLoading(true);
    setError(null);
    setSelectedPracticeOpt(null);
    setPracticeSubmitted(false);

    try {
      const res = await getAiTutorPracticeQuestion(code, languageMode);
      setPracticeQ(res);
    } catch (err) {
      setError(err.message || 'Failed to generate practice question.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerPractice = () => {
    if (selectedPracticeOpt === null || !practiceQ) return;
    setPracticeSubmitted(true);

    if (selectedPracticeOpt === practiceQ.correctIndex) {
      // Award XP (+10 XP) for output / practice question answered correctly
      awardXp('OUTPUT_QUESTION', practiceQ.id, 'Answered AI Tutor practice question correctly (+10 XP)');
    }
  };

  // 6. Custom Chat Message Send
  const handleSendCustomMessage = async (e) => {
    e?.preventDefault();
    const q = chatInput.trim();
    if (!q || isLoading) return;
    if (!validateHasCode() || !validateApiKey()) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await askCodeQuestion(code, q, selectedLine, messages);
      setMessages((prev) => [...prev, { role: 'tutor', content: res.answer }]);
    } catch (err) {
      setError(err.message || 'Failed to answer question.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-4 text-xs flex flex-col h-[560px] shadow-2xl select-text animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-[#1F6FEB]/20 border border-[#58A6FF]/40 text-[#58A6FF]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-[#E6EDF3]">AI Coding Companion</h3>
            <span className="text-[10px] text-[#8B949E]">
              Interactive Telugu Python Tutor
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language selector */}
          <select
            value={languageMode}
            onChange={(e) => setLanguageMode(e.target.value)}
            className="bg-[#0D1117] border border-[#30363D] text-[11px] text-[#E6EDF3] rounded px-2 py-1 outline-none"
          >
            {LANGUAGE_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#1C2128]"
            title="Close AI Tutor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 py-2.5 border-b border-[#30363D]">
        <button
          type="button"
          onClick={() => handleExplainCode(false)}
          disabled={isLoading}
          className={`p-2 rounded border text-left flex items-center space-x-1.5 transition-colors ${
            activeTab === 'chat'
              ? 'bg-[#1C2128] border-[#58A6FF] text-[#58A6FF]'
              : 'bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
        >
          <Code className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Explain My Code</span>
        </button>

        <button
          type="button"
          onClick={() => handleExplainCode(true)}
          disabled={isLoading}
          className="p-2 rounded border text-left flex items-center space-x-1.5 transition-colors bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]"
        >
          <Layers className="w-3.5 h-3.5 shrink-0 text-[#58A6FF]" />
          <span className="truncate">{selectedLine ? `Explain Line ${selectedLine}` : 'Explain Line'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleFetchHint(1)}
          disabled={isLoading}
          className={`p-2 rounded border text-left flex items-center space-x-1.5 transition-colors ${
            activeTab === 'hint'
              ? 'bg-[#1C2128] border-[#3FB950] text-[#3FB950]'
              : 'bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 shrink-0 text-[#3FB950]" />
          <span className="truncate">Give Me a Hint</span>
        </button>

        <button
          type="button"
          onClick={handleFindBugs}
          disabled={isLoading}
          className={`p-2 rounded border text-left flex items-center space-x-1.5 transition-colors ${
            activeTab === 'bugs'
              ? 'bg-[#1C2128] border-[#F85149] text-[#F85149]'
              : 'bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
        >
          <Bug className="w-3.5 h-3.5 shrink-0 text-[#F85149]" />
          <span className="truncate">Find Bugs</span>
        </button>

        <button
          type="button"
          onClick={handleImproveCode}
          disabled={isLoading}
          className={`p-2 rounded border text-left flex items-center space-x-1.5 transition-colors ${
            activeTab === 'improve'
              ? 'bg-[#1C2128] border-[#58A6FF] text-[#58A6FF]'
              : 'bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 shrink-0 text-[#58A6FF]" />
          <span className="truncate">Improve My Code</span>
        </button>

        <button
          type="button"
          onClick={handleGeneratePractice}
          disabled={isLoading}
          className={`p-2 rounded border text-left flex items-center space-x-1.5 transition-colors ${
            activeTab === 'practice'
              ? 'bg-[#1C2128] border-[#3FB950] text-[#3FB950]'
              : 'bg-[#0D1117] border-[#30363D] text-[#E6EDF3] hover:bg-[#1C2128]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[#3FB950]" />
          <span className="truncate">Practice Questions</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3">
        {/* Error notification */}
        {error && (
          <div className="p-3 rounded bg-[#0D1117] border border-[#F85149]/40 flex items-center justify-between text-xs text-[#F85149]">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {onOpenApiKey && (
              <button
                type="button"
                onClick={onOpenApiKey}
                className="text-[#58A6FF] underline text-xs ml-2 shrink-0"
              >
                Set API Key
              </button>
            )}
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-[#0D1117] border border-[#30363D] rounded text-xs text-[#8B949E]">
            <Sparkles className="w-4 h-4 text-[#58A6FF] animate-spin" />
            <span>AI Companion is thinking...</span>
          </div>
        )}

        {/* TAB 1: Chat View */}
        {activeTab === 'chat' && (
          <div className="space-y-3">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-[#8B949E] mb-1 font-mono">
                    {isUser ? 'You' : 'AI Companion (Telugu)'}
                  </div>
                  <div
                    className={`max-w-[90%] p-3 rounded-md text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-[#1F6FEB]/20 border border-[#1F6FEB]/50 text-[#E6EDF3]'
                        : 'bg-[#0D1117] border border-[#30363D] text-[#E6EDF3]'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* TAB 2: Hint Mode */}
        {activeTab === 'hint' && hintData && (
          <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#3FB950] flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4" />
                <span>
                  {hintData.hintLevel === 1
                    ? 'Gentle Hint (Level 1)'
                    : hintData.hintLevel === 2
                    ? 'Guided Hint (Level 2)'
                    : 'Complete Solution (Level 3)'}
                </span>
              </span>
              <span className="text-[10px] font-mono text-[#8B949E]">
                Hint {hintData.hintLevel} of 3
              </span>
            </div>

            <p className="text-xs text-[#E6EDF3] leading-relaxed whitespace-pre-wrap">
              {hintData.hintText}
            </p>

            <div className="text-[11px] text-[#8B949E] italic">
              {hintData.encouragement}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#30363D]">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="text-[#8B949E] hover:text-[#E6EDF3] text-xs"
              >
                Back to Chat
              </button>

              {hintData.hintLevel < 3 && (
                <button
                  type="button"
                  onClick={handleNextHint}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium flex items-center space-x-1"
                >
                  <span>{hintData.hintLevel === 1 ? 'Need More Help? (Level 2)' : 'Reveal Solution (Level 3)'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Find Bugs */}
        {activeTab === 'bugs' && bugData && (
          <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
              <div className="flex items-center space-x-2">
                <Bug className="w-4 h-4 text-[#F85149]" />
                <span className="font-semibold text-xs text-[#E6EDF3]">
                  {bugData.hasBug ? 'Bug Detected in Code' : 'No Bugs Detected!'}
                </span>
              </div>
              {bugData.line && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2128] border border-[#F85149]/40 text-[#F85149]">
                  Line {bugData.line}
                </span>
              )}
            </div>

            {appliedNotice && (
              <div className="p-2.5 rounded bg-[#238636]/20 border border-[#3FB950] text-[#3FB950] flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>Suggested code applied to editor! +25 XP awarded!</span>
                </div>
                <button
                  type="button"
                  onClick={handleUndoApply}
                  className="text-xs underline font-mono text-[#E6EDF3] flex items-center space-x-1"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-[10px] uppercase font-semibold text-[#58A6FF]">Problem:</div>
              <p className="text-xs text-[#E6EDF3] leading-relaxed">
                {bugData.problemExplanation}
              </p>
            </div>

            {bugData.reasonExplanation && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-semibold text-[#8B949E]">Reason:</div>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  {bugData.reasonExplanation}
                </p>
              </div>
            )}

            {bugData.suggestedCorrection && (
              <div className="space-y-2 pt-1">
                <div className="text-[10px] uppercase font-semibold text-[#3FB950]">Suggested Correction:</div>
                <pre className="p-2.5 rounded bg-[#161B22] border border-[#30363D] font-mono text-xs text-[#E6EDF3] overflow-x-auto whitespace-pre">
                  <code>{bugData.suggestedCorrection}</code>
                </pre>
                <div className="text-[11px] text-[#8B949E]">
                  {bugData.differenceExplanation}
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleApplySuggestion(bugData.suggestedCorrection)}
                    className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Suggested Code to Editor</span>
                  </button>
                  {previousCodeBeforeApply && (
                    <button
                      type="button"
                      onClick={handleUndoApply}
                      className="px-3 py-1.5 rounded-btn bg-[#1C2128] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Improve My Code */}
        {activeTab === 'improve' && improvementData && (
          <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center space-x-2 text-[#58A6FF] font-semibold text-xs">
              <Wand2 className="w-4 h-4" />
              <span>Code Improvement Suggestions</span>
            </div>

            <p className="text-xs text-[#E6EDF3] leading-relaxed">
              {improvementData.summary}
            </p>

            {improvementData.improvements?.length > 0 && (
              <div className="space-y-1 pl-1">
                <div className="text-[10px] uppercase text-[#8B949E] font-semibold">Key Highlights:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#8B949E]">
                  {improvementData.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <pre className="p-2.5 rounded bg-[#161B22] border border-[#30363D] font-mono text-xs text-[#58A6FF] overflow-x-auto whitespace-pre">
                <code>{improvementData.improvedCode}</code>
              </pre>

              <button
                type="button"
                onClick={() => handleApplySuggestion(improvementData.improvedCode)}
                className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Improved Code</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: Practice Questions */}
        {activeTab === 'practice' && practiceQ && (
          <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363D]">
              <span className="font-semibold text-xs text-[#3FB950] flex items-center space-x-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{practiceQ.questionType || 'Practice Question'}</span>
              </span>
              <span className="text-[10px] font-mono text-[#3FB950] bg-[#1C2128] px-2 py-0.5 rounded border border-[#30363D]">
                +10 XP on correct answer
              </span>
            </div>

            <h4 className="text-xs font-medium text-[#E6EDF3] leading-relaxed">
              {practiceQ.questionText}
            </h4>

            {practiceQ.codeSnippet && (
              <pre className="p-2 rounded bg-[#161B22] border border-[#30363D] font-mono text-xs text-[#58A6FF]">
                <code>{practiceQ.codeSnippet}</code>
              </pre>
            )}

            <div className="space-y-1.5">
              {practiceQ.options.map((opt, idx) => {
                const isSelected = selectedPracticeOpt === idx;
                const isCorrect = idx === practiceQ.correctIndex;

                let cls = 'bg-[#161B22] border-[#30363D] text-[#E6EDF3] hover:border-[#58A6FF]';
                if (practiceSubmitted) {
                  if (isCorrect) {
                    cls = 'bg-[#238636]/20 border-[#3FB950] text-[#3FB950]';
                  } else if (isSelected && !isCorrect) {
                    cls = 'bg-[#F85149]/20 border-[#F85149] text-[#F85149]';
                  }
                } else if (isSelected) {
                  cls = 'bg-[#1C2128] border-[#58A6FF] text-[#58A6FF]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={practiceSubmitted}
                    onClick={() => setSelectedPracticeOpt(idx)}
                    className={`w-full text-left p-2.5 rounded border text-xs flex items-center justify-between transition-colors ${cls}`}
                  >
                    <span>{opt}</span>
                    {practiceSubmitted && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />}
                    {practiceSubmitted && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-[#F85149]" />}
                  </button>
                );
              })}
            </div>

            {practiceSubmitted && (
              <div className="p-2.5 rounded bg-[#161B22] border border-[#30363D] text-xs text-[#8B949E] leading-relaxed">
                {practiceQ.explanation}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-[#30363D]">
              <button
                type="button"
                onClick={handleGeneratePractice}
                className="text-[#8B949E] hover:text-[#E6EDF3] text-xs flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New Question</span>
              </button>

              {!practiceSubmitted ? (
                <button
                  type="button"
                  disabled={selectedPracticeOpt === null}
                  onClick={handleAnswerPractice}
                  className={`px-3 py-1.5 rounded-btn font-medium text-xs transition-colors ${
                    selectedPracticeOpt === null
                      ? 'bg-[#238636]/40 text-white/40 cursor-not-allowed'
                      : 'bg-[#238636] hover:bg-[#2EA043] text-white'
                  }`}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePractice}
                  className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white text-xs font-medium"
                >
                  Next Challenge
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSendCustomMessage} className="pt-2 border-t border-[#30363D] flex items-center space-x-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask tutor in Telugu or English (e.g. Why range(3)? / Explain loop)..."
          disabled={isLoading}
          className="flex-1 bg-[#0D1117] border border-[#30363D] focus:border-[#58A6FF] rounded px-3 py-2 text-xs text-[#E6EDF3] placeholder-[#8B949E] outline-none"
        />
        <button
          type="submit"
          disabled={isLoading || !chatInput.trim()}
          className={`p-2 rounded font-medium text-xs transition-colors ${
            isLoading || !chatInput.trim()
              ? 'bg-[#238636]/40 text-white/40 cursor-not-allowed'
              : 'bg-[#238636] hover:bg-[#2EA043] text-white'
          }`}
          title="Send message to AI Tutor"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export default AiTutorPanel;
