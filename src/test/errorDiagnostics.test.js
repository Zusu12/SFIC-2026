import { describe, it, expect } from 'vitest';
import { analyzePythonCode } from '../services/pythonDiagnostics.js';

describe('Python Diagnostic & Error Engine Tests', () => {
  describe('Case 1: Syntax Error (Missing Parenthesis)', () => {
    it('correctly detects unclosed parenthesis on print statement', () => {
      const code = 'print("Hello"';
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorCategory).toBe('Syntax Error');
      expect(result.errorType).toBe('SyntaxError');
      expect(result.message).toContain("'(' was never closed");
      expect(result.line).toBe(1);
      expect(result.sourceLine).toBe('print("Hello"');

      // Verifies both English and Romanized Telugu explanations
      expect(result.englishExplanation.meaning).toBeTruthy();
      expect(result.teluguExplanation.meaning).toBeTruthy();
      expect(result.teluguExplanation.meaning).toContain('SyntaxError');

      // Suggested correction should close the parenthesis
      expect(result.suggestedCorrection).toBe('print("Hello")');
      expect(result.whatChanged).toContain('closing parenthesis');
    });
  });

  describe('Case 2: Indentation Error (Missing Indented Block)', () => {
    it('correctly detects missing indentation after if statement', () => {
      const code = `if True:
print("Hello")`;
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorCategory).toBe('Syntax Error');
      expect(result.errorType).toBe('IndentationError');
      expect(result.message).toContain("expected an indented block after 'if' statement on line 1");
      expect(result.line).toBe(2);

      // Verifies explanations in both languages
      expect(result.englishExplanation.fix).toContain('4 spaces');
      expect(result.teluguExplanation.fix).toContain('4 spaces');

      // Suggested correction should indent the statement
      expect(result.suggestedCorrection).toContain('    print("Hello")');
    });
  });

  describe('Case 3: Undefined Variable (NameError)', () => {
    it('correctly detects undefined variable referenced in expression', () => {
      const code = 'print(user_name)';
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorCategory).toBe('Runtime Error');
      expect(result.errorType).toBe('NameError');
      expect(result.message).toBe("NameError: name 'user_name' is not defined");
      expect(result.line).toBe(1);
      expect(result.sourceLine).toBe('print(user_name)');

      // Verifies explanations in both languages
      expect(result.englishExplanation.meaning).toBeTruthy();
      expect(result.teluguExplanation.meaning).toContain('NameError');
      expect(result.suggestedCorrection).toContain('user_name');
    });
  });

  describe('Case 4: Runtime Error (ZeroDivisionError)', () => {
    it('correctly detects division by zero', () => {
      const code = `x = 10 / 0
print(x)`;
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorCategory).toBe('Runtime Error');
      expect(result.errorType).toBe('ZeroDivisionError');
      expect(result.message).toBe('ZeroDivisionError: division by zero');
      expect(result.line).toBe(1);
      expect(result.sourceLine).toBe('x = 10 / 0');

      // Verifies explanations in both languages
      expect(result.englishExplanation.meaning).toContain('division by zero');
      expect(result.teluguExplanation.meaning).toContain('zero (0)');
    });
  });

  describe('Case 5: Valid Python Code (No False Positives)', () => {
    it('correctly validates starter code with conditionals and input/print without reporting any errors', () => {
      const code = `name = input("Enter your name: ")

if name:
    print("Hello", name)
else:
    print("No name entered")`;

      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(false);
      expect(result.errorCategory).toBe('No Error Detected');
      expect(result.errorType).toBe('None');
      expect(result.message).toContain('No Python error detected');
      expect(result.line).toBeNull();
      expect(result.suggestedCorrection).toBe(code);
      expect(result.whatChanged).toContain('No changes needed');
    });
  });

  describe('Additional Diagnostic Edge Cases', () => {
    it('detects missing colons on header statements', () => {
      const code = `if x == 5
    print(x)`;
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorType).toBe('SyntaxError');
      expect(result.message).toContain("expected ':' after 'if'");
      expect(result.line).toBe(1);
    });

    it('detects JavaScript operator leak (&& instead of and)', () => {
      const code = 'if a > 0 && b > 0:\n    print("ok")';
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorType).toBe('SyntaxError');
      expect(result.message).toContain("invalid syntax '&&'");
      expect(result.suggestedCorrection).toContain('and');
    });

    it('detects type error with invalid string/int addition', () => {
      const code = 'total = "Items: " + 5';
      const result = analyzePythonCode(code);

      expect(result.hasError).toBe(true);
      expect(result.errorType).toBe('TypeError');
      expect(result.message).toContain('can only concatenate str (not "int") to str');
    });
  });
});
