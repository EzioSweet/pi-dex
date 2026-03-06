# PIDEX implementation plan

Status: implemented in this repository.

## Goal

Create a reusable Pi package that makes Pi feel closer to the Codex CLI while still behaving like Pi.

## Primary implementation tracks

- Codex-inspired tool rendering, especially dot-led execution summaries
- custom PIDEX footer/header chrome
- custom PIDEX editor shell
- forced PIDEX theme activation
- reusable package structure for Pi
- documented parity and known gaps

## Source references

### Pi documentation

- `docs/extensions.md`
- `docs/themes.md`
- `docs/tui.md`
- `docs/packages.md`
- `docs/keybindings.md`

### Pi examples

- `examples/extensions/built-in-tool-renderer.ts`
- `examples/extensions/minimal-mode.ts`
- `examples/extensions/custom-footer.ts`
- `examples/extensions/modal-editor.ts`
- `examples/extensions/message-renderer.ts`

### Codex references

- `.ref/codex/codex-rs/tui/src/history_cell.rs`
- `.ref/codex/codex-rs/tui/src/exec_cell/render.rs`
- `.ref/codex/codex-rs/tui/src/bottom_pane/footer.rs`
- `.ref/codex/codex-rs/tui/src/bottom_pane/chat_composer.rs`
- `.ref/codex/codex-rs/tui/src/key_hint.rs`

## Build order used

1. package scaffold
2. planning docs
3. PIDEX preferences/state
4. theme files
5. custom chrome
6. custom editor
7. built-in tool renderer overrides
8. commands and diagnostics
9. validation scripts in `package.json`

## Files to inspect first when continuing work

- `src/index.ts`
- `src/tooling.ts`
- `src/chrome.ts`
- `src/editor.ts`
- `src/prefs.ts`
- `docs/parity-checklist.md`

## What is complete

- reusable Pi package layout
- TypeScript extension entrypoint
- PIDEX dark/light themes
- forced PIDEX theme selection
- custom footer and header
- custom PIDEX editor wrapper
- Codex-inspired rendering for `bash`, `read`, `edit`, `write`, `find`, `grep`, `ls`
- PIDEX commands
- parity documentation

## Remaining stretch ideas

- more exact transcript cell parity if Pi exposes deeper renderer hooks
- richer onboarding overlay
- more exact Codex-style live status animation
- message-level assistant/user transcript re-skinning beyond tool renderers
