import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLevel,
  calculateStreak,
  getDaysDifference,
  awardXp,
  getGamificationState,
  resetGamificationState,
} from '../services/gamificationService.js';
import { XP_REWARDS, LEVELS } from '../config/gamification.js';

describe('Gamification Service', () => {
  let mockStore = {};

  beforeEach(() => {
    mockStore = {};
    global.window = {
      localStorage: {
        getItem: (k) => mockStore[k] || null,
        setItem: (k, v) => { mockStore[k] = String(v); },
        removeItem: (k) => { delete mockStore[k]; },
        clear: () => { mockStore = {}; },
      },
    };
  });

  describe('XP and Level calculations', () => {
    it('accurately identifies Level 1 for 0 XP', () => {
      const lvl = calculateLevel(0);
      expect(lvl.level).toBe(1);
      expect(lvl.title).toBe('Python Beginner');
      expect(lvl.nextTargetXp).toBe(50);
      expect(lvl.xpNeeded).toBe(50);
    });

    it('levels up accurately across XP thresholds', () => {
      expect(calculateLevel(50).level).toBe(2);
      expect(calculateLevel(120).level).toBe(3);
      expect(calculateLevel(220).level).toBe(4);
      expect(calculateLevel(350).level).toBe(5);
      expect(calculateLevel(520).level).toBe(6);
      expect(calculateLevel(750).level).toBe(7);
      expect(calculateLevel(1000).level).toBe(7);
    });

    it('calculates progress percentage within current level', () => {
      // Level 1 spans 0 to 50 XP
      const lvl = calculateLevel(25);
      expect(lvl.progressPercentage).toBe(50);
    });
  });

  describe('Streak calculations', () => {
    it('handles consecutive days across month transitions', () => {
      expect(getDaysDifference('2026-03-01', '2026-02-28')).toBe(1);
    });

    it('handles consecutive days across year transitions', () => {
      expect(getDaysDifference('2026-01-01', '2025-12-31')).toBe(1);
    });

    it('calculates streaks correctly without counting same day multiple times', () => {
      const days = ['2026-10-10', '2026-10-10', '2026-10-11', '2026-10-12'];
      const refDate = new Date('2026-10-12T12:00:00Z');
      const streak = calculateStreak(days, refDate);
      expect(streak.currentStreak).toBe(3);
      expect(streak.longestStreak).toBe(3);
    });

    it('identifies broken streak when missed day occurs', () => {
      const days = ['2026-10-01', '2026-10-02', '2026-10-08'];
      const refDate = new Date('2026-10-08T12:00:00Z');
      const streak = calculateStreak(days, refDate);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(2);
    });
  });

  describe('awardXp and duplicate prevention', () => {
    it('awards correct XP for different learning activities', () => {
      const res1 = awardXp('OUTPUT_QUESTION', 'q-101', 'Answered code output correctly');
      expect(res1.success).toBe(true);
      expect(res1.xpAwarded).toBe(10);
      expect(res1.totalXp).toBe(10);

      const res2 = awardXp('CODING_CHALLENGE', 'c-201', 'Completed loop challenge');
      expect(res2.success).toBe(true);
      expect(res2.xpAwarded).toBe(20);
      expect(res2.totalXp).toBe(30);

      const res3 = awardXp('BUG_FIX', 'b-301', 'Fixed indexing bug');
      expect(res3.success).toBe(true);
      expect(res3.xpAwarded).toBe(25);
      expect(res3.totalXp).toBe(55);
      expect(res3.levelUp).toBeTruthy(); // 55 >= 50, leveled up to Level 2
      expect(res3.levelUp.newLevel).toBe(2);
    });

    it('strictly prevents duplicate rewards for the same completed activity ID', () => {
      const first = awardXp('CODING_CHALLENGE', 'challenge-unique-id', 'First submission');
      expect(first.success).toBe(true);
      expect(first.xpAwarded).toBe(20);

      // Repeat submission with same ID
      const second = awardXp('CODING_CHALLENGE', 'challenge-unique-id', 'Second submission');
      expect(second.success).toBe(false);
      expect(second.duplicate).toBe(true);
      expect(second.xpAwarded).toBe(0);

      const state = getGamificationState();
      expect(state.totalXp).toBe(20); // Not 40!
    });

    it('unlocks achievements when criteria are satisfied', () => {
      const firstAction = awardXp('LEARNING_LESSON', 'lesson-1', 'Lesson completed');
      expect(firstAction.newAchievements.some((a) => a.id === 'first_steps')).toBe(true);

      // Answer 5 output questions
      for (let i = 1; i <= 5; i++) {
        awardXp('OUTPUT_QUESTION', `out-q-${i}`, `Question ${i}`);
      }

      const state = getGamificationState();
      expect(state.unlockedAchievements).toContain('output_master');
    });

    it('recovers gracefully from corrupted storage', () => {
      mockStore['codetotelugu:gamification:v1'] = 'INVALID JSON}{';
      const state = getGamificationState();
      expect(state.totalXp).toBe(0);
      expect(state.completedActivityIds).toEqual([]);
    });
  });
});
