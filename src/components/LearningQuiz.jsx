import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Key
} from 'lucide-react';
import { generateQuizWithGemini } from '../services/quizService.js';
import { getActiveApiKey } from '../services/gemini.js';
import { useGamification } from '../context/GamificationContext.jsx';

export function LearningQuiz({ code, onOpenApiKey, onClose }) {
  const { awardXp } = useGamification();
  const [questions, setQuestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quiz progression state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]); // [{ questionId, selectedIndex, isCorrect }]
  const [isFinished, setIsFinished] = useState(false);

  const loadQuiz = useCallback(async (bypass = false) => {
    if (!code || !code.trim()) return;

    const apiKey = getActiveApiKey();
    if (!apiKey) {
      setError({
        code: 'NO_API_KEY',
        message: 'A Gemini API key is required to generate interactive quizzes for your code.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setUserAnswers([]);
    setIsFinished(false);

    try {
      const data = await generateQuizWithGemini(code, bypass);
      setQuestions(data);
    } catch (err) {
      console.warn('Quiz generation error:', err);
      setError({
        code: err.code || 'GEN_ERROR',
        message: err.message || 'Failed to generate quiz questions for this code.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadQuiz(false);
  }, [loadQuiz]);

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !questions) return;
    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.correctIndex;

    setIsSubmitted(true);
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQ.id,
        selectedIndex: selectedOption,
        isCorrect,
      },
    ]);

    if (isCorrect) {
      const qId = currentQ.id || `quiz_${currentIndex}_${currentQ.questionText?.slice(0, 20)}`;
      awardXp('OUTPUT_QUESTION', qId, 'Answered code-output quiz question correctly (+10 XP)');
    }
  };

  const handleNextQuestion = () => {
    if (!questions) return;
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setUserAnswers([]);
    setIsFinished(false);
  };

  const handleGenerateFresh = () => {
    loadQuiz(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-8 text-center space-y-3">
        <div className="w-5 h-5 border-2 border-[#58A6FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-sm font-medium text-[#E6EDF3]">Generating Quiz Questions...</h3>
        <p className="text-xs text-[#8B949E]">
          Gemini is analyzing your Python code and preparing Telugu assessment questions.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-5 text-xs space-y-3">
        <div className="flex items-center space-x-2 text-[#F85149]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm">Could Not Load Quiz</span>
        </div>
        <p className="text-[#E6EDF3] leading-relaxed">{error.message}</p>
        <div className="flex items-center space-x-2 pt-2">
          {error.code === 'NO_API_KEY' ? (
            <button
              type="button"
              onClick={onOpenApiKey}
              className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white font-medium text-xs flex items-center space-x-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Gemini API Key</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => loadQuiz(true)}
              className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white font-medium text-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Quiz Generation</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-btn bg-[#1C2128] border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] text-xs"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  // Final Score Screen
  if (isFinished) {
    const score = userAnswers.filter((a) => a.isCorrect).length;
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    return (
      <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-5 text-xs space-y-4 select-text">
        <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
          <div className="flex items-center space-x-2 text-[#3FB950]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <h3 className="font-semibold text-sm text-[#E6EDF3]">Quiz Complete / Pariksha Poorthi Ayyindi</h3>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#8B949E] hover:text-[#E6EDF3] text-xs px-2 py-0.5 rounded border border-[#30363D]"
            >
              Close
            </button>
          )}
        </div>

        {/* Score banner */}
        <div className="p-4 rounded-md bg-[#0D1117] border border-[#30363D] text-center space-y-1">
          <div className="text-2xl font-bold font-mono text-[#58A6FF]">
            {score} / {total}
          </div>
          <div className="text-xs text-[#E6EDF3]">
            {percentage >= 70 ? 'Excellent! Mee concept clear ga undi!' : 'Good effort! Logic ni marosari chusi practice cheyandi.'}
          </div>
        </div>

        {/* Review list */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
            Review Questions &amp; Answers:
          </h4>
          {questions.map((q, idx) => {
            const answer = userAnswers.find((a) => a.questionId === q.id);
            const isCorrect = answer?.isCorrect;

            return (
              <div
                key={q.id}
                className={`p-3 rounded border ${
                  isCorrect
                    ? 'bg-[#1C2128] border-[#3FB950]/50'
                    : 'bg-[#1C2128] border-[#F85149]/50'
                } space-y-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-[#E6EDF3]">
                    {idx + 1}. {q.questionTelugu}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                      isCorrect ? 'bg-[#3FB950]/20 text-[#3FB950]' : 'bg-[#F85149]/20 text-[#F85149]'
                    }`}
                  >
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="text-[11px] text-[#8B949E]">
                  <span className="font-semibold text-[#E6EDF3]">Sariayina Samadhanam: </span>
                  <span className="text-[#3FB950] font-mono">{q.options[q.correctIndex]}</span>
                </div>

                <div className="p-2 rounded bg-[#0D1117] border border-[#30363D] text-[11px] text-[#8B949E] leading-relaxed">
                  {q.explanationTelugu}
                </div>
              </div>
            );
          })}
        </div>

        {/* Retry & New Quiz actions */}
        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={handleRetry}
            className="px-3 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white font-medium text-xs flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Quiz</span>
          </button>
          <button
            type="button"
            onClick={handleGenerateFresh}
            className="px-3 py-1.5 rounded-btn bg-[#1C2128] hover:bg-[#30363D] text-[#E6EDF3] border border-[#30363D] font-medium text-xs flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#58A6FF]" />
            <span>Generate New Questions</span>
          </button>
        </div>
      </div>
    );
  }

  // Active Question View
  const currentQ = questions[currentIndex];

  return (
    <div className="rounded-panel border border-[#30363D] bg-[#161B22] p-5 text-xs space-y-4 select-text">
      {/* Quiz Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#30363D]">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-[#58A6FF]" />
          <h3 className="font-semibold text-sm text-[#E6EDF3]">Test My Understanding</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[#8B949E] font-mono">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B949E] hover:text-[#E6EDF3] text-xs px-2 py-0.5 rounded border border-[#30363D]"
          >
            Close
          </button>
        )}
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[#E6EDF3] leading-relaxed">
          {currentQ.questionTelugu}
        </h4>

        {currentQ.codeSnippet && (
          <div className="p-2.5 rounded bg-[#0D1117] border border-[#30363D] font-mono text-xs text-[#58A6FF]">
            <code>{currentQ.codeSnippet}</code>
          </div>
        )}
      </div>

      {/* Options list */}
      <div className="space-y-2">
        {currentQ.options.map((optionText, optIdx) => {
          const isSelected = selectedOption === optIdx;
          const isCorrectOption = optIdx === currentQ.correctIndex;

          let btnClass = 'bg-[#1C2128] border-[#30363D] text-[#E6EDF3] hover:border-[#58A6FF]';

          if (isSubmitted) {
            if (isCorrectOption) {
              btnClass = 'bg-[#238636]/20 border-[#3FB950] text-[#3FB950] font-medium';
            } else if (isSelected && !isCorrectOption) {
              btnClass = 'bg-[#F85149]/20 border-[#F85149] text-[#F85149]';
            } else {
              btnClass = 'bg-[#161B22] border-[#30363D] text-[#8B949E] opacity-60';
            }
          } else if (isSelected) {
            btnClass = 'bg-[#1C2128] border-[#58A6FF] text-[#58A6FF] ring-1 ring-[#58A6FF]';
          }

          return (
            <button
              key={optIdx}
              type="button"
              disabled={isSubmitted}
              onClick={() => setSelectedOption(optIdx)}
              className={`w-full text-left p-3 rounded border text-xs transition-all flex items-center justify-between ${btnClass}`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="w-5 h-5 rounded-full border border-[#30363D] flex items-center justify-center font-mono text-[11px] shrink-0">
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="font-mono text-xs">{optionText}</span>
              </div>

              {isSubmitted && isCorrectOption && (
                <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
              )}
              {isSubmitted && isSelected && !isCorrectOption && (
                <XCircle className="w-4 h-4 text-[#F85149] shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Card after submission */}
      {isSubmitted && (
        <div
          className={`p-3 rounded border space-y-1.5 ${
            selectedOption === currentQ.correctIndex
              ? 'bg-[#238636]/10 border-[#3FB950]/50 text-[#3FB950]'
              : 'bg-[#F85149]/10 border-[#F85149]/50 text-[#F85149]'
          }`}
        >
          <div className="font-semibold text-xs flex items-center space-x-1.5">
            {selectedOption === currentQ.correctIndex ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sariayina Samadhanam! (Correct)</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Tappina Samadhanam. (Incorrect)</span>
              </>
            )}
          </div>
          <p className="text-[#E6EDF3] leading-relaxed text-xs">
            {currentQ.explanationTelugu}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-end pt-2 border-t border-[#30363D]">
        {!isSubmitted ? (
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleSubmitAnswer}
            className={`px-4 py-2 rounded-btn font-medium text-xs transition-colors ${
              selectedOption === null
                ? 'bg-[#238636]/40 text-white/40 cursor-not-allowed'
                : 'bg-[#238636] hover:bg-[#2EA043] text-white'
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextQuestion}
            className="px-4 py-2 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white font-medium text-xs flex items-center space-x-1.5"
          >
            <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default LearningQuiz;
