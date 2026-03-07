# Pi capability matrix for PIDEX

| Codex behavior                                                    | Pi hook                                             | Feasibility | PIDEX implementation       |
| ----------------------------------------------------------------- | --------------------------------------------------- | ----------: | -------------------------- |
| Compact built-in tool rendering                                   | `pi.registerTool()` + `renderCall` + `renderResult` |        High | Implemented                |
| Dot-led execution summaries                                       | custom tool renderers                               |        High | Implemented                |
| Custom footer                                                     | `ctx.ui.setFooter()`                                |        High | Implemented                |
| Custom header                                                     | `ctx.ui.setHeader()`                                |        High | Implemented                |
| Custom editor shell                                               | `ctx.ui.setEditorComponent()` + `CustomEditor`      |        High | Implemented                |
| Force PIDEX theme                                                 | `ctx.ui.setTheme()`                                 |        High | Implemented                |
| Tool output collapsed by default                                  | `ctx.ui.setToolsExpanded()`                         |        High | Implemented                |
| Live working/tool status                                          | `ctx.ui.setStatus()` + lifecycle events             |        High | Implemented                |
| Session diagnostics command                                       | `pi.registerCommand()`                              |        High | Implemented                |
| Full Codex transcript cell replacement                            | not fully exposed                                   |     Partial | Approximated               |
| Exact Codex layout heuristics in every width state                | partial extension control                           |     Partial | Approximated               |
| Full internal message renderer parity for assistant/user messages | limited                                             |     Partial | Theme/chrome approximation |

## Key Pi references used

- extension lifecycle events in `docs/extensions.md`
- footer/header/editor APIs in `docs/extensions.md`
- custom component rules in `docs/tui.md`
- theme packaging in `docs/themes.md`
- Pi package structure in `docs/packages.md`

## Conclusion

PIDEX can get close to Codex where Pi exposes extension hooks:

- tools
- footer/header
- editor
- theme
- commands
- status

PIDEX must approximate areas where Pi keeps core transcript rendering internal.
