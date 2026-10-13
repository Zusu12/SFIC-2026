import React, { createContext, useContext, useState } from 'react';
import {
  getGamificationState,
  awardXp as awardXpService,
  calculateLevel,
  calculateStreak,
} from '../services/gamificationService.js';

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [gamificationState, setGamificationState] = useState(() => getGamificationState());
  const [toast, setToast] = useState(null);

  const levelInfo = calculateLevel(gamificationState.totalXp);
  const streakInfo = calculateStreak(gamificationState.activeDays);

  const refreshState = () => {
    setGamificationState(getGamificationState());
  };

  const handleAwardXp = (activityType, activityId, description) => {
    const result = awardXpService(activityType, activityId, description);
    if (result.success) {
      refreshState();
      const toastId = Date.now();
      setToast({
        id: toastId,
        xpAwarded: result.xpAwarded,
        message: result.message,
        levelUp: result.levelUp,
        newAchievements: result.newAchievements,
      });

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToast((current) => (current?.id === toastId ? null : current));
      }, 4000);
    }
    return result;
  };

  const dismissToast = () => {
    setToast(null);
  };

  return (
    <GamificationContext.Provider
      value={{
        gamificationState,
        levelInfo,
        streakInfo,
        awardXp: handleAwardXp,
        toast,
        dismissToast,
        refreshState,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
