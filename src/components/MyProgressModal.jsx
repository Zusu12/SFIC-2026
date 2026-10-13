import React, { useMemo } from 'react';
import {
  X,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Terminal,
  Bug,
  Trophy,
  Footprints
} from 'lucide-react';
import { useGamification } from '../context/GamificationContext.jsx';
import { ACHIEVEMENTS } from '../config/gamification.js';

const ICON_MAP = {
  Footprints: Footprints,
  Terminal: Terminal,
  Bug: Bug,
  Calendar: Calendar,
  Trophy: Trophy,
};

export function MyProgressModal({ isOpen, onClose }) {
  const { gamificationState, levelInfo, streakInfo } = useGamification();

  const { totalXp = 0, activeDays = [], activityHistory = [], unlockedAchievements = [], stats = {} } = gamificationState || {};
  const { currentStreak = 0, longestStreak = 0 } = streakInfo || {};

  const isTodayActive = useMemo(() => {
    if (!activeDays) return false;
    const today = new Date().toISOString().slice(0, 10);
    return activeDays.includes(today);
  }, [activeDays]);

  if (!isOpen) return null;

  const getMetricCount = (metric) => {
    if (metric === 'totalActivities') return stats.totalActivities;
    if (metric === 'outputQuestionsAnswered') return stats.outputQuestionsAnswered;
    if (metric === 'bugsFixed') return stats.bugsFixed;
    if (metric === 'distinctActiveDays') return Array.from(new Set(activeDays)).length;
    if (metric === 'challengesCompleted') return stats.challengesCompleted;
    return 0;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-[#161B22] border border-[#30363D] rounded-panel shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150 text-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D] bg-[#161B22]">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#58A6FF]" />
            <h2 id="progress-modal-title" className="text-sm font-semibold text-[#E6EDF3]">
              My Progress / Naa Pragathi
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#1C2128] border border-[#30363D] text-[#8B949E] font-mono">
              Level {levelInfo.level}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Level & XP Hero Card */}
          <div className="p-4 rounded-md bg-[#0D1117] border border-[#30363D] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[10px] text-[#8B949E] uppercase tracking-wider font-semibold">
                  Current Level:
                </div>
                <div className="text-base font-bold text-[#E6EDF3] flex items-center space-x-2">
                  <span>Level {levelInfo.level} — {levelInfo.title}</span>
                  <span className="text-xs text-[#58A6FF] font-normal">({levelInfo.teluguTitle})</span>
                </div>
                <p className="text-[11px] text-[#8B949E] mt-0.5">
                  {levelInfo.description}
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-center">
                <div className="p-2 rounded bg-[#1C2128] border border-[#30363D] text-right font-mono">
                  <div className="text-[10px] text-[#8B949E]">Total XP</div>
                  <div className="text-sm font-bold text-[#3FB950] flex items-center justify-end space-x-1">
                    <Zap className="w-3.5 h-3.5 text-[#3FB950]" />
                    <span>{totalXp} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
                <span>Progress to Level {Math.min(7, levelInfo.level + 1)}</span>
                <span>
                  {levelInfo.level < 7
                    ? `${levelInfo.xpNeeded} XP needed for next level`
                    : 'Max level achieved!'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#1C2128] overflow-hidden border border-[#30363D]">
                <div
                  className="h-full bg-[#238636] transition-all duration-300 rounded-full"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Streaks Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-[#0D1117] border border-[#30363D] flex items-center space-x-3">
              <div className="p-2 rounded bg-[#1C2128] border border-[#30363D] text-[#F85149]">
                <Flame className="w-5 h-5 text-[#F85149]" />
              </div>
              <div>
                <div className="text-[10px] text-[#8B949E] uppercase font-semibold">Current Streak</div>
                <div className="text-sm font-mono font-bold text-[#E6EDF3]">
                  {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
                </div>
                <div className="text-[11px] text-[#8B949E]">
                  {isTodayActive
                    ? 'Practiced today! Streak is active.'
                    : 'Practise today to keep your streak alive!'}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#0D1117] border border-[#30363D] flex items-center space-x-3">
              <div className="p-2 rounded bg-[#1C2128] border border-[#30363D] text-[#58A6FF]">
                <Trophy className="w-5 h-5 text-[#58A6FF]" />
              </div>
              <div>
                <div className="text-[10px] text-[#8B949E] uppercase font-semibold">Longest Streak</div>
                <div className="text-sm font-mono font-bold text-[#E6EDF3]">
                  {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                </div>
                <div className="text-[11px] text-[#8B949E]">
                  Personal best daily learning record.
                </div>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-[#E6EDF3] uppercase tracking-wider">
                Achievements ({unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.id);
                const currentCount = getMetricCount(ach.metric);
                const IconComponent = ICON_MAP[ach.icon] || Award;

                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded border transition-colors ${
                      isUnlocked
                        ? 'bg-[#161B22] border-[#3FB950]/50'
                        : 'bg-[#0D1117] border-[#30363D] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2.5">
                        <div
                          className={`p-1.5 rounded border ${
                            isUnlocked
                              ? 'bg-[#238636]/20 border-[#3FB950]/40 text-[#3FB950]'
                              : 'bg-[#1C2128] border-[#30363D] text-[#8B949E]'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[#E6EDF3] flex items-center space-x-1.5">
                            <span>{ach.title}</span>
                            <span className="text-[10px] text-[#8B949E] font-normal">
                              ({ach.teluguTitle})
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8B949E] mt-0.5 leading-relaxed">
                            {ach.description}
                          </p>
                        </div>
                      </div>

                      {isUnlocked ? (
                        <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0 ml-1" />
                      ) : (
                        <span className="text-[10px] font-mono text-[#8B949E] bg-[#1C2128] px-1.5 py-0.5 rounded border border-[#30363D] shrink-0 ml-1">
                          {Math.min(ach.requiredCount, currentCount)}/{ach.requiredCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-[#E6EDF3] uppercase tracking-wider">
              Recent Learning Activity
            </h3>
            {activityHistory.length === 0 ? (
              <div className="p-4 rounded bg-[#0D1117] border border-[#30363D] text-center text-[#8B949E]">
                No learning activities completed yet. Solve code questions or trace code to earn XP!
              </div>
            ) : (
              <div className="divide-y divide-[#30363D] rounded border border-[#30363D] bg-[#0D1117] max-h-44 overflow-y-auto">
                {activityHistory.slice(0, 10).map((act, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3.5 h-3.5 text-[#3FB950] shrink-0" />
                      <span className="text-[#E6EDF3]">{act.description}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[#8B949E] font-mono shrink-0">
                      <span className="text-[#3FB950] font-semibold">+{act.xpEarned} XP</span>
                      <span>•</span>
                      <span>{formatDate(act.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#30363D] bg-[#161B22] flex items-center justify-between">
          <span className="text-[11px] text-[#8B949E]">
            Practise Python consistently to level up to Telugu Coding Pro.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-btn bg-[#238636] hover:bg-[#2EA043] text-white font-medium text-xs flex items-center space-x-1.5"
          >
            <span>Continue Learning</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyProgressModal;
