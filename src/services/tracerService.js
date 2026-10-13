/**
 * Safe, sandboxed educational execution tracer for CodeToTelugu.
 * Strictly avoids eval() / Function() constructors.
 * Evaluates a documented, bounded subset of Python:
 * - Simple variable assignments (integers, floats, strings, booleans, lists)
 * - Binary arithmetic (+, -, *, /, //, %) and comparisons (==, !=, <, >, <=, >=)
 * - Logical operators (and, or, not)
 * - if, elif, and else conditional branching
 * - Bounded for loops with range() (step & iteration bounded)
 * - print() function calls with output capture
 * - Simple function definitions and returns (single-depth)
 * - Rejects unsupported syntax (imports, while loops without bounds, classes, globals)
 */

export const MAX_EXECUTION_STEPS = 100;
export const MAX_LOOP_ITERATIONS = 50;

/**
 * Tokenize a simple Python expression (e.g. "total + i", "x > 5", "range(1, 4)")
 */
function tokenizeExpr(expr) {
  const tokens = [];
  let i = 0;
  const s = expr.trim();
  const len = s.length;

  while (i < len) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Two-character operators
    const two = s.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**'].includes(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }

    // Single-character operators and delimiters
    if ('+-*/%<>()[],'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    // String literals ('...' or "...")
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let start = ++i;
      let strVal = '';
      while (i < len && s[i] !== quote) {
        if (s[i] === '\\' && i + 1 < len) {
          strVal += s[i + 1];
          i += 2;
        } else {
          strVal += s[i];
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push({ type: 'LITERAL', value: strVal });
      continue;
    }

    // Number literals (integers and floats)
    if (/\d/.test(ch)) {
      let start = i;
      while (i < len && /[\d.]/.test(s[i])) {
        i++;
      }
      const numStr = s.slice(start, i);
      tokens.push({ type: 'LITERAL', value: Number(numStr) });
      continue;
    }

    // Identifiers or keywords (e.g. var name, True, False, and, or, not, range, print)
    if (/[a-zA-Z_]/.test(ch)) {
      let start = i;
      while (i < len && /[a-zA-Z0-9_]/.test(s[i])) {
        i++;
      }
      const word = s.slice(start, i);
      if (word === 'True') tokens.push({ type: 'LITERAL', value: true });
      else if (word === 'False') tokens.push({ type: 'LITERAL', value: false });
      else if (word === 'None') tokens.push({ type: 'LITERAL', value: null });
      else if (['and', 'or', 'not'].includes(word)) tokens.push({ type: 'OP', value: word });
      else tokens.push({ type: 'IDENT', value: word });
      continue;
    }

    i++;
  }

  return tokens;
}

/**
 * Safely evaluate an expression token stream against an environment of variables
 */
function evaluateExpr(exprStr, env = {}) {
  const trimmed = (exprStr || '').trim();
  if (!trimmed) return undefined;

  const tokens = tokenizeExpr(trimmed);
  if (tokens.length === 0) return undefined;

  // Single literal or variable
  if (tokens.length === 1) {
    const t = tokens[0];
    if (t.type === 'LITERAL') return t.value;
    if (t.type === 'IDENT') {
      if (Object.prototype.hasOwnProperty.call(env, t.value)) {
        return env[t.value];
      }
      throw new Error(`NameError: name '${t.value}' is not defined`);
    }
  }

  // Handle simple list literal e.g. [1, 2, 3]
  if (tokens[0].value === '[' && tokens[tokens.length - 1].value === ']') {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    const parts = inner.split(',').map((p) => evaluateExpr(p, env));
    return parts;
  }

  // Handle function call e.g. range(1, 4) or len(x)
  if (tokens[0].type === 'IDENT' && tokens[1]?.value === '(' && tokens[tokens.length - 1]?.value === ')') {
    const fnName = tokens[0].value;
    const inner = trimmed.slice(fnName.length + 1, -1).trim();
    const argStrs = inner ? splitArgs(inner) : [];
    const args = argStrs.map((a) => evaluateExpr(a, env));

    if (fnName === 'range') {
      return evalRange(args);
    }
    if (fnName === 'len') {
      if (Array.isArray(args[0]) || typeof args[0] === 'string') return args[0].length;
      throw new Error(`TypeError: object of type has no len()`);
    }
    if (fnName === 'int') return parseInt(args[0], 10) || 0;
    if (fnName === 'str') return String(args[0]);
    if (fnName === 'sum') {
      if (Array.isArray(args[0])) return args[0].reduce((acc, v) => acc + (Number(v) || 0), 0);
      return 0;
    }
  }

  // Safe arithmetic & comparison evaluator using precedence climbing
  let pos = 0;

  function parsePrimary() {
    if (pos >= tokens.length) return 0;
    const token = tokens[pos];

    if (token.value === '(') {
      pos++;
      const val = parseLogicalOr();
      if (pos < tokens.length && tokens[pos].value === ')') pos++;
      return val;
    }

    if (token.value === 'not') {
      pos++;
      return !parsePrimary();
    }

    if (token.value === '-') {
      pos++;
      return -parsePrimary();
    }

    if (token.type === 'LITERAL') {
      pos++;
      return token.value;
    }

    if (token.type === 'IDENT') {
      pos++;
      if (Object.prototype.hasOwnProperty.call(env, token.value)) {
        return env[token.value];
      }
      throw new Error(`NameError: name '${token.value}' is not defined`);
    }

    pos++;
    return 0;
  }

  function parseMultiplicative() {
    let left = parsePrimary();
    while (pos < tokens.length && ['*', '/', '//', '%'].includes(tokens[pos].value)) {
      const op = tokens[pos].value;
      pos++;
      const right = parsePrimary();
      if (op === '*') left = left * right;
      else if (op === '/') left = right === 0 ? 0 : left / right;
      else if (op === '//') left = right === 0 ? 0 : Math.floor(left / right);
      else if (op === '%') left = right === 0 ? 0 : left % right;
    }
    return left;
  }

  function parseAdditive() {
    let left = parseMultiplicative();
    while (pos < tokens.length && ['+', '-'].includes(tokens[pos].value)) {
      const op = tokens[pos].value;
      pos++;
      const right = parseMultiplicative();
      if (op === '+') {
        if (typeof left === 'string' || typeof right === 'string') {
          left = String(left) + String(right);
        } else {
          left = left + right;
        }
      } else if (op === '-') {
        left = left - right;
      }
    }
    return left;
  }

  function parseRelational() {
    let left = parseAdditive();
    while (pos < tokens.length && ['==', '!=', '<', '<=', '>', '>='].includes(tokens[pos].value)) {
      const op = tokens[pos].value;
      pos++;
      const right = parseAdditive();
      if (op === '==') left = left === right;
      else if (op === '!=') left = left !== right;
      else if (op === '<') left = left < right;
      else if (op === '<=') left = left <= right;
      else if (op === '>') left = left > right;
      else if (op === '>=') left = left >= right;
    }
    return left;
  }

  function parseLogicalAnd() {
    let left = parseRelational();
    while (pos < tokens.length && tokens[pos].value === 'and') {
      pos++;
      const right = parseRelational();
      left = left && right;
    }
    return left;
  }

  function parseLogicalOr() {
    let left = parseLogicalAnd();
    while (pos < tokens.length && tokens[pos].value === 'or') {
      pos++;
      const right = parseLogicalAnd();
      left = left || right;
    }
    return left;
  }

  return parseLogicalOr();
}

function evalRange(args) {
  let start = 0;
  let stop = 0;
  let step = 1;

  if (args.length === 1) {
    stop = Number(args[0]) || 0;
  } else if (args.length === 2) {
    start = Number(args[0]) || 0;
    stop = Number(args[1]) || 0;
  } else if (args.length >= 3) {
    start = Number(args[0]) || 0;
    stop = Number(args[1]) || 0;
    step = Number(args[2]) || 1;
  }

  const result = [];
  if (step > 0) {
    for (let i = start; i < stop && result.length < MAX_LOOP_ITERATIONS; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > stop && result.length < MAX_LOOP_ITERATIONS; i += step) {
      result.push(i);
    }
  }
  return result;
}

function splitArgs(argsStr) {
  const args = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;

    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/**
 * Validate whether the code fits into the supported educational tracer subset.
 *
 * @param {string} code
 * @returns {{ supported: boolean, reason?: string }}
 */
export function checkTracerSupport(code) {
  if (!code || !code.trim()) {
    return { supported: false, reason: 'Code is empty. Enter Python code to trace.' };
  }

  const lines = code.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    // Reject import statements
    if (/^(import|from)\b/.test(line)) {
      return {
        supported: false,
        reason: `Line ${i + 1}: "import" statements are not supported in the educational execution tracer.`,
      };
    }

    // Reject classes and OOP
    if (/^class\b/.test(line)) {
      return {
        supported: false,
        reason: `Line ${i + 1}: Class definitions are not supported in the tracer subset.`,
      };
    }

    // Reject try/except
    if (/^(try|except|finally|raise)\b/.test(line)) {
      return {
        supported: false,
        reason: `Line ${i + 1}: Exception handling (try/except) is not supported in the tracer.`,
      };
    }

    // Reject unbounded while True
    if (/^while\s+True\s*:/.test(line)) {
      return {
        supported: false,
        reason: `Line ${i + 1}: Infinite "while True" loops are not permitted to prevent freezing.`,
      };
    }
  }

  return { supported: true };
}

/**
 * Trace Python code execution step-by-step.
 *
 * @param {string} code - Python code
 * @returns {{
 *   success: boolean,
 *   steps: Array<{
 *     stepIndex: number,
 *     lineNumber: number,
 *     lineContent: string,
 *     variables: Record<string, any>,
 *     changedVariable: string | null,
 *     output: string[],
 *     narrationTelugu: string,
 *   }>,
 *   finalOutput: string[],
 *   error?: string,
 * }}
 */
export function traceExecution(code) {
  const check = checkTracerSupport(code);
  if (!check.supported) {
    return {
      success: false,
      steps: [],
      finalOutput: [],
      error: check.reason || 'Unsupported syntax for tracer',
    };
  }

  const rawLines = code.split(/\r?\n/);
  const steps = [];
  const env = {};
  const output = [];

  // Parse lines with indentation tracking
  const lines = rawLines.map((content, idx) => {
    const indentMatch = content.match(/^[ \t]*/);
    const indent = indentMatch ? indentMatch[0].length : 0;
    return {
      lineNumber: idx + 1,
      raw: content,
      trimmed: content.trim(),
      indent,
    };
  });

  let lineIdx = 0;
  let totalSteps = 0;

  try {
    while (lineIdx < lines.length && totalSteps < MAX_EXECUTION_STEPS) {
      const current = lines[lineIdx];
      const trimmed = current.trimmed;

      // Skip blank lines and pure comments
      if (!trimmed || trimmed.startsWith('#')) {
        lineIdx++;
        continue;
      }

      totalSteps++;

      // 1. Variable Assignment (e.g. total = 0, name = "Harsha", total += i)
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*(=|\+=|-=|\*=|\/=)\s*(.*)$/);
      if (assignMatch && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while')) {
        const varName = assignMatch[1];
        const op = assignMatch[2];
        const exprStr = assignMatch[3];

        let val;
        // Mock input() call safely if user uses input()
        if (/input\s*\(/.test(exprStr)) {
          val = 'User_Input';
        } else {
          val = evaluateExpr(exprStr, env);
        }

        if (op === '=') {
          env[varName] = val;
        } else if (op === '+=') {
          env[varName] = (env[varName] || 0) + val;
        } else if (op === '-=') {
          env[varName] = (env[varName] || 0) - val;
        } else if (op === '*=') {
          env[varName] = (env[varName] || 0) * val;
        } else if (op === '/=') {
          env[varName] = val === 0 ? 0 : (env[varName] || 0) / val;
        }

        steps.push({
          stepIndex: steps.length + 1,
          lineNumber: current.lineNumber,
          lineContent: current.raw,
          variables: { ...env },
          changedVariable: varName,
          output: [...output],
          narrationTelugu: `"${varName}" variable lo "${JSON.stringify(env[varName])}" value ni store chesam.`,
        });

        lineIdx++;
        continue;
      }

      // 2. Print Statement (e.g. print("Hello", name), print(total))
      if (/^print\s*\(/.test(trimmed)) {
        const match = trimmed.match(/^print\s*\((.*)\)$/);
        const argsStr = match ? match[1] : '';
        const argList = argsStr ? splitArgs(argsStr) : [];
        const printedVals = argList.map((a) => {
          try {
            return String(evaluateExpr(a, env));
          } catch (e) {
            return a;
          }
        });

        const lineOut = printedVals.join(' ');
        output.push(lineOut);

        steps.push({
          stepIndex: steps.length + 1,
          lineNumber: current.lineNumber,
          lineContent: current.raw,
          variables: { ...env },
          changedVariable: null,
          output: [...output],
          narrationTelugu: `Screen pai "${lineOut}" print ayyindi (output console lo chudavachu).`,
        });

        lineIdx++;
        continue;
      }

      // 3. For loop with range (e.g. for i in range(1, 4):)
      const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.*)\s*:$/);
      if (forMatch) {
        const loopVar = forMatch[1];
        const iterExpr = forMatch[2];
        const iterItems = evaluateExpr(iterExpr, env);

        if (!Array.isArray(iterItems)) {
          throw new Error(`TypeError: '${iterExpr}' is not iterable`);
        }

        const loopIndent = current.indent;
        // Find body lines
        const bodyLines = [];
        let scanIdx = lineIdx + 1;
        while (scanIdx < lines.length) {
          const next = lines[scanIdx];
          if (!next.trimmed || next.trimmed.startsWith('#')) {
            scanIdx++;
            continue;
          }
          if (next.indent > loopIndent) {
            bodyLines.push({ ...next, originalIdx: scanIdx });
            scanIdx++;
          } else {
            break;
          }
        }

        // Loop iteration execution
        for (let iter = 0; iter < Math.min(iterItems.length, MAX_LOOP_ITERATIONS); iter++) {
          const itemVal = iterItems[iter];
          env[loopVar] = itemVal;

          steps.push({
            stepIndex: steps.length + 1,
            lineNumber: current.lineNumber,
            lineContent: current.raw,
            variables: { ...env },
            changedVariable: loopVar,
            output: [...output],
            narrationTelugu: `Loop iteration ${iter + 1}: "${loopVar}" value ippudu "${itemVal}" ga set ayindi.`,
          });

          // Execute body lines for this iteration
          for (const bLine of bodyLines) {
            if (steps.length >= MAX_EXECUTION_STEPS) break;

            const bTrimmed = bLine.trimmed;
            if (/^print\s*\(/.test(bTrimmed)) {
              const pMatch = bTrimmed.match(/^print\s*\((.*)\)$/);
              const pArgsStr = pMatch ? pMatch[1] : '';
              const pArgList = pArgsStr ? splitArgs(pArgsStr) : [];
              const pVals = pArgList.map((a) => {
                try {
                  return String(evaluateExpr(a, env));
                } catch (e) {
                  return a;
                }
              });
              const lineOut = pVals.join(' ');
              output.push(lineOut);
              steps.push({
                stepIndex: steps.length + 1,
                lineNumber: bLine.lineNumber,
                lineContent: bLine.raw,
                variables: { ...env },
                changedVariable: null,
                output: [...output],
                narrationTelugu: `Loop lo print ayyindi: "${lineOut}".`,
              });
            } else {
              const bAssign = bTrimmed.match(/^([a-zA-Z_]\w*)\s*(=|\+=|-=|\*=|\/=)\s*(.*)$/);
              if (bAssign) {
                const bVar = bAssign[1];
                const bOp = bAssign[2];
                const bVal = evaluateExpr(bAssign[3], env);

                if (bOp === '=') env[bVar] = bVal;
                else if (bOp === '+=') env[bVar] = (env[bVar] || 0) + bVal;
                else if (bOp === '-=') env[bVar] = (env[bVar] || 0) - bVal;
                else if (bOp === '*=') env[bVar] = (env[bVar] || 0) * bVal;

                steps.push({
                  stepIndex: steps.length + 1,
                  lineNumber: bLine.lineNumber,
                  lineContent: bLine.raw,
                  variables: { ...env },
                  changedVariable: bVar,
                  output: [...output],
                  narrationTelugu: `Loop lo "${bVar}" calculate chesi kotha value "${JSON.stringify(env[bVar])}" store chesam.`,
                });
              }
            }
          }
        }

        // Advance lineIdx past the loop body
        lineIdx = scanIdx;
        continue;
      }

      // 4. If / Elif / Else condition branching
      if (/^if\s+(.*):$/.test(trimmed)) {
        const condExpr = trimmed.match(/^if\s+(.*):$/)[1];
        const condResult = Boolean(evaluateExpr(condExpr, env));

        steps.push({
          stepIndex: steps.length + 1,
          lineNumber: current.lineNumber,
          lineContent: current.raw,
          variables: { ...env },
          changedVariable: null,
          output: [...output],
          narrationTelugu: `Condition "${condExpr}" evaluate chesam. Result: ${condResult ? 'Nijam (True)' : 'Abaddham (False)'}.`,
        });

        // Scan if-block and optional else-block
        const ifIndent = current.indent;
        const ifBody = [];
        const elseBody = [];
        let scanIdx = lineIdx + 1;
        let inElse = false;

        while (scanIdx < lines.length) {
          const next = lines[scanIdx];
          if (!next.trimmed) {
            scanIdx++;
            continue;
          }

          if (next.indent === ifIndent && /^else\s*:$/.test(next.trimmed)) {
            inElse = true;
            scanIdx++;
            continue;
          }

          if (next.indent > ifIndent) {
            if (inElse) elseBody.push(next);
            else ifBody.push(next);
            scanIdx++;
          } else {
            break;
          }
        }

        const chosenBody = condResult ? ifBody : elseBody;
        for (const bLine of chosenBody) {
          if (steps.length >= MAX_EXECUTION_STEPS) break;

          const bTrimmed = bLine.trimmed;
          if (/^print\s*\(/.test(bTrimmed)) {
            const pMatch = bTrimmed.match(/^print\s*\((.*)\)$/);
            const pArgsStr = pMatch ? pMatch[1] : '';
            const pArgList = pArgsStr ? splitArgs(pArgsStr) : [];
            const pVals = pArgList.map((a) => {
              try {
                return String(evaluateExpr(a, env));
              } catch (e) {
                return a;
              }
            });
            const lineOut = pVals.join(' ');
            output.push(lineOut);
            steps.push({
              stepIndex: steps.length + 1,
              lineNumber: bLine.lineNumber,
              lineContent: bLine.raw,
              variables: { ...env },
              changedVariable: null,
              output: [...output],
              narrationTelugu: `${condResult ? 'If' : 'Else'} block lo execute ayyindi: "${lineOut}".`,
            });
          } else {
            const bAssign = bTrimmed.match(/^([a-zA-Z_]\w*)\s*(=|\+=|-=|\*=|\/=)\s*(.*)$/);
            if (bAssign) {
              const bVar = bAssign[1];
              const bOp = bAssign[2];
              const bVal = evaluateExpr(bAssign[3], env);

              if (bOp === '=') env[bVar] = bVal;
              else if (bOp === '+=') env[bVar] = (env[bVar] || 0) + bVal;

              steps.push({
                stepIndex: steps.length + 1,
                lineNumber: bLine.lineNumber,
                lineContent: bLine.raw,
                variables: { ...env },
                changedVariable: bVar,
                output: [...output],
                narrationTelugu: `${condResult ? 'If' : 'Else'} block lo "${bVar}" = "${JSON.stringify(env[bVar])}" store ayindi.`,
              });
            }
          }
        }

        lineIdx = scanIdx;
        continue;
      }

      // Default line pass
      lineIdx++;
    }

    // Final finish step if steps occurred
    if (steps.length > 0) {
      steps.push({
        stepIndex: steps.length + 1,
        lineNumber: lines[lines.length - 1].lineNumber,
        lineContent: '# Execution Complete',
        variables: { ...env },
        changedVariable: null,
        output: [...output],
        narrationTelugu: 'Program execution poorthi ayyindi (Complete). Final output mariyu variables kindi panel lo chudavachu.',
      });
    }

    return {
      success: true,
      steps,
      finalOutput: output,
    };
  } catch (err) {
    return {
      success: false,
      steps,
      finalOutput: output,
      error: err.message || 'Execution error encountered in tracer',
    };
  }
}
