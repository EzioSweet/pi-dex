# Codex audit for PIDEX

## Core Codex qualities targeted

## 1. Tool rendering

Most important reference:

- `.ref/codex/codex-rs/tui/src/history_cell.rs`
- `.ref/codex/codex-rs/tui/src/exec_cell/render.rs`

Observations used in PIDEX:

- tool activity is visually compact
- the dot bullet is a big part of the identity
- summaries are shown first, detail second
- output is indented, not presented like a verbose chat bubble
- success, failure, and running states are distinguished with subtle symbols/colors

PIDEX response:

- every overridden built-in tool uses a dot-led summary line
- expanded mode reveals deeper preview content
- path/command display is shortened and normalized
- diffs are summarized before being expanded

## 2. Footer and status logic

Reference:

- `.ref/codex/codex-rs/tui/src/bottom_pane/footer.rs`
- `.ref/codex/codex-rs/tui/src/key_hint.rs`
- `.ref/codex/codex-rs/tui/src/status_indicator_widget.rs`

Observations used in PIDEX:

- footer content is context-sensitive
- compact metadata lives on one line when possible
- hints are short and low-noise

PIDEX response:

- custom footer shows PIDEX state, context, model, git branch, and cwd summary
- live tool/turn status is pushed into footer status text
- chrome avoids chatty labels

## 3. Composer feel

Reference:

- `.ref/codex/codex-rs/tui/src/bottom_pane/chat_composer.rs`

Observations used in PIDEX:

- compact composer chrome matters more than decorative styling
- hints should be subtle
- the bottom pane should feel like an operator console, not a chat app

PIDEX response:

- custom editor wrapper adds a PIDEX status label to the bottom border
- compact mode is the default
- tool output defaults to collapsed for a more Codex-like shell feel

## 4. Visual tone

Reference:

- Codex CLI screenshots in `.ref/codex/README.md`

Observations used in PIDEX:

- restrained accent usage
- dark neutral surfaces
- compact transcript density
- subtle separators and dim hints

PIDEX response:

- custom PIDEX dark/light themes
- subtler tool panel colors
- dimmed metadata and compact summaries

## 5. Areas intentionally approximated

Because Pi extensions do not replace every internal transcript cell:

- assistant/user base message chrome is only partially stylable
- full Codex transcript parity is approximated through theme + footer + editor + tool renderers
- exact Codex footer collapse heuristics are approximated rather than cloned one-to-one
