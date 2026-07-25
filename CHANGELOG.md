# Changelog

All notable changes to GLConverter are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
