import { describe, it, expect, beforeEach } from 'vitest';
import { parseGeminiJson, buildPrompt, explainCodeWithGemini } from '../services/gemini.js';

describe('Gemini Service', () => {
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
  it('builds prompt including original source code', () => {
    const code = 'x = 10\nprint(x)';
    const prompt = buildPrompt(code);
    expect(prompt).toContain('You are a friendly Telugu coding teacher');
    expect(prompt).toContain(code);
  });

  it('parses structured JSON correctly', () => {
    const jsonStr = JSON.stringify({
      steps: [
        {
          title: 'Variable Assignment',
          explanation: 'x అనే variable లో 10 ని store చేస్తున్నాము.',
          codeReference: 'x = 10',
        },
        {
          title: 'Print Statement',
          explanation: 'print function ద్వారా screen పై విలువ చూపిస్తున్నాము.',
          codeReference: 'print(x)',
        },
      ],
    });

    const parsed = parseGeminiJson(jsonStr);
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0].title).toBe('Variable Assignment');
    expect(parsed.steps[0].stepNumber).toBe(1);
    expect(parsed.steps[0].codeReference).toBe('x = 10');
  });

  it('strips markdown ```json ... ``` code fences', () => {
    const fenced = `\`\`\`json
{
  "steps": [
    {
      "title": "Input Statement",
      "explanation": "యూజర్ నుండి ఇన్పుట్ తీసుకుంటున్నాం."
    }
  ]
}
\`\`\``;

    const parsed = parseGeminiJson(fenced);
    expect(parsed.steps).toHaveLength(1);
    expect(parsed.steps[0].title).toBe('Input Statement');
  });

  it('14. handles malformed JSON and returns clear error', () => {
    const malformed = `This is not json at all! { "broken`;
    expect(() => parseGeminiJson(malformed)).toThrow('Could not parse Gemini JSON response');
  });

  it('13. detects missing API configuration and throws NO_API_KEY error', async () => {
    const prevKey = import.meta.env.VITE_GEMINI_API_KEY;
    import.meta.env.VITE_GEMINI_API_KEY = '';
    try {
      await expect(explainCodeWithGemini('print(123)', true)).rejects.toThrow('GEMINI_API_KEY_MISSING');
    } finally {
      import.meta.env.VITE_GEMINI_API_KEY = prevKey;
    }
  });

  it('15. exports valid primary and fallback models for Gemini 3 Flash', async () => {
    const { PRIMARY_MODEL, FALLBACK_MODELS, normalizeModelName } = await import('../services/gemini.js');
    expect(PRIMARY_MODEL).toBeDefined();
    expect(PRIMARY_MODEL).toBe('gemini-3-flash-preview');
    expect(FALLBACK_MODELS).toContain('gemini-3-flash-preview');
    expect(normalizeModelName('gemini-3-flash')).toBe('gemini-3-flash-preview');
  });

  it('16. verifies retry bypassCache ignores cache and attempts fresh request', async () => {
    const { saveExplanationCache } = await import('../utils/storage.js');
    saveExplanationCache('retry_test_code', { steps: [{ stepNumber: 1, title: 'Cached Step' }] });
    const prevKey = import.meta.env.VITE_GEMINI_API_KEY;
    import.meta.env.VITE_GEMINI_API_KEY = '';
    try {
      // Calling explainCodeWithGemini with bypassCache=true forces fresh request, bypassing cache
      await expect(explainCodeWithGemini('retry_test_code', true)).rejects.toThrow();
    } finally {
      import.meta.env.VITE_GEMINI_API_KEY = prevKey;
    }
  });

  it('17. returns cached error explanation without network calls when present', async () => {
    const { explainPythonError } = await import('../services/gemini.js');
    const { saveExplanationCache } = await import('../utils/storage.js');

    const testCode = 'x = 1 / 0';
    const subKey = 'err:ZeroDivisionError:1';
    const mockCached = {
      errorType: 'ZeroDivisionError',
      responsibleLine: 1,
      englishMeaning: 'Cannot divide by zero',
      meaningTelugu: 'Zero tho divide cheyalemu',
    };
    saveExplanationCache(testCode, mockCached, subKey);

    // Even if no API key is present, it returns cached explanation instantly
    const prevKey = import.meta.env.VITE_GEMINI_API_KEY;
    import.meta.env.VITE_GEMINI_API_KEY = '';
    try {
      const res = await explainPythonError(testCode, { errorType: 'ZeroDivisionError', line: 1, message: 'division by zero' });
      expect(res.englishMeaning).toBe('Cannot divide by zero');
      expect(res.meaningTelugu).toBe('Zero tho divide cheyalemu');
    } finally {
      import.meta.env.VITE_GEMINI_API_KEY = prevKey;
    }
  });

  it('18. returns cached AI tutor hint without network calls when present', async () => {
    const { getAiTutorHint } = await import('../services/gemini.js');
    const { saveExplanationCache } = await import('../utils/storage.js');

    const testCode = 'def add(a, b):';
    const subKey = 'hint:1:simple_telugu';
    const mockCached = {
      hintLevel: 1,
      hintText: 'Return keyword use cheyandi',
      encouragement: 'Baaga chestunnaru!',
    };
    saveExplanationCache(testCode, mockCached, subKey);

    const prevKey = import.meta.env.VITE_GEMINI_API_KEY;
    import.meta.env.VITE_GEMINI_API_KEY = '';
    try {
      const res = await getAiTutorHint(testCode, 1, 'simple_telugu');
      expect(res.hintText).toBe('Return keyword use cheyandi');
      expect(res.encouragement).toBe('Baaga chestunnaru!');
    } finally {
      import.meta.env.VITE_GEMINI_API_KEY = prevKey;
    }
  });
});
