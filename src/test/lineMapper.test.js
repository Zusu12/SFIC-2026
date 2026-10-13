import { describe, it, expect } from 'vitest';
import {
  splitLines,
  mapSourceLineToTranslated,
  mapTranslatedLineToSource,
  getLineDetails,
  getDeterministicLineExplanation
} from '../utils/lineMapper.js';

describe('lineMapper utility', () => {
  const sourceCode = `name = input("Enter name: ")
if name:
    print("Hello", name)
else:
    print("No name")`;

  const translatedCode = `name = adugu("Enter name: ")
oka vela name:
    chupinchu("Hello", name)
lekapothe:
    chupinchu("No name")`;

  it('splits lines correctly across Unix and Windows newlines', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
    expect(splitLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
    expect(splitLines('')).toEqual(['']);
  });

  it('maps valid line numbers 1:1 between source and translated code', () => {
    expect(mapSourceLineToTranslated(1, sourceCode, translatedCode)).toBe(1);
    expect(mapSourceLineToTranslated(3, sourceCode, translatedCode)).toBe(3);
    expect(mapTranslatedLineToSource(2, sourceCode, translatedCode)).toBe(2);
  });

  it('clamps safely for out-of-bounds line numbers', () => {
    expect(mapSourceLineToTranslated(0, sourceCode, translatedCode)).toBe(1);
    expect(mapSourceLineToTranslated(-5, sourceCode, translatedCode)).toBe(1);
    expect(mapSourceLineToTranslated(999, sourceCode, translatedCode)).toBe(5);

    expect(mapTranslatedLineToSource(0, sourceCode, translatedCode)).toBe(1);
    expect(mapTranslatedLineToSource(999, sourceCode, translatedCode)).toBe(5);
  });

  it('retrieves detailed line info including empty lines and comments', () => {
    const codeWithComment = `x = 10\n# check x\n\nprint(x)`;
    const trans = `x = 10\n# check x\n\nchupinchu(x)`;

    const line1 = getLineDetails(codeWithComment, trans, 1);
    expect(line1.sourceText).toBe('x = 10');
    expect(line1.isEmpty).toBe(false);
    expect(line1.variables).toContain('x');

    const line2 = getLineDetails(codeWithComment, trans, 2);
    expect(line2.isComment).toBe(true);

    const line3 = getLineDetails(codeWithComment, trans, 3);
    expect(line3.isEmpty).toBe(true);
  });

  it('generates accurate deterministic explanations for common Python constructs', () => {
    const ifExp = getDeterministicLineExplanation('if x > 5:', 'oka vela x > 5:', 2);
    expect(ifExp.whatItDoes).toContain('Condition');
    expect(ifExp.whatItDoes).toContain('Nijam');

    const printExp = getDeterministicLineExplanation('print("Done")', 'chupinchu("Done")', 3);
    expect(printExp.whatItDoes).toContain('chupistundi');

    const assignExp = getDeterministicLineExplanation('total = price * qty', 'total = price * qty', 4);
    expect(assignExp.whatItDoes).toContain('total');
    expect(assignExp.whatItDoes).toContain('store chestundi');
  });
});
