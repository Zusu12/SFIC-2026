// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { CodeEditor } from '../components/CodeEditor.jsx';

describe('CodeEditor Component', () => {
  it('renders with initial code and allows editing via textarea fallback', () => {
    const handleChange = vi.fn();
    const handleCursorChange = vi.fn();

    const { container } = render(
      <CodeEditor
        value="print('hello')"
        onChange={handleChange}
        onCursorChange={handleCursorChange}
        readOnly={false}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe("print('hello')");
    expect(textarea.readOnly).toBe(false);

    // Simulate typing
    fireEvent.change(textarea, { target: { value: "print('hello world')" } });
    expect(handleChange).toHaveBeenCalledWith("print('hello world')");
  });

  it('respects readOnly property when configured as read-only', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <CodeEditor
        value="total = 100"
        onChange={handleChange}
        readOnly={true}
      />
    );

    const textarea = container.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.readOnly).toBe(true);

    fireEvent.change(textarea, { target: { value: "total = 200" } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('handles Tab key press by indenting 4 spaces instead of shifting focus', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <CodeEditor
        value="def test():\npass"
        onChange={handleChange}
        readOnly={false}
      />
    );

    const textarea = container.querySelector('textarea');
    textarea.selectionStart = 12;
    textarea.selectionEnd = 12;

    fireEvent.keyDown(textarea, { key: 'Tab' });
    expect(handleChange).toHaveBeenCalled();
    const emittedCode = handleChange.mock.calls[0][0];
    expect(emittedCode).toContain('    ');
  });
});
