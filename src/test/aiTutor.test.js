import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAiTutorHint,
  getAiTutorBugAnalysis,
  getAiTutorCodeImprovement,
  getAiTutorPracticeQuestion,
} from '../services/gemini.js';

describe('AI Coding Companion Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty Code Validation', () => {
    it('throws when code is empty in getAiTutorHint', async () => {
      await expect(getAiTutorHint('', 1)).rejects.toThrow('Please enter code in the editor to receive hints');
    });

    it('throws when code is empty in getAiTutorBugAnalysis', async () => {
      await expect(getAiTutorBugAnalysis('   ')).rejects.toThrow('Please enter code in the editor to analyze bugs');
    });

    it('throws when code is empty in getAiTutorCodeImprovement', async () => {
      await expect(getAiTutorCodeImprovement('')).rejects.toThrow('Please enter code in the editor');
    });

    it('throws when code is empty in getAiTutorPracticeQuestion', async () => {
      await expect(getAiTutorPracticeQuestion('')).rejects.toThrow('Please write code in the editor');
    });
  });

  describe('Missing API Key Validation', () => {
    it('throws a clear error when no key is present', async () => {
      const prevEnv = import.meta.env.VITE_GEMINI_API_KEY;
      import.meta.env.VITE_GEMINI_API_KEY = '';

      try {
        await expect(getAiTutorHint('x = 1', 1)).rejects.toThrow('GEMINI_API_KEY_MISSING');
      } finally {
        import.meta.env.VITE_GEMINI_API_KEY = prevEnv;
      }
    });
  });
});
