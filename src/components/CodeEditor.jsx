import React, { useRef, useEffect, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure Monaco loader to use local files from /monaco/vs
if (typeof window !== 'undefined') {
  loader.config({
    paths: {
      vs: '/monaco/vs',
    },
  });
}

export function CodeEditor({
  value = '',
  onChange,
  onCursorChange,
  onLineSelect,
  highlightedLine = null,
  highlightClass = 'monaco-sync-active-line',
  editorRef: externalEditorRef,
  readOnly = false,
  height = '360px',
  language = 'python',
}) {
  const internalEditorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const isProgrammaticMoveRef = useRef(false);
  const isInternalChangeRef = useRef(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);

  // Sync external editor value changes (e.g. from Clear Code or opening a saved program)
  useEffect(() => {
    const editor = internalEditorRef.current;
    if (!editor) return;

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const currentEditorValue = editor.getValue();
    if (value !== undefined && value !== currentEditorValue) {
      // Preserve cursor position during programmatic value updates
      const pos = editor.getPosition();
      editor.setValue(value || '');
      if (pos) {
        editor.setPosition(pos);
      }
    }
  }, [value]);

  // Apply or update decorations when highlightedLine changes
  useEffect(() => {
    const editor = internalEditorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (highlightedLine && highlightedLine > 0) {
      const lineCount = editor.getModel()?.getLineCount() || 1;
      const validLine = Math.min(Math.max(1, highlightedLine), lineCount);

      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(validLine, 1, validLine, 1),
          options: {
            isWholeLine: true,
            className: highlightClass,
            marginClassName: 'monaco-sync-glyph-marker',
          },
        },
      ]);

      // Gently reveal the line if out of viewport without interrupting scrolling
      isProgrammaticMoveRef.current = true;
      editor.revealLineInCenterIfOutsideViewport(validLine);
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 50);
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [highlightedLine, highlightClass]);

  const handleEditorDidMount = (editor, monaco) => {
    internalEditorRef.current = editor;
    monacoRef.current = monaco;
    setMonacoLoaded(true);

    if (externalEditorRef) {
      externalEditorRef.current = editor;
    }

    // Define GitHub Dark / VS Code Dark IDE theme
    monaco.editor.defineTheme('ide-github-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF7B72' },
        { token: 'string', foreground: 'A5D6FF' },
        { token: 'number', foreground: '79C0FF' },
        { token: 'identifier', foreground: 'E6EDF3' },
        { token: 'delimiter', foreground: '79C0FF' },
        { token: 'operator', foreground: 'FF7B72' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#E6EDF3',
        'editorLineNumber.foreground': '#484F58',
        'editorLineNumber.activeForeground': '#E6EDF3',
        'editor.lineHighlightBackground': '#161B2280',
        'editorCursor.foreground': '#58A6FF',
        'editor.selectionBackground': '#58A6FF26',
        'editorWhitespace.foreground': '#21262D',
      },
    });

    monaco.editor.setTheme('ide-github-dark');

    // Ensure the editor has focus capability and correct options
    editor.updateOptions({
      readOnly: Boolean(readOnly),
    });

    // Track cursor movement for Ln/Col footer and line synchronization
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      }

      if (onLineSelect && !isProgrammaticMoveRef.current) {
        onLineSelect(e.position.lineNumber);
      }
    });

    // Handle mouse click directly on lines
    editor.onMouseDown((e) => {
      if (e.target?.position && onLineSelect) {
        onLineSelect(e.target.position.lineNumber);
      }
    });
  };

  const handleContentChange = (val) => {
    isInternalChangeRef.current = true;
    if (!readOnly && onChange) {
      onChange(val || '');
    }
  };

  // Keyboard handler for fallback editor textarea
  const handleFallbackKeyDown = (e) => {
    if (readOnly) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const currentValue = value || '';
      const newValue = currentValue.substring(0, start) + '    ' + currentValue.substring(end);
      if (onChange) onChange(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleFallbackChange = (e) => {
    if (readOnly) return;
    const newVal = e.target.value;
    if (onChange) onChange(newVal);

    if (onCursorChange) {
      const textBefore = newVal.substring(0, e.target.selectionStart);
      const lines = textBefore.split('\n');
      onCursorChange({
        lineNumber: lines.length,
        column: lines[lines.length - 1].length + 1,
      });
    }
  };

  return (
    <div className="relative w-full bg-[#0D1117] overflow-hidden" style={{ height }}>
      {/* Fallback editable textarea displayed before Monaco loads or if loading fails */}
      {!monacoLoaded && (
        <div className="absolute inset-0 flex bg-[#0D1117] z-0 font-mono text-xs">
          {/* Fallback line numbers */}
          <div className="w-12 bg-[#0D1117] text-[#484F58] py-2 pr-2 text-right select-none border-r border-[#30363D]/40 font-mono leading-5">
            {(value || '').split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* Fallback editable textarea */}
          <textarea
            value={value || ''}
            readOnly={readOnly}
            onChange={handleFallbackChange}
            onKeyDown={handleFallbackKeyDown}
            className="flex-1 bg-[#0D1117] text-[#E6EDF3] p-2 outline-none resize-none font-mono text-xs leading-5 whitespace-pre tab-4"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      )}

      {/* Primary Monaco Editor */}
      <div className={`w-full h-full ${monacoLoaded ? 'relative z-10' : 'opacity-0 absolute inset-0'}`}>
        <Editor
          height={height}
          language={language}
          value={value}
          onChange={handleContentChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly: Boolean(readOnly),
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: 'line',
            tabSize: 4,
            insertSpaces: true,
            padding: { top: 8, bottom: 8 },
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            contextmenu: true,
            selectOnLineNumbers: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              alwaysConsumeMouseWheel: false,
            },
          }}
          loading={null}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
