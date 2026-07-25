# Changelog

All notable changes to GLConverter are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
