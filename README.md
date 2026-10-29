<div align="center">

# pi-dex

[![License](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](./LICENSE)
[![Pi package](https://img.shields.io/badge/pi-package-111111?style=flat-square)](https://pi.dev)
[![GitHub](https://img.shields.io/badge/github-EzioSweet%2Fpi--dex-111111?style=flat-square&logo=github)](https://github.com/EzioSweet/pi-dex)

_Pi, but with Codex's UI - or at least as far as I can go before forking it._

</div>

> **Maintained fork.** The original repository
> [maria-rcks/pi-dex](https://github.com/maria-rcks/pi-dex) has been archived.
> This fork keeps pi-dex working with current Pi releases — most recently, a fix
> for a crash on Pi 1.4.0 where `renderCall` returning `undefined` produced
> `Cannot read properties of undefined (reading 'render')` in the tool renderer.

## Install

```bash
pi install git:github.com/EzioSweet/pi-dex
# or, for a local checkout
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
bun run fmt
bun run lint
bun run typecheck
bun run pack:dry
```

## Notes

- This package intentionally targets the extension boundary, so some Codex UI details are approximated rather than replaced at the renderer core.
- Planning and parity notes live in `docs/`.

## Links

- Repository: https://github.com/EzioSweet/pi-dex
- Issues: https://github.com/EzioSweet/pi-dex/issues
- Original (archived): https://github.com/maria-rcks/pi-dex
