# PIDEX parity checklist

## Package structure

- [x] reusable Pi package layout
- [x] root `index.ts` export
- [x] `package.json` with Pi manifest
- [x] docs written in `.md`

## Visual system

- [x] `pidex-dark` theme
- [x] `pidex-light` theme
- [x] forced PIDEX theme activation
- [x] compact chrome defaults

## Chrome

- [x] custom footer
- [x] custom header
- [x] custom editor wrapper
- [x] compact default tool expansion state

## Tool rendering

- [x] `bash`
- [x] `read`
- [x] `edit`
- [x] `write`
- [x] `find`
- [x] `grep`
- [x] `ls`
- [x] dot-led summaries modeled after Codex feel

## Commands

- [x] `/pidex`
- [x] `/pidex-theme`
- [x] `/pidex-density`
- [x] `/pidex-reset`
- [x] `/pidex-doctor`

## Intentional approximations

- [x] full Codex transcript parity replaced with Pi-compatible approximation
- [x] footer heuristics simplified while preserving Codex-like compactness
- [x] editor behavior tuned without reimplementing all Pi input internals

## Known gaps

- assistant/user transcript base cells still depend on Pi internals
- exact Codex layout transitions at every terminal width are not fully cloneable from extension hooks alone
- true Codex transcript overlay parity would likely need deeper Pi renderer hooks
