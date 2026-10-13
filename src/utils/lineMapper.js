/**
 * Line mapping and contextual line information utility for CodeToTelugu.
 * Synchronizes lines between original Python source and translated Telugu code.
 */

/**
 * Split code into lines safely handling \r\n and \n.
 *
 * @param {string} code
 * @returns {string[]}
 */
export function splitLines(code) {
  if (typeof code !== 'string') return [];
  return code.split(/\r?\n/);
}

/**
 * Maps a line number from source code to translated code.
 * In CodeToTelugu lexical translation, line counts and newlines are preserved 1:1,
 * but this utility safely validates, normalizes, and handles boundary fallbacks.
 *
 * @param {number} sourceLineNumber - 1-based line number in source code
 * @param {string} sourceCode
 * @param {string} translatedCode
 * @returns {number} 1-based mapped line number in translated code
 */
export function mapSourceLineToTranslated(sourceLineNumber, sourceCode, translatedCode) {
  const transLines = splitLines(translatedCode || '');
  const totalTransLines = Math.max(1, transLines.length);

  if (typeof sourceLineNumber !== 'number' || isNaN(sourceLineNumber) || sourceLineNumber < 1) {
    return 1;
  }

  // Safe boundary clamp
  return Math.min(Math.max(1, sourceLineNumber), totalTransLines);
}

/**
 * Maps a line number from translated code back to source code.
 *
 * @param {number} translatedLineNumber - 1-based line number in translated code
 * @param {string} sourceCode
 * @param {string} translatedCode
 * @returns {number} 1-based mapped line number in source code
 */
export function mapTranslatedLineToSource(translatedLineNumber, sourceCode, _translatedCode) {
  const srcLines = splitLines(sourceCode || '');
  const totalSrcLines = Math.max(1, srcLines.length);

  if (typeof translatedLineNumber !== 'number' || isNaN(translatedLineNumber) || translatedLineNumber < 1) {
    return 1;
  }

  return Math.min(Math.max(1, translatedLineNumber), totalSrcLines);
}

/**
 * Get comprehensive info for a line across both code versions.
 *
 * @param {string} sourceCode
 * @param {string} translatedCode
 * @param {number} lineNumber - 1-based line number
 * @returns {{
 *   lineNumber: number,
 *   sourceText: string,
 *   translatedText: string,
 *   isEmpty: boolean,
 *   isComment: boolean,
 *   indentation: number,
 *   variables: string[]
 * }}
 */
export function getLineDetails(sourceCode, translatedCode, lineNumber) {
  const srcLines = splitLines(sourceCode || '');
  const transLines = splitLines(translatedCode || '');

  const clampedLine = Math.min(Math.max(1, lineNumber || 1), Math.max(1, srcLines.length));
  const sourceText = srcLines[clampedLine - 1] ?? '';
  const translatedText = transLines[clampedLine - 1] ?? '';

  const trimmed = sourceText.trim();
  const isEmpty = trimmed.length === 0;
  const isComment = trimmed.startsWith('#');

  // Compute indentation
  const indentMatch = sourceText.match(/^[ \t]*/);
  const indentation = indentMatch ? indentMatch[0].length : 0;

  // Extract simple identifiers/variables in line (excluding Python keywords)
  const PYTHON_KEYWORDS = new Set([
    'if', 'else', 'elif', 'for', 'while', 'def', 'return', 'in', 'and', 'or',
    'not', 'is', 'None', 'True', 'False', 'import', 'from', 'as', 'class',
    'try', 'except', 'finally', 'with', 'pass', 'break', 'continue', 'lambda',
    'yield', 'print', 'input', 'range', 'len', 'int', 'str', 'float', 'list', 'dict'
  ]);

  const identifiers = (trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [])
    .filter((id) => !PYTHON_KEYWORDS.has(id));

  const uniqueVariables = Array.from(new Set(identifiers));

  return {
    lineNumber: clampedLine,
    sourceText,
    translatedText,
    isEmpty,
    isComment,
    indentation,
    variables: uniqueVariables,
  };
}

/**
 * Deterministic local beginner-friendly Telugu explanation for a line.
 * Provides immediate feedback before or alongside Gemini AI contextual explanations.
 *
 * @param {string} sourceLine
 * @param {string} translatedLine
 * @param {number} lineNumber
 * @returns {{ whatItDoes: string, whyItIsUsed: string }}
 */
export function getDeterministicLineExplanation(sourceLine, _translatedLine, _lineNumber) {
  const trimmed = (sourceLine || '').trim();

  if (!trimmed) {
    return {
      whatItDoes: 'Idi oka empty line (khali line).',
      whyItIsUsed: 'Code chadavadaniki neat ga, clean ga undadaniki lines madhyalo space istham.',
    };
  }

  if (trimmed.startsWith('#')) {
    const commentBody = trimmed.replace(/^#\s*/, '');
    return {
      whatItDoes: `Idi comment: "${commentBody}". Python deenni run cheyadu.`,
      whyItIsUsed: 'Programmer ki code gurthu undataniki mariyu logic vivarinchataniki comments vadatharu.',
    };
  }

  // Print statement
  if (/^print\s*\(/.test(trimmed)) {
    const match = trimmed.match(/^print\s*\((.*)\)$/);
    const args = match ? match[1] : '';
    return {
      whatItDoes: `Screen pai (${args || 'value'}) ni chupistundi (output ga isthundi).`,
      whyItIsUsed: 'User ki result chupinchadaniki "print()" function vadatham.',
    };
  }

  // Input statement
  if (/input\s*\(/.test(trimmed)) {
    return {
      whatItDoes: 'User nundi keyboard dwara value ni theesukuni variable lo store chestundi.',
      whyItIsUsed: 'Program dynamic ga user inputs tho pani cheyadaniki "input()" vadatharu.',
    };
  }

  // For loop with range
  if (/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*)\)\s*:/.test(trimmed)) {
    const match = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*)\)\s*:/);
    const loopVar = match ? match[1] : 'i';
    const rangeArgs = match ? match[2] : '';
    return {
      whatItDoes: `"${loopVar}" variable tho range(${rangeArgs}) lo unna prathi number ki kindi code ni repeat chestundi.`,
      whyItIsUsed: 'Oka pani ni multiple times cheyadaniki loop vadatharu.',
    };
  }

  // While loop
  if (/^while\s+(.*):/.test(trimmed)) {
    const match = trimmed.match(/^while\s+(.*):/);
    const cond = match ? match[1] : '';
    return {
      whatItDoes: `Condition (${cond}) Nijam (True) ainanthavaraku kindi code repeat avuthundi.`,
      whyItIsUsed: 'Condition true unnantha varaku repeat ga run cheyadaniki while loop vadathamu.',
    };
  }

  // If statement
  if (/^if\s+(.*):/.test(trimmed)) {
    const match = trimmed.match(/^if\s+(.*):/);
    const cond = match ? match[1] : '';
    return {
      whatItDoes: `Condition (${cond}) Nijam (True) ayithe mathrame kindi code block execute avuthundi.`,
      whyItIsUsed: 'Decision teesukodaniki (decide cheyadaniki) "if" condition vadathamu.',
    };
  }

  // Elif statement
  if (/^elif\s+(.*):/.test(trimmed)) {
    const match = trimmed.match(/^elif\s+(.*):/);
    const cond = match ? match[1] : '';
    return {
      whatItDoes: `Paina if false ayithe, ee condition (${cond}) check chestundi.`,
      whyItIsUsed: 'Multiple conditions ni okadani tharvatha okati check cheyadaniki "elif" vadathamu.',
    };
  }

  // Else statement
  if (/^else\s*:/.test(trimmed)) {
    return {
      whatItDoes: 'Paina unna conditions annie False ainappudu ee block run avuthundi.',
      whyItIsUsed: 'Default case ga, paina evi match kakapothe "else" block execute avvali.',
    };
  }

  // Function definition
  if (/^def\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:/.test(trimmed)) {
    const match = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*)\)\s*:/);
    const funcName = match ? match[1] : '';
    const params = match ? match[2] : '';
    return {
      whatItDoes: `"${funcName}" ane kotha function ni define chestundi (${params ? `parameters: ${params}` : 'parameters lekunda'}).`,
      whyItIsUsed: 'Code reusability kosam, logic ni oka peru tho group cheyadaniki functions vadatham.',
    };
  }

  // Return statement
  if (/^return\b/.test(trimmed)) {
    const val = trimmed.replace(/^return\s*/, '');
    return {
      whatItDoes: `Function nundi result (${val || 'None'}) ni tirigi pampistundi (return chestundi).`,
      whyItIsUsed: 'Function calculate chesina answer ni caller ki ivvadaniki "return" vadathamu.',
    };
  }

  // Variable assignment
  if (/^[a-zA-Z_]\w*\s*(=|\+=|-=|\*=|\/=)\s*(.*)/.test(trimmed)) {
    const match = trimmed.match(/^([a-zA-Z_]\w*)\s*(=|\+=|-=|\*=|\/=)\s*(.*)/);
    const varName = match ? match[1] : 'variable';
    const op = match ? match[2] : '=';
    const expr = match ? match[3] : '';

    if (op === '=') {
      return {
        whatItDoes: `"${expr}" value ni calculate chesi "${varName}" variable lo store chestundi.`,
        whyItIsUsed: 'Data ni memory lo dachukuni tharvatha vadukodaniki variable assignment vadatharu.',
      };
    } else {
      return {
        whatItDoes: `"${varName}" lo unna value ni "${expr}" tho update chestundi (${op}).`,
        whyItIsUsed: 'Existing variable value ni update cheyadaniki vadathamu.',
      };
    }
  }

  // Generic statement
  return {
    whatItDoes: `Ee line (${trimmed}) oka expression ni evaluate chestundi.`,
    whyItIsUsed: 'Program flow lo ee statement tana calculation ni perform chestundi.',
  };
}
