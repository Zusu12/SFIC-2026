import { getCodeHash } from './codeHash.js';

const REQUEST_PREFIX = 'codetotelugu:request:';
const CACHE_PREFIX = 'codetotelugu:cache:';
const USER_API_KEY_STORAGE = 'codetotelugu:user_gemini_key';
const SAVED_PROGRAMS_KEY = 'codetotelugu:programs:history';
const MAX_SAVED_PROGRAMS = 50;

/**
 * Generate a unique random alphanumeric ID for requests
 */
export function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Save a translation request to localStorage
 *
 * @param {string} code - Original Python code
 * @param {string} language - Target language (defaults to 'telugu')
 * @returns {{ success: boolean, id?: string, error?: string }}
 */
export function saveTranslationRequest(code, language = 'telugu') {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { success: false, error: 'Code cannot be empty' };
  }

  const id = generateRequestId();
  const key = `${REQUEST_PREFIX}${id}`;
  const payload = {
    id,
    code,
    language,
    timestamp: Date.now(),
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'localStorage is not available in this environment' };
    }

    if (window.localStorage.getItem(key)) {
      return { success: false, error: 'Duplicate request ID collision' };
    }

    window.localStorage.setItem(key, JSON.stringify(payload));
    return { success: true, id };
  } catch (err) {
    console.error('Failed to save translation request to localStorage:', err);
    return {
      success: false,
      error: err.name === 'QuotaExceededError'
        ? 'Storage quota exceeded. Please clear old browser data.'
        : 'Failed to access browser storage (check privacy settings).',
    };
  }
}

/**
 * Retrieve a translation request by ID
 *
 * @param {string} id - Request ID
 * @param {number} [maxAgeMs=86400000] - Expiration time in ms (default 24 hours)
 * @returns {{ success: boolean, data?: { id: string, code: string, language: string, timestamp: number }, error?: string }}
 */
export function getTranslationRequest(id, maxAgeMs = 24 * 60 * 60 * 1000) {
  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Invalid or missing request ID' };
  }

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'localStorage is not available' };
    }

    const key = `${REQUEST_PREFIX}${id}`;
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return { success: false, error: 'Request not found or has expired' };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.code) {
      return { success: false, error: 'Invalid request data' };
    }

    // Check age
    if (parsed.timestamp && Date.now() - parsed.timestamp > maxAgeMs) {
      window.localStorage.removeItem(key);
      return { success: false, error: 'Translation request has expired (older than 24 hours)' };
    }

    return { success: true, data: parsed };
  } catch (err) {
    console.error('Failed to read request from localStorage:', err);
    return { success: false, error: 'Failed to parse stored request data' };
  }
}

/**
 * Save explanation response to cache with optional subKey (for modes, lines, errors)
 */
export function saveExplanationCache(code, explanationData, subKey = '') {
  if (!code || !explanationData) return;
  const hash = getCodeHash(code);
  const key = subKey ? `${CACHE_PREFIX}${hash}:${subKey}` : `${CACHE_PREFIX}${hash}`;

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const payload = {
        hash,
        subKey,
        explanation: explanationData,
        timestamp: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (err) {
    console.warn('Could not cache explanation:', err);
  }
}

/**
 * Retrieve cached explanation by code hash and optional subKey
 */
export function getExplanationCache(code, maxAgeMs = 7 * 24 * 60 * 60 * 1000, subKey = '') {
  if (!code) return null;
  const hash = getCodeHash(code);
  const key = subKey ? `${CACHE_PREFIX}${hash}:${subKey}` : `${CACHE_PREFIX}${hash}`;

  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed && parsed.explanation && (!parsed.timestamp || Date.now() - parsed.timestamp < maxAgeMs)) {
      return parsed.explanation;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Get user-supplied Gemini API key from localStorage or sessionStorage
 */
export function getUserApiKey() {
  try {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(USER_API_KEY_STORAGE) ||
           window.sessionStorage?.getItem(USER_API_KEY_STORAGE) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Save user-supplied Gemini API key
 */
export function setUserApiKey(key, persistInLocalStorage = false) {
  try {
    if (typeof window === 'undefined') return;
    if (!key) {
      window.localStorage.removeItem(USER_API_KEY_STORAGE);
      window.sessionStorage?.removeItem(USER_API_KEY_STORAGE);
      return;
    }
    if (persistInLocalStorage) {
      window.localStorage.setItem(USER_API_KEY_STORAGE, key.trim());
    } else {
      window.sessionStorage?.setItem(USER_API_KEY_STORAGE, key.trim());
    }
  } catch (e) {
    console.warn('Failed to save API key:', e);
  }
}

/* =========================================================================
   FEATURE EIGHT: SAVED PROGRAMS & HISTORY
   ========================================================================= */

/**
 * Retrieve all saved programs from local storage
 * @returns {Array<Object>} Sorted list of saved programs (newest updated first)
 */
export function getSavedPrograms() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(SAVED_PROGRAMS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (e) {
    console.warn('Failed to read saved programs:', e);
    return [];
  }
}

/**
 * Save or update a program in history
 *
 * @param {Object} program
 * @param {string} [program.id]
 * @param {string} program.name
 * @param {string} program.code
 * @param {string} [program.language='telugu']
 * @param {string} [program.translatedCode]
 * @param {string} [program.explanationMode='detailed']
 * @param {Object} [program.explanationData]
 * @returns {{ success: boolean, program?: Object, error?: string }}
 */
export function saveProgram({
  id,
  name,
  code,
  language = 'telugu',
  translatedCode = '',
  explanationMode = 'detailed',
  explanationData = null,
}) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { success: false, error: 'Program code cannot be empty.' };
  }

  const trimmedName = (name && typeof name === 'string' && name.trim())
    ? name.trim()
    : `Program ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'localStorage is not available.' };
    }

    const currentList = getSavedPrograms();
    const now = Date.now();
    const targetId = id || generateRequestId();

    const existingIndex = currentList.findIndex((p) => p.id === targetId);

    const programRecord = {
      id: targetId,
      name: trimmedName,
      code,
      language,
      translatedCode,
      explanationMode,
      explanationData,
      createdAt: existingIndex !== -1 ? currentList[existingIndex].createdAt : now,
      updatedAt: now,
    };

    let updatedList;
    if (existingIndex !== -1) {
      updatedList = [...currentList];
      updatedList[existingIndex] = programRecord;
    } else {
      updatedList = [programRecord, ...currentList];
    }

    // Limit stored programs to MAX_SAVED_PROGRAMS to prevent storage bloat
    if (updatedList.length > MAX_SAVED_PROGRAMS) {
      updatedList = updatedList.slice(0, MAX_SAVED_PROGRAMS);
    }

    window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(updatedList));
    return { success: true, program: programRecord };
  } catch (err) {
    console.error('Failed to save program to history:', err);
    return {
      success: false,
      error: err.name === 'QuotaExceededError'
        ? 'Storage quota exceeded. Delete older programs.'
        : 'Failed to access browser storage.',
    };
  }
}

/**
 * Rename an existing saved program
 *
 * @param {string} id
 * @param {string} newName
 * @returns {boolean}
 */
export function renameSavedProgram(id, newName) {
  if (!id || !newName || !newName.trim()) return false;
  try {
    const list = getSavedPrograms();
    const item = list.find((p) => p.id === id);
    if (!item) return false;
    item.name = newName.trim();
    item.updatedAt = Date.now();
    window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Delete a program from history
 *
 * @param {string} id
 * @returns {boolean}
 */
export function deleteSavedProgram(id) {
  if (!id) return false;
  try {
    const list = getSavedPrograms();
    const filtered = list.filter((p) => p.id !== id);
    window.localStorage.setItem(SAVED_PROGRAMS_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Clear all saved programs from history
 * @returns {boolean}
 */
export function clearProgramHistory() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.removeItem(SAVED_PROGRAMS_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
