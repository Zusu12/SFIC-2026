import { describe, it, expect } from 'vitest';
import { validateQuizResponse } from '../services/quizService.js';

describe('Quiz Service & Validation', () => {
  it('validates and sanitizes structured quiz responses', () => {
    const rawData = {
      questions: [
        {
          id: 1,
          questionTelugu: 'Ee program output emi vastundi?',
          codeSnippet: 'print(5 + 5)',
          options: ['5', '10', '15', 'None'],
          correctIndex: 1,
          explanationTelugu: '5 + 5 calculate ayyi 10 print avuthundi.',
        },
        {
          id: 2,
          questionTelugu: 'Total variable lo final ga value entha?',
          codeSnippet: null,
          options: ['0', '6', '3'],
          correctIndex: 1,
          explanationTelugu: 'Loop 3 times run ayyi total 6 avuthundi.',
        },
      ],
    };

    const validated = validateQuizResponse(rawData);
    expect(validated).toHaveLength(2);
    expect(validated[0].questionTelugu).toBe('Ee program output emi vastundi?');
    expect(validated[0].options).toHaveLength(4);
    expect(validated[0].correctIndex).toBe(1);
    expect(validated[1].options).toHaveLength(3);
  });

  it('rejects responses missing the questions array', () => {
    expect(() => validateQuizResponse({})).toThrow('valid "questions" array');
    expect(() => validateQuizResponse(null)).toThrow('valid "questions" array');
    expect(() => validateQuizResponse({ questions: [] })).toThrow('valid "questions" array');
  });

  it('rejects questions with fewer than 2 options', () => {
    const invalid = {
      questions: [
        {
          id: 1,
          questionTelugu: 'What is x?',
          options: ['Only one option'],
          correctIndex: 0,
        },
      ],
    };
    expect(() => validateQuizResponse(invalid)).toThrow('insufficient options');
  });

  it('safely clamps out-of-range correctIndex to 0', () => {
    const raw = {
      questions: [
        {
          id: 1,
          questionTelugu: 'Question?',
          options: ['A', 'B'],
          correctIndex: 99,
        },
      ],
    };
    const validated = validateQuizResponse(raw);
    expect(validated[0].correctIndex).toBe(0);
  });
});
