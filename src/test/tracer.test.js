import { describe, it, expect } from 'vitest';
import { traceExecution, checkTracerSupport } from '../services/tracerService.js';

describe('Execution Tracer Service', () => {
  it('correctly executes simple assignments and arithmetic', () => {
    const code = `x = 5\ny = 10\ntotal = x + y`;
    const res = traceExecution(code);

    expect(res.success).toBe(true);
    expect(res.steps.length).toBeGreaterThan(0);
    const lastStep = res.steps[res.steps.length - 1];
    expect(lastStep.variables.x).toBe(5);
    expect(lastStep.variables.y).toBe(10);
    expect(lastStep.variables.total).toBe(15);
  });

  it('correctly executes for loops over range and accumulates values', () => {
    const code = `total = 0\nfor i in range(1, 4):\n    total = total + i\nprint(total)`;
    const res = traceExecution(code);

    expect(res.success).toBe(true);
    // 1 (init) + 3 iterations * 2 steps (loop head + assign) + 1 print + 1 finish = 9 steps
    expect(res.steps.length).toBeGreaterThan(4);
    const lastStep = res.steps[res.steps.length - 1];
    expect(lastStep.variables.total).toBe(6);
    expect(res.finalOutput).toEqual(['6']);
  });

  it('handles if/else conditional branching correctly', () => {
    const codeTrue = `score = 80\nif score >= 50:\n    result = "Pass"\nelse:\n    result = "Fail"`;
    const resTrue = traceExecution(codeTrue);
    expect(resTrue.success).toBe(true);
    const lastStepTrue = resTrue.steps[resTrue.steps.length - 1];
    expect(lastStepTrue.variables.result).toBe('Pass');

    const codeFalse = `score = 30\nif score >= 50:\n    result = "Pass"\nelse:\n    result = "Fail"`;
    const resFalse = traceExecution(codeFalse);
    expect(resFalse.success).toBe(true);
    const lastStepFalse = resFalse.steps[resFalse.steps.length - 1];
    expect(lastStepFalse.variables.result).toBe('Fail');
  });

  it('safely rejects unsupported syntax like import statements', () => {
    const code = `import math\nx = math.sqrt(16)`;
    const check = checkTracerSupport(code);
    expect(check.supported).toBe(false);
    expect(check.reason).toContain('import');

    const res = traceExecution(code);
    expect(res.success).toBe(false);
    expect(res.error).toContain('import');
  });

  it('safely rejects classes and infinite loops', () => {
    const classCode = `class Person:\n    pass`;
    expect(checkTracerSupport(classCode).supported).toBe(false);

    const infCode = `while True:\n    print(1)`;
    expect(checkTracerSupport(infCode).supported).toBe(false);
  });

  it('provides beginner-friendly Telugu narrations for steps', () => {
    const code = `total = 0\nprint(total)`;
    const res = traceExecution(code);
    expect(res.success).toBe(true);
    expect(res.steps[0].narrationTelugu).toContain('total');
    expect(res.steps[0].narrationTelugu).toContain('store chesam');
  });
});
