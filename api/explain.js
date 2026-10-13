import { GoogleGenAI } from '@google/genai';

/**
 * Serverless API Handler for CodeToTelugu (Vercel / Netlify / Node Functions)
 *
 * Securely calls Google Gemini using server-side secrets without exposing
 * API keys to client browsers.
 *
 * Environment variable required on server:
 * GEMINI_API_KEY=your_secret_gemini_api_key
 */

function normalizeModelName(name) {
  if (!name || typeof name !== 'string') return 'gemini-3-flash-preview';
  const trimmed = name.trim();
  if (trimmed === 'gemini-3-flash' || trimmed === 'gemini-3-flash-api') {
    return 'gemini-3-flash-preview';
  }
  return trimmed;
}

const MAX_CODE_BYTES = 10000;
const PRIMARY_MODEL = normalizeModelName(process.env.GEMINI_MODEL || 'gemini-3-flash-preview');
const FALLBACK_MODELS = ['gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-flash-latest'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { code } = req.body || {};

  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Missing or empty "code" in request body.' });
  }

  if (Buffer.byteLength(code, 'utf8') > MAX_CODE_BYTES) {
    return res.status(413).json({ error: 'Code exceeds maximum size limit of 10KB.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfiguration: GEMINI_API_KEY is not configured on the server.',
    });
  }

  const prompt = `You are a friendly Telugu coding teacher teaching a complete programming beginner. Explain the following Python code step by step in simple, conversational Telugu. Mix Telugu with familiar English technical terms naturally. Make the explanation beginner-friendly and practical. Explain what each important statement does, how the program flows, what the input and output mean, and why conditions or loops are used. Use numbered steps and short bullet points. Do not invent program behavior. If the code contains a bug, explain it clearly. If the code is incomplete, explain the limitation. Do not execute the code. Return valid JSON containing an array named steps. Each step must contain title, explanation, and optional codeReference. Code to explain:
${code}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];

    let responseText = null;
    let successfulModel = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            maxOutputTokens: 1200,
          },
        });

        const text = typeof response.text === 'function' ? response.text() : response.text;
        if (text) {
          responseText = text;
          successfulModel = model;
          break;
        }
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.statusCode || 0;
        const msg = String(err?.message || '');
        if (
          status === 404 ||
          msg.includes('not found') ||
          msg.includes('is not supported for generateContent') ||
          msg.includes('no longer available')
        ) {
          continue;
        }
        break;
      }
    }

    if (!responseText) {
      throw lastError || new Error('No response from Gemini models');
    }

    // Clean JSON fences if present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleaned);

    return res.status(200).json({
      steps: parsed.steps,
      modelUsed: successfulModel,
    });
  } catch (error) {
    console.error('Server Gemini Error:', error?.message);
    const status = error?.status === 429 ? 429 : 500;
    return res.status(status).json({
      error: error?.message || 'Failed to generate explanation from Gemini.',
    });
  }
}
