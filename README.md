# CodeToTelugu — Professional Python Learning IDE

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-Dark_IDE-238636.svg)](https://microsoft.github.io/monaco-editor/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing_29_Tests-success.svg)](https://vitest.dev/)

**CodeToTelugu** is a developer tool and learning IDE inspired by VS Code, GitHub, and Linear. It helps Telugu-speaking beginners understand Python code by translating selected programming keywords into Romanized Telugu and explaining the program's logic step-by-step in conversational Telugu using Google Gemini and browser audio synthesis.

---

## 🎨 IDE Design System

The interface adheres strictly to a flat, professional developer tool aesthetic:

- **Application background**: `#0D1117`
- **Panel background**: `#161B22`
- **Secondary surface**: `#1C2128`
- **Borders & dividers**: `#30363D`
- **Primary text**: `#E6EDF3`
- **Secondary text**: `#8B949E`
- **Primary action**: `#238636` (hover: `#2EA043`)
- **Links & focus indicators**: `#58A6FF`
- **Error**: `#F85149`
- **Success**: `#3FB950`

**Restraints Enforced**:
- Solid, flat surfaces only. Zero gradients, zero neon/glowing borders, zero glassmorphism.
- Zero emojis anywhere in the user interface.
- Typography: **Inter** for UI, **JetBrains Mono** for code.
- Left-aligned, compact headings; no oversized marketing hero sections or decorative cards.

---

## 🛠️ Key Features & Architecture

### 1. Application Toolbar (`src/components/AppToolbar.jsx`)
- Height: 48px, compact, sticky top toolbar.
- **Functional File Menu**: `New Translation` (resets workspace), `Clear Code`.
- **Functional Edit Menu**: `Copy Original Code`, `Select All` (selects all text in Monaco).
- **Functional Translate Menu**: `Translate to Telugu`, `Open Dictionary`, `API Key Settings`.
- Workspace indicator: `Python Workspace`.
- Language selector: `Telugu (Active)`.
- Status indicator: `Ready` with solid green dot `#3FB950`.

### 2. Main Editor Panel (`src/pages/Home.jsx`)
- Compact, left-aligned heading: `Python Workspace`.
- Filename tab: `main.py` with line count, character count, and clear code action (`src/components/EditorTabs.jsx`).
- Monaco Editor configured with Python syntax highlighting, GitHub Dark theme, JetBrains Mono font, line numbers, word wrapping, and cursor position tracking (`Ln X, Col Y`).
- Preloaded with working starter code:
  ```python
  name = input("Enter your name: ")

  if name:
      print("Hello", name)
  else:
      print("No name entered")
  ```
- Primary Action: Left-aligned, solid green button (`#238636`):
  `Translate to Telugu / Telugu lo ki Marchu`.
- Synchronous new-tab handoff via unique `localStorage` request IDs (`codetotelugu:request:<id>`).

### 3. Side-by-Side Comparison Workspace (`src/pages/Translate.jsx`)
- Left-aligned header with breadcrumbs (`CodeToTelugu / Translation`) and title `Code Translation`.
- Actions: `New Translation`, `Copy Original`, `Copy Translation`.
- Desktop: Two equal panels side by side; Mobile: stacked vertically.
- Left Panel: `main.py` (Original Code - English) — read-only Monaco Editor.
- Right Panel: `main.te.py` (Translated Code - Telugu) — read-only Monaco Editor with Telugu learning representation and subtle notice: `Educational translation — not executable Python`.

### 4. Logic Explanation — Engineering Documentation (`src/components/ExplanationSection.jsx`)
- Modeled after GitHub Docs / Linear reference layouts.
- Solid `#161B22` background, `#30363D` borders, minimal rounded corners.
- Compact header: `Ee Code Em Chestundi? / Logic Explanation`.
- Numbered vertical list with narrow left column for step numbers, subtle vertical green divider, and fine horizontal separators.
- Relevant code references formatted in JetBrains Mono with quick-copy actions.

### 5. Global Audio Player (`src/components/SpeechControls.jsx`)
- Single unified audio player for the entire explanation.
- Label: `Vinandi (Listen)`.
- Play, Pause/Resume, Stop controls, speed adjustment (0.8x, 1.0x, 1.2x).
- Speech synthesis preferring `te-IN` voice with smart fallback voice selector.
- Zero speaker icons on individual steps to eliminate visual clutter.

### 6. Telugu Keyword Translation Engine (`src/dictionary/telugu.json`, `src/utils/translator.js`)
- Python-aware lexical scanner/tokenizer.
- **Protects**: strings, comments, numbers, indentation, variable names (`gift`, `inside`, `android`, `printer`), and function definitions.
- Single source of truth: `src/dictionary/telugu.json`:
  - `if` $\rightarrow$ `oka vela`
  - `else` $\rightarrow$ `lekapothe`
  - `elif` $\rightarrow$ `lekapothe oka vela ayithe`
  - `for` $\rightarrow$ `prathi daniki`
  - `while` $\rightarrow$ `varaku`
  - `print` $\rightarrow$ `chupinchu`
  - `input` $\rightarrow$ `adugu`
  - `def` $\rightarrow$ `nirvachinchu`
  - `return` $\rightarrow$ `tirigi ivvu`
  - `in` $\rightarrow$ `lo`
  - `and` $\rightarrow$ `mariyu`
  - `or` $\rightarrow$ `leda`
  - `True` $\rightarrow$ `Nijam`
  - `False` $\rightarrow$ `Abaddham`

### 7. Gemini AI Integration (`src/services/gemini.js`)
- Uses official unified `@google/genai` SDK (`^2.29.0`).
- Model: `gemini-3-flash-preview` (Gemini 3 Flash API) with automatic normalizer and fallback.
- Structured JSON output with friendly Telugu coding teacher prompt.
- Reads `VITE_GEMINI_API_KEY` from local `.env` or in-app modal (never logged or exposed in UI).
- Local caching by code hash (`src/utils/codeHash.js`) to avoid redundant API usage.
- Production serverless proxy template provided at `api/explain.js`.

---

## 🧪 Testing

Ran automated Vitest test suites:

```bash
npm test
```

```text
 ✓ src/test/translator.test.js (14 tests)
 ✓ src/test/gemini.test.js (7 tests)
 ✓ src/test/storage.test.js (6 tests)
 ✓ src/test/speech.test.js (2 tests)

 Test Files  4 passed (4)
      Tests  29 passed (29)
   Duration  1.09s
```

Run production build:
```bash
npm run build
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure Gemini API key (optional)
cp .env.example .env
# Edit .env and enter your VITE_GEMINI_API_KEY

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173/
```

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `npm run build` (auto-detected).
5. Output Directory: `dist` (auto-detected).
6. Under **Environment Variables**, add:
   - `VITE_GEMINI_API_KEY`: Your Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
   - `VITE_GEMINI_MODEL`: `gemini-3-flash-preview`
   - `GEMINI_API_KEY`: (Optional) For serverless `/api/explain` proxy
   - `GEMINI_MODEL`: `gemini-3-flash-preview`
7. Click **Deploy**.

