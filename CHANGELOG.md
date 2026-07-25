# Changelog

All notable changes to GLConverter are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-25

### Added

- Official software screenshot (`docs/screenshot.png`) referenced from
  the `README.md`.

### Changed

- `README.md` finalized for the `v1.0.0` release: usage instructions,
  keyboard shortcuts, build/deployment steps, and copyright/contact
  information reviewed and brought up to date.
- Project marked stable: first public `v1.0.0` release, matching the
  `package.json` version.

## [0.9.0] - 2026-07-25

### Added

- Full automated test suite (Vitest): unit tests for every golfing
  technique (dead code elimination, declaration merging, loop golfing,
  ternary/`&&` conditional golfing, native call shortcuts, variable
  renaming, operator simplification), unit tests for every de-golfing
  technique (conditional expansion, loop expansion, operator expansion,
  block normalization, descriptive renaming), unit tests for the
  equivalence validator, the parser, the language detector, the
  session history store, and the JS/WASM engine bridge, and interface
  integration tests exercising the mounted application (mode and
  direction toggles, rules panel, keyboard shortcuts, engine badge).
- GitHub Pages compatibility verification script (`npm run
  verify:pages`), run automatically at the end of every production
  build, checking that every emitted asset reference is relative.
- `npm test` now runs before the build step in the GitHub Actions
  deployment workflow.

### Changed

- The Three.js background scene and the engine benchmark module are
  now loaded on demand via dynamic `import()` instead of being bundled
  into the application's initial entry chunk.
- Production build output is now split into cacheable vendor chunks
  (Three.js, CodeMirror, the AST/golfing engine) instead of a single
  monolithic bundle, reducing the initial entry chunk from roughly
  1 MB to about 36 kB and removing the Vite large-chunk warning.

## [0.8.0] - 2026-07-25

### Added

- Global keyboard shortcuts, active anywhere in the application:
  `Alt+G` toggles Golf / De-golf, `Alt+M` toggles Minified / Justified,
  `Alt+C` copies the converted code, `Alt+E` opens Export, `Alt+H`
  opens History, `Alt+B` opens Benchmark, `Alt+R` opens Rules, `Alt+I`
  opens Import, and `Escape` closes any open panel. Every corresponding
  button now shows its shortcut in a tooltip.
- Keyboard-visible focus outline applied consistently across every
  interactive element, and `aria-expanded` / `aria-haspopup` states
  kept in sync on all dropdown-style panels for assistive technology.
- Reactive Three.js background transition: the point-field background
  now animates a brief pulse (speed, size, and opacity) on every
  conversion, and respects the operating system's reduced-motion
  preference by disabling the animation entirely when requested.

### Changed

- Refined responsive breakpoints for tablet and mobile viewports: the
  header and its controls now wrap cleanly, dropdown panels
  (History, Benchmark, Export, Rules) constrain themselves to the
  viewport width instead of overflowing on narrow screens, and the
  status bar and header actions reflow on small screens.

## [0.7.0] - 2026-07-25

### Added

- Local file import: drag and drop a `.js` or `.txt` file onto the
  original editor panel, or use the new "Import" button to pick a file,
  to load its content for conversion.
- Export of the converted code as a downloadable `.js` or `.txt` file
  from the new "Export" menu in the converted panel.
- One-click "Copy" button to copy the converted code to the clipboard,
  with transient confirmation feedback.
- Session-local conversion history: every distinct edit to the original
  code is recorded (debounced) with its timestamp, direction, and
  compression ratio, browsable from the new "History" panel and
  restorable with a single click. The history is kept in memory only
  and is cleared on page reload.
- Undo / Redo controls for the original editor, exposed both as header
  buttons and through the existing keyboard shortcuts.

## [0.6.0] - 2026-07-25

### Added

- Rust engine compiled to WebAssembly, providing a high-performance
  implementation of the whitespace-compaction pass and lexical token
  counting used by the minified output and status bar.
- Transparent engine bridge: the application attempts to load the
  compiled WASM engine on startup and automatically falls back to the
  existing JavaScript implementation when the WASM module has not been
  built or fails to load, with no change in behavior or output for the
  end user.
- "Engine" badge in the header indicating whether the active engine is
  WASM or the JS fallback.
- Integrated performance benchmark panel comparing the JS and WASM
  engines on the current source across a fixed number of iterations,
  with per-task timing bars and a computed speedup factor.
- `npm run build:wasm` script compiling the Rust engine with
  `wasm-pack`, wired into the production build and into the GitHub
  Actions deployment workflow.

## [0.5.0] - 2026-07-25

### Added

- Reverse conversion (de-golfing): golfed code can now be converted back
  into structured, readable code.
- Restoration of readable variable names: identifiers are renamed
  according to their role (function names, parameters, loop counters,
  general values) instead of the original single-letter golfed names.
- Restoration of indentation and block structure: single-statement
  bodies are re-wrapped in blocks and the result is reformatted with
  clean indentation.
- Heuristic reconstruction of common golfed patterns: ternary and
  `&&`-shortcut conditionals are expanded back into `if`/`else`
  statements, countdown `for` loops are expanded back into ascending
  loops, and double-negation / falsy-literal boolean shortcuts are
  expanded back into their explicit form.
- Functional equivalence validation: after de-golfing, the reconstructed
  code is re-golfed and compared against a canonical signature of the
  original input to confirm the conversion is behavior-preserving, shown
  as an "Equivalence" status badge.
- Direction toggle in the interface to switch between "Golf" (structured
  to golfed) and "De-golf" (golfed to structured) conversion.

## [0.4.0] - 2026-07-25

### Added

- Advanced loop golfing: counting `for` loops are rewritten as reverse
  countdown loops when the loop variable is unused in the body and the
  bound is safe to evaluate once, shortening the loop header.
- Ternary and conditional golfing: `if`/`else` statements are rewritten
  as conditional (ternary) expressions for matching `return` statements
  and matching assignments, and single-branch `if` statements using an
  expression are rewritten with the `&&` short-circuit shortcut.
- Native call golfing: known JavaScript golfing shortcuts are applied
  automatically, including `Boolean(x)` to `!!x`, `indexOf` presence
  checks to `includes`, `Array.prototype` to `[]`, and `.apply(null, x)`
  calls to spread syntax.
- Configurable golfing rules panel: each golfing technique (dead code
  elimination, declaration merging, loop golfing, ternary golfing,
  native call golfing, variable renaming, operator simplification) can
  be toggled on or off independently, with the converted output
  updating immediately.
- Character count display for both the original and converted code.
- Compression score, shown as a percentage of characters saved by the
  conversion.

## [0.3.0] - 2026-07-25

### Added

- Golfing conversion pipeline applied to every conversion: minification,
  variable renaming, operator simplification, declaration merging, and
  dead code elimination.
- Minification engine: strips whitespace, newlines, and redundant
  semicolons from the converted output.
- Scope-aware variable renaming engine, assigning short identifiers
  (`a`, `b`, `c`, ...) while avoiding collisions with global references
  and reserved words.
- Operator simplification engine: converts increment/decrement patterns
  and compound arithmetic assignments to their shorter forms, and
  boolean literals to their shortest equivalent.
- Automatic merging of adjacent variable declarations of the same kind.
- Dead code elimination: removes unreachable statements, redundant pure
  expression statements, and literal `if` branches.
- Toggle button to switch the converted panel between "Minified" and
  "Justified" output modes.
- "Justified" mode: readable reformatting of the converted code with
  clean indentation.

## [0.2.0] - 2026-07-25

### Added

- Dual-pane code editor built on CodeMirror 6 (Original / Converted).
- White theme applied to the code editors, matching the interface.
- Real-time synchronization: edits in the original pane automatically
  update the converted pane.
- Automatic source language detection, with JavaScript as the priority
  language.
- Source code tokenization and AST parsing powered by Acorn.
- Status bar showing detected language, token count, and character count.

## [0.1.0] - 2026-07-25

### Added

- Initial project foundation with Vite and TypeScript.
- GitHub Pages compatible build configuration.
- Three.js background scene integrated into the interface.
- White theme baseline styling.
- Rust and WebAssembly engine skeleton for the future conversion engine.
- Initial `ConversionEngine` core module.
- Continuous deployment workflow to GitHub Pages.
- `LICENSE`, `README.md`, and `CHANGELOG.md`.
