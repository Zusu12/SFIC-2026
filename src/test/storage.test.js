import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTranslationRequest,
  getTranslationRequest,
  saveExplanationCache,
  getExplanationCache,
  generateRequestId,
  getSavedPrograms,
  saveProgram,
  deleteSavedProgram,
  renameSavedProgram,
  clearProgramHistory,
} from '../utils/storage.js';

describe('Storage Utility', () => {
  // In-memory localStorage mock for node environment
  let store = {};
  beforeEach(() => {
    store = {};
    global.window = {
      localStorage: {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
      },
    };
  });

  it('generates unique random request IDs', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
  });

  it('saves and retrieves translation requests by ID', () => {
    const code = 'print("hello")';
    const saveRes = saveTranslationRequest(code, 'telugu');
    expect(saveRes.success).toBe(true);
    expect(saveRes.id).toBeDefined();

    const fetchRes = getTranslationRequest(saveRes.id);
    expect(fetchRes.success).toBe(true);
    expect(fetchRes.data.code).toBe(code);
    expect(fetchRes.data.language).toBe('telugu');
  });

  it('12. ensures multiple translation requests do not overwrite each other', () => {
    const codeA = 'x = 1\nprint(x)';
    const codeB = 'y = 2\nprint(y)';

    const resA = saveTranslationRequest(codeA);
    const resB = saveTranslationRequest(codeB);

    expect(resA.id).not.toBe(resB.id);

    const fetchedA = getTranslationRequest(resA.id);
    const fetchedB = getTranslationRequest(resB.id);

    expect(fetchedA.data.code).toBe(codeA);
    expect(fetchedB.data.code).toBe(codeB);
  });

  it('13. handles missing or expired storage data gracefully', () => {
    const missing = getTranslationRequest('non-existent-id');
    expect(missing.success).toBe(false);
    expect(missing.error).toContain('not found');

    const empty = getTranslationRequest('');
    expect(empty.success).toBe(false);
  });

  it('prevents saving empty code', () => {
    const res = saveTranslationRequest('   ');
    expect(res.success).toBe(false);
    expect(res.error).toContain('empty');
  });

  it('saves and retrieves explanations from cache with optional subKeys', () => {
    const code = 'total = sum([1, 2, 3])';
    const explanation = { steps: [{ stepNumber: 1, title: 'Sum', explanation: 'Adds numbers' }] };

    saveExplanationCache(code, explanation);
    const cached = getExplanationCache(code);
    expect(cached).toEqual(explanation);

    // Subkey caching
    const interviewExp = { steps: [{ stepNumber: 1, title: 'Interview', explanation: 'Complexity O(N)' }] };
    saveExplanationCache(code, interviewExp, 'interview');

    expect(getExplanationCache(code, undefined, 'interview')).toEqual(interviewExp);
    expect(getExplanationCache(code)).toEqual(explanation); // Main cache untouched
  });

  it('saves, renames, and deletes programs in program history', () => {
    expect(getSavedPrograms()).toEqual([]);

    const saveResult = saveProgram({
      name: 'Loop Example',
      code: 'for i in range(3): print(i)',
      language: 'telugu',
      explanationMode: 'simple',
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.program.name).toBe('Loop Example');
    expect(getSavedPrograms().length).toBe(1);

    // Rename
    const renameOk = renameSavedProgram(saveResult.program.id, 'Updated Loop');
    expect(renameOk).toBe(true);
    expect(getSavedPrograms()[0].name).toBe('Updated Loop');

    // Delete
    const delOk = deleteSavedProgram(saveResult.program.id);
    expect(delOk).toBe(true);
    expect(getSavedPrograms().length).toBe(0);

    // Clear history
    saveProgram({ name: 'Prog 1', code: 'x = 1' });
    saveProgram({ name: 'Prog 2', code: 'x = 2' });
    expect(getSavedPrograms().length).toBe(2);
    clearProgramHistory();
    expect(getSavedPrograms().length).toBe(0);
  });
});
