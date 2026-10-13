import { GoogleGenAI } from '@google/genai';
import { getActiveApiKey, PRIMARY_MODEL, FALLBACK_MODELS } from './gemini.js';
import { getExplanationCache, saveExplanationCache } from '../utils/storage.js';

/**
 * Validate structured quiz response from Gemini
 */
export function validateQuizResponse(data) {
  if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Response does not contain a valid "questions" array.');
  }

  const sanitized = data.questions.map((q, idx) => {
    if (!q.questionTelugu || !Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${idx + 1} has insufficient options or missing question text.`);
    }

    const correctIdx = typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < q.options.length
      ? q.correctIndex
      : 0;

    return {
      id: idx + 1,
      questionTelugu: String(q.questionTelugu),
      codeSnippet: q.codeSnippet ? String(q.codeSnippet) : null,
      options: q.options.map((opt) => String(opt)),
      correctIndex: correctIdx,
      explanationTelugu: String(q.explanationTelugu || 'Sariayina samadhanam.'),
    };
  });

  return sanitized;
}

/**
 * Generate 2 to 5 code-specific quiz questions using Gemini
 *
 * @param {string} originalCode - Python code
 * @param {boolean} [bypassCache=false]
 * @returns {Promise<Array<{
 *   id: number,
 *   questionTelugu: string,
 *   codeSnippet: string | null,
 *   options: string[],
 *   correctIndex: number,
 *   explanationTelugu: string,
 * }>>}
 */
export async function generateQuizWithGemini(originalCode, bypassCache = false) {
  if (!originalCode || !originalCode.trim()) {
    throw new Error('Cannot generate quiz for empty code.');
  }

  const cacheKey = 'quiz';
  if (!bypassCache) {
    const cached = getExplanationCache(originalCode, undefined, cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  }

  const apiKey = getActiveApiKey();
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY_MISSING');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const prompt = `You are a Telugu programming teacher.
Based STRICTLY on the actual Python code below, generate between 2 to 4 interactive multiple-choice questions to test the student's understanding.

Code:
\`\`\`python
${originalCode}
\`\`\`

Question Types to include based on what is in the code:
- Predict the program output (stdout).
- Determine a variable's value at a certain point.
- Evaluate if a condition will be True or False.
- Count how many times a loop executes.
- Explain the purpose of a specific statement.

Requirements:
1. Write the questions and explanations in conversational Telugu mixed with English programming terms.
2. Provide 3 or 4 options for each question.
3. Keep the correct answers strictly accurate to Python execution.
4. If the code requires user input, state the assumed input in the question.
5. Return JSON in this exact structure:
{
  "questions": [
    {
      "id": 1,
      "questionTelugu": "Ee program run ayinappudu output emi vastundi?",
      "codeSnippet": null,
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": 0,
      "explanationTelugu": "Sariayina vivarana telugu lo..."
    }
  ]
}

Do not include markdown code fences outside the JSON.`;

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

  let lastError = null;
  let responseText = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      });

      responseText = typeof response.text === 'function' ? response.text() : response.text;
      if (responseText) break;
    } catch (err) {
      lastError = err;
      const errMsg = String(err?.message || '');
      const errStatus = err?.status || err?.statusCode || 0;
      if (
        errStatus === 404 ||
        errMsg.includes('not found') ||
        errMsg.includes('NOT_FOUND') ||
        errMsg.includes('no longer available')
      ) {
        continue;
      }
      break;
    }
  }

  if (!responseText) {
    throw lastError || new Error('Failed to generate quiz from Gemini.');
  }

  let cleaned = responseText.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let data;
  try {
    data = JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Model returned malformed JSON for quiz questions.');
  }

  const validQuestions = validateQuizResponse(data);
  saveExplanationCache(originalCode, validQuestions, cacheKey);
  return validQuestions;
}
