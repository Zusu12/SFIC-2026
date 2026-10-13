import { XP_REWARDS, LEVELS, ACHIEVEMENTS } from '../config/gamification.js';

const GAMIFICATION_STORAGE_KEY = 'codetotelugu:gamification:v1';
const CURRENT_SCHEMA_VERSION = 1;

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate the difference in calendar days between two YYYY-MM-DD date strings
 */
export function getDaysDifference(dateStrA, dateStrB) {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc1 - utc2) / msPerDay);
}

/**
 * Calculates current and longest streak from an array of active date strings ['YYYY-MM-DD']
 */
export function calculateStreak(activeDays = [], referenceDate = new Date()) {
  if (!Array.isArray(activeDays) || activeDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Remove duplicates and sort chronologically ascending
  const uniqueSorted = Array.from(new Set(activeDays)).sort();
  if (uniqueSorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longest = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueSorted.length; i++) {
    const diff = getDaysDifference(uniqueSorted[i], uniqueSorted[i - 1]);
    if (diff === 1) {
      currentRun += 1;
      if (currentRun > longest) {
        longest = currentRun;
      }
    } else if (diff > 1) {
      currentRun = 1;
    }
  }

  // Determine if the current streak is active relative to today
  const todayStr = getTodayDateString(referenceDate);
  const latestActiveDay = uniqueSorted[uniqueSorted.length - 1];
  const daysSinceLatest = getDaysDifference(todayStr, latestActiveDay);

  let currentStreak = 0;
  if (daysSinceLatest === 0 || daysSinceLatest === 1) {
    // Streak is active (either practiced today or yesterday)
    let streakCount = 1;
    for (let i = uniqueSorted.length - 1; i > 0; i--) {
      const diff = getDaysDifference(uniqueSorted[i], uniqueSorted[i - 1]);
      if (diff === 1) {
        streakCount++;
      } else {
        break;
      }
    }
    currentStreak = streakCount;
  } else {
    // Streak is broken
    currentStreak = 0;
  }

  if (currentStreak > longest) {
    longest = currentStreak;
  }

  return { currentStreak, longestStreak: longest };
}

/**
 * Determine user's level based on total XP
 */
export function calculateLevel(xp = 0) {
  const safeXp = Math.max(0, Number(xp) || 0);

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (safeXp >= LEVELS[i].minXp) {
      const currentLevelObj = LEVELS[i];
      const nextLevelObj = LEVELS[i + 1] || null;

      const nextTargetXp = nextLevelObj ? nextLevelObj.minXp : currentLevelObj.minXp;
      const xpNeeded = nextLevelObj ? Math.max(0, nextLevelObj.minXp - safeXp) : 0;

      const levelMin = currentLevelObj.minXp;
      const levelSpan = nextLevelObj ? (nextLevelObj.minXp - levelMin) : 100;
      const progressInLevel = nextLevelObj ? (safeXp - levelMin) : levelSpan;
      const progressPercentage = nextLevelObj
        ? Math.min(100, Math.max(0, Math.round((progressInLevel / levelSpan) * 100)))
        : 100;

      return {
        level: currentLevelObj.level,
        title: currentLevelObj.title,
        teluguTitle: currentLevelObj.teluguTitle,
        description: currentLevelObj.description,
        totalXp: safeXp,
        nextTargetXp,
        xpNeeded,
        progressPercentage,
      };
    }
  }

  return {
    level: 1,
    title: LEVELS[0].title,
    teluguTitle: LEVELS[0].teluguTitle,
    description: LEVELS[0].description,
    totalXp: 0,
    nextTargetXp: LEVELS[1].minXp,
    xpNeeded: LEVELS[1].minXp,
    progressPercentage: 0,
  };
}

/**
 * Returns default initial gamification state
 */
export function getDefaultGamificationState() {
  return {
    version: CURRENT_SCHEMA_VERSION,
    totalXp: 0,
    completedActivityIds: [],
    activeDays: [],
    longestStreak: 0,
    activityHistory: [],
    unlockedAchievements: [],
    stats: {
      totalActivities: 0,
      outputQuestionsAnswered: 0,
      bugsFixed: 0,
      challengesCompleted: 0,
    },
  };
}

/**
 * Safely retrieves gamification state from localStorage with migration and corruption recovery
 */
export function getGamificationState() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return getDefaultGamificationState();
    }

    const raw = window.localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) {
      return getDefaultGamificationState();
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return getDefaultGamificationState();
    }

    // Schema migration / fallback
    const state = {
      version: CURRENT_SCHEMA_VERSION,
      totalXp: Number(parsed.totalXp) || 0,
      completedActivityIds: Array.isArray(parsed.completedActivityIds) ? parsed.completedActivityIds : [],
      activeDays: Array.isArray(parsed.activeDays) ? parsed.activeDays : [],
      longestStreak: Number(parsed.longestStreak) || 0,
      activityHistory: Array.isArray(parsed.activityHistory) ? parsed.activityHistory.slice(-50) : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? parsed.unlockedAchievements : [],
      stats: {
        totalActivities: Number(parsed.stats?.totalActivities) || 0,
        outputQuestionsAnswered: Number(parsed.stats?.outputQuestionsAnswered) || 0,
        bugsFixed: Number(parsed.stats?.bugsFixed) || 0,
        challengesCompleted: Number(parsed.stats?.challengesCompleted) || 0,
      },
    };

    return state;
  } catch (err) {
    console.warn('Could not read gamification state, using default:', err);
    return getDefaultGamificationState();
  }
}

/**
 * Saves gamification state to localStorage safely
 */
export function saveGamificationState(state) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save gamification state:', err);
  }
}

/**
 * Checks which achievements should be unlocked given current stats
 */
export function checkAchievementsToUnlock(state) {
  const currentUnlocked = new Set(state.unlockedAchievements || []);
  const newlyUnlocked = [];

  const { stats, activeDays } = state;
  const distinctActiveDaysCount = Array.from(new Set(activeDays || [])).length;

  for (const ach of ACHIEVEMENTS) {
    if (currentUnlocked.has(ach.id)) continue;

    let value = 0;
    if (ach.metric === 'totalActivities') value = stats.totalActivities;
    else if (ach.metric === 'outputQuestionsAnswered') value = stats.outputQuestionsAnswered;
    else if (ach.metric === 'bugsFixed') value = stats.bugsFixed;
    else if (ach.metric === 'distinctActiveDays') value = distinctActiveDaysCount;
    else if (ach.metric === 'challengesCompleted') value = stats.challengesCompleted;

    if (value >= ach.requiredCount) {
      newlyUnlocked.push(ach);
    }
  }

  return newlyUnlocked;
}

/**
 * Award XP for a completed activity, preventing duplicate awards for the same activityId.
 *
 * @param {string} activityType - 'CODING_CHALLENGE' | 'OUTPUT_QUESTION' | 'BUG_FIX' | 'LEARNING_LESSON' | 'DAILY_CHALLENGE'
 * @param {string} activityId - Unique identifier for the specific activity / question
 * @param {string} description - Human-readable reason for the award in Telugu / English
 * @returns {{
 *   success: boolean,
 *   duplicate?: boolean,
 *   xpAwarded: number,
 *   totalXp: number,
 *   levelInfo: Object,
 *   levelUp: { oldLevel: number, newLevel: number, newTitle: string } | null,
 *   newAchievements: Array<Object>,
 *   message?: string
 * }}
 */
export function awardXp(activityType, activityId, description) {
  const xpAmount = XP_REWARDS[activityType] || 0;
  if (xpAmount <= 0) {
    return { success: false, xpAwarded: 0, totalXp: 0, levelInfo: calculateLevel(0), levelUp: null, newAchievements: [] };
  }

  const state = getGamificationState();

  // Prevent duplicate awards for the same completed challenge/activity
  if (activityId && state.completedActivityIds.includes(activityId)) {
    return {
      success: false,
      duplicate: true,
      xpAwarded: 0,
      totalXp: state.totalXp,
      levelInfo: calculateLevel(state.totalXp),
      levelUp: null,
      newAchievements: [],
      message: 'This activity was already completed and awarded earlier.',
    };
  }

  const oldLevelInfo = calculateLevel(state.totalXp);
  const newTotalXp = state.totalXp + xpAmount;
  const newLevelInfo = calculateLevel(newTotalXp);

  const levelUp = newLevelInfo.level > oldLevelInfo.level
    ? { oldLevel: oldLevelInfo.level, newLevel: newLevelInfo.level, newTitle: newLevelInfo.title }
    : null;

  // Track active date for daily streaks
  const todayStr = getTodayDateString();
  const updatedActiveDays = state.activeDays.includes(todayStr)
    ? state.activeDays
    : [...state.activeDays, todayStr];

  const { longestStreak } = calculateStreak(updatedActiveDays);

  // Update activity-specific stats
  const updatedStats = {
    totalActivities: state.stats.totalActivities + 1,
    outputQuestionsAnswered: activityType === 'OUTPUT_QUESTION'
      ? state.stats.outputQuestionsAnswered + 1
      : state.stats.outputQuestionsAnswered,
    bugsFixed: activityType === 'BUG_FIX'
      ? state.stats.bugsFixed + 1
      : state.stats.bugsFixed,
    challengesCompleted: activityType === 'CODING_CHALLENGE' || activityType === 'DAILY_CHALLENGE'
      ? state.stats.challengesCompleted + 1
      : state.stats.challengesCompleted,
  };

  const updatedCompletedIds = activityId
    ? [...state.completedActivityIds, activityId]
    : state.completedActivityIds;

  const activityRecord = {
    id: activityId || `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: activityType,
    xpEarned: xpAmount,
    description: description || `Completed ${activityType}`,
    timestamp: Date.now(),
  };

  const tempState = {
    ...state,
    totalXp: newTotalXp,
    activeDays: updatedActiveDays,
    stats: updatedStats,
    completedActivityIds: updatedCompletedIds,
  };

  const newlyUnlocked = checkAchievementsToUnlock(tempState);
  const updatedUnlockedIds = [
    ...state.unlockedAchievements,
    ...newlyUnlocked.map((a) => a.id),
  ];

  const finalState = {
    ...tempState,
    longestStreak,
    unlockedAchievements: updatedUnlockedIds,
    activityHistory: [activityRecord, ...state.activityHistory].slice(0, 50),
  };

  saveGamificationState(finalState);

  return {
    success: true,
    duplicate: false,
    xpAwarded: xpAmount,
    totalXp: newTotalXp,
    levelInfo: newLevelInfo,
    levelUp,
    newAchievements: newlyUnlocked,
    message: description || `+${xpAmount} XP earned!`,
  };
}

/**
 * Resets gamification state (useful for testing)
 */
export function resetGamificationState() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(GAMIFICATION_STORAGE_KEY);
    }
  } catch (e) {
    // ignore
  }
}
