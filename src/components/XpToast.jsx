import React from 'react';
import { Award, Zap, X, ChevronUp } from 'lucide-react';
import { useGamification } from '../context/GamificationContext.jsx';

export function XpToast() {
  const { toast, dismissToast } = useGamification();

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#161B22] border border-[#30363D] rounded-panel shadow-2xl p-3.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-2.5">
          <div className="p-1.5 rounded bg-[#238636]/20 border border-[#3FB950]/40 text-[#3FB950] shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs text-[#3FB950]">
                +{toast.xpAwarded} XP
              </span>
              {toast.levelUp && (
                <span className="px-1.5 py-0.5 rounded bg-[#1F6FEB]/20 border border-[#58A6FF]/40 text-[#58A6FF] font-semibold text-[10px] flex items-center space-x-1">
                  <ChevronUp className="w-3 h-3" />
                  <span>Level Up! {toast.levelUp.newTitle}</span>
                </span>
              )}
            </div>
            <p className="text-[#E6EDF3] leading-relaxed text-[11px]">
              {toast.message}
            </p>
            {toast.newAchievements && toast.newAchievements.length > 0 && (
              <div className="pt-1 flex items-center space-x-1 text-[11px] text-[#58A6FF]">
                <Award className="w-3 h-3 text-[#58A6FF]" />
                <span>Unlocked: {toast.newAchievements.map((a) => a.title).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismissToast}
          className="text-[#8B949E] hover:text-[#E6EDF3] p-1 rounded hover:bg-[#1C2128]"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default XpToast;
