<div align="center">

# pi-dex

[![License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](./LICENSE)
[![Pi package](https://img.shields.io/badge/pi-package-111111?style=flat-square)](https://pi.dev)
[![GitHub](https://img.shields.io/badge/github-maria--rcks%2Fpi--dex-111111?style=flat-square&logo=github)](https://github.com/maria-rcks/pi-dex)

_Pi, but with Codex's UI - or at least as far as I can go before forking it._
</div>

## Install

Use whichever source you prefer:

```bash
pi install npm:pi-dex
# or
pi install git:github.com/maria-rcks/pi-dex
# or
pi install /absolute/path/to/pi-dex
```

For local development only:

```bash
pi -e .
```

## What this package does

- Re-styles Pi with bundled PIDEX dark/light themes.
- Adds a Codex-inspired top card and footer.
- Re-renders built-in tools with more compact transcript output.
- Prefixes user prompts visually in a more Codex-like way.
- Keeps everything in an extension package instead of a Pi fork.

## Commands

- `/pidex` - show PIDEX status
- `/pidex-theme dark|light` - switch theme variant
- `/pidex-density compact|comfortable` - switch layout density
- `/pidex-reset` - restore defaults
- `/pidex-doctor` - show a quick diagnostic report

## Development

```bash
bun run lint
bun run typecheck
bun run pack:dry
```

## Notes

- This package intentionally targets the extension boundary, so some Codex UI details are approximated rather than replaced at the renderer core.
- Planning and parity notes live in `docs/`.

## Links

- Repository: https://github.com/maria-rcks/pi-dex
- Issues: https://github.com/maria-rcks/pi-dex/issues
