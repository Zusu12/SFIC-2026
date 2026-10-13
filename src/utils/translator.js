import teluguDictionary from '../dictionary/telugu.json' with { type: 'json' };

/**
 * Token types produced by the Python lexical scanner
 */
const TOKEN_TYPE = {
  WHITESPACE: 'WHITESPACE',
  COMMENT: 'COMMENT',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  IDENTIFIER: 'IDENTIFIER',
  OPERATOR_PUNCT: 'OPERATOR_PUNCT',
  OTHER: 'OTHER',
};

/**
 * Lightweight, reliable Python lexical scanner
 * Breaks Python source code into tokens: strings, comments, numbers, identifiers, punctuation, whitespace
 *
 * @param {string} source - Python source code
 * @returns {Array<{ type: string, value: string }>} Array of tokens
 */
export function tokenizePython(source) {
  if (!source || typeof source !== 'string') {
    return [];
  }

  const tokens = [];
  const len = source.length;
  let i = 0;

  while (i < len) {
    const ch = source[i];

    // 1. Whitespace (spaces, tabs, newlines)
    if (/\s/.test(ch)) {
      let start = i;
      while (i < len && /\s/.test(source[i])) {
        i++;
      }
      tokens.push({
        type: TOKEN_TYPE.WHITESPACE,
        value: source.slice(start, i),
      });
      continue;
    }

    // 2. Comments (# to end of line)
    if (ch === '#') {
      let start = i;
      while (i < len && source[i] !== '\n' && source[i] !== '\r') {
        i++;
      }
      tokens.push({
        type: TOKEN_TYPE.COMMENT,
        value: source.slice(start, i),
      });
      continue;
    }

    // 3. String literals (handling prefixes like r, f, b, u, rf, etc.)
    // Check if current position starts a string or string prefix followed by quote
    let quoteIndex = i;

    // Check if next 1 or 2 chars are string prefix
    if (/[rRuUbBfF]/.test(ch)) {
      let j = i;
      while (j < len && j - i < 3 && /[rRuUbBfF]/.test(source[j])) {
        j++;
      }
      if (j < len && (source[j] === '"' || source[j] === "'")) {
        quoteIndex = j;
      }
    }

    if (quoteIndex < len && (source[quoteIndex] === '"' || source[quoteIndex] === "'")) {
      const qChar = source[quoteIndex];
      const isTriple =
        quoteIndex + 2 < len &&
        source[quoteIndex + 1] === qChar &&
        source[quoteIndex + 2] === qChar;

      const delimiter = isTriple ? qChar + qChar + qChar : qChar;
      let start = i;
      let pos = quoteIndex + delimiter.length;

      while (pos < len) {
        if (source[pos] === '\\') {
          // Skip escape sequence
          pos += 2;
          continue;
        }

        if (isTriple) {
          if (
            pos + 2 < len &&
            source[pos] === qChar &&
            source[pos + 1] === qChar &&
            source[pos + 2] === qChar
          ) {
            pos += 3;
            break;
          }
        } else {
          if (source[pos] === qChar) {
            pos += 1;
            break;
          }
          if (source[pos] === '\n' || source[pos] === '\r') {
            // Unclosed single-line string literal, terminate at newline
            break;
          }
        }
        pos++;
      }

      tokens.push({
        type: TOKEN_TYPE.STRING,
        value: source.slice(start, pos),
      });
      i = pos;
      continue;
    }

    // 4. Numbers (integers, floats, hex, bin, oct)
    if (/\d/.test(ch)) {
      let start = i;
      if (ch === '0' && i + 1 < len && /[xXbBoO]/.test(source[i + 1])) {
        // Hex, binary, octal
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(source[i])) {
          i++;
        }
      } else {
        while (i < len && /[0-9_]/.test(source[i])) {
          i++;
        }
        if (i < len && source[i] === '.' && i + 1 < len && /\d/.test(source[i + 1])) {
          i++;
          while (i < len && /[0-9_]/.test(source[i])) {
            i++;
          }
        }
        if (i < len && /[eE]/.test(source[i])) {
          i++;
          if (i < len && /[+-]/.test(source[i])) {
            i++;
          }
          while (i < len && /[0-9_]/.test(source[i])) {
            i++;
          }
        }
      }
      tokens.push({
        type: TOKEN_TYPE.NUMBER,
        value: source.slice(start, i),
      });
      continue;
    }

    // 5. Identifiers and Keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let start = i;
      while (i < len && /[a-zA-Z0-9_]/.test(source[i])) {
        i++;
      }
      tokens.push({
        type: TOKEN_TYPE.IDENTIFIER,
        value: source.slice(start, i),
      });
      continue;
    }

    // 6. Multi-character operators
    const twoChars = source.slice(i, i + 2);
    const threeChars = source.slice(i, i + 3);

    if (['**=', '//=', '<<=', '>>='].includes(threeChars)) {
      tokens.push({ type: TOKEN_TYPE.OPERATOR_PUNCT, value: threeChars });
      i += 3;
      continue;
    }

    if (
      [
        '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '//', '**',
        '%=', '&=', '|=', '^=', '->', ':=', '<<', '>>'
      ].includes(twoChars)
    ) {
      tokens.push({ type: TOKEN_TYPE.OPERATOR_PUNCT, value: twoChars });
      i += 2;
      continue;
    }

    // 7. Single-character operators & punctuation
    tokens.push({
      type: TOKEN_TYPE.OPERATOR_PUNCT,
      value: ch,
    });
    i++;
  }

  return tokens;
}

/**
 * Translates Python code into Telugu learning representation
 * using the dictionary as the single source of truth.
 *
 * Preserves strings, comments, numbers, operators, indentation, variable names,
 * and functions. Never executes or evals any code.
 *
 * @param {string} originalCode - Raw Python code to translate
 * @param {Record<string, string>} [customDictionary] - Optional dictionary override
 * @returns {string} Translated code representation
 */
export function translateCode(originalCode, customDictionary = teluguDictionary) {
  if (!originalCode || typeof originalCode !== 'string') {
    return '';
  }

  const tokens = tokenizePython(originalCode);
  const result = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];

    // Non-identifiers are always emitted as-is (strings, comments, whitespace, punctuation, numbers)
    if (token.type !== TOKEN_TYPE.IDENTIFIER) {
      result.push(token.value);
      continue;
    }

    const word = token.value;

    // Check if the identifier matches a keyword in our dictionary
    if (!Object.prototype.hasOwnProperty.call(customDictionary, word)) {
      result.push(word);
      continue;
    }

    // Look backward to find the previous non-whitespace token
    let prevNonWsToken = null;
    for (let back = idx - 1; back >= 0; back--) {
      if (tokens[back].type !== TOKEN_TYPE.WHITESPACE) {
        prevNonWsToken = tokens[back];
        break;
      }
    }

    // If preceded by '.' it is an attribute / method access (e.g., obj.print(), response.in), do NOT translate
    if (prevNonWsToken && prevNonWsToken.value === '.') {
      result.push(word);
      continue;
    }

    // If preceded by 'def', it is defining a function with this name (e.g. def print():), do NOT translate function name
    if (prevNonWsToken && prevNonWsToken.value === 'def') {
      result.push(word);
      continue;
    }

    // If preceded by 'class', do NOT translate class name
    if (prevNonWsToken && prevNonWsToken.value === 'class') {
      result.push(word);
      continue;
    }

    // Look forward to find next non-whitespace token
    let nextNonWsToken = null;
    for (let fwd = idx + 1; fwd < tokens.length; fwd++) {
      if (tokens[fwd].type !== TOKEN_TYPE.WHITESPACE) {
        nextNonWsToken = tokens[fwd];
        break;
      }
    }

    // If word is 'print' or 'input' and the next token is an assignment operator '=',
    // it's being used as a variable name assignment (e.g., print = 10), so do NOT translate
    if ((word === 'print' || word === 'input') && nextNonWsToken && nextNonWsToken.value === '=') {
      result.push(word);
      continue;
    }

    // Otherwise, translate using dictionary
    result.push(customDictionary[word]);
  }

  return result.join('');
}

export default translateCode;
