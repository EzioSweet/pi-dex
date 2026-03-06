import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Box, Text } from "@mariozechner/pi-tui";

import { applyPidexChrome, buildPidexInfoMessage } from "./chrome";
import { DEFAULT_PREFS, PIDEX_PREFS_ENTRY, loadPrefs, type PidexDensity, type PidexPrefs, type PidexThemeName } from "./prefs";
import { registerPidexTools } from "./tooling";

function persistPrefs(pi: ExtensionAPI, prefs: PidexPrefs): void {
	pi.appendEntry(PIDEX_PREFS_ENTRY, prefs);
}

function isPidexTheme(name: string | undefined): boolean {
	return name === "pidex-dark" || name === "pidex-light";
}

function installPidex(pi: ExtensionAPI, ctx: ExtensionContext, prefs: PidexPrefs): void {
	applyPidexChrome(ctx, prefs, () => pi.getThinkingLevel());
}

function refreshPidex(pi: ExtensionAPI, ctx: ExtensionContext, prefs: PidexPrefs): void {
	installPidex(pi, ctx, prefs);
	setTimeout(() => installPidex(pi, ctx, prefs), 0);
}

function sendInfoMessage(pi: ExtensionAPI, title: string, content: string): void {
	pi.sendMessage({
		customType: "pidex-info",
		content,
		display: true,
		details: { title },
	});
}

function parseThemeArg(arg: string): PidexThemeName | undefined {
	const normalized = arg.trim().toLowerCase();
	if (normalized === "dark" || normalized === "pidex-dark") return "pidex-dark";
	if (normalized === "light" || normalized === "pidex-light") return "pidex-light";
	return undefined;
}

function parseDensityArg(arg: string): PidexDensity | undefined {
	const normalized = arg.trim().toLowerCase();
	if (normalized === "compact") return "compact";
	if (normalized === "comfortable" || normalized === "normal") return "comfortable";
	return undefined;
}

export default function pidexExtension(pi: ExtensionAPI): void {
	let prefs: PidexPrefs = { ...DEFAULT_PREFS };
	let previousThemeName: string | null = null;

	registerPidexTools(pi);

	pi.registerMessageRenderer("pidex-info", (message, _options, theme) => {
		const title = (message.details as { title?: string } | undefined)?.title ?? "PIDEX";
		const box = new Box(1, 1, (text) => theme.bg("customMessageBg", text));
		box.addChild(new Text(theme.fg("customMessageLabel", theme.bold(title)), 0, 0));
		box.addChild(new Text(theme.fg("customMessageText", String(message.content ?? "")), 0, 0));
		return box;
	});

	pi.registerCommand("pidex", {
		description: "Show PIDEX status and active preferences",
		handler: async (_args, ctx) => {
			sendInfoMessage(pi, "PIDEX status", buildPidexInfoMessage(ctx, prefs));
		},
	});

	pi.registerCommand("pidex-theme", {
		description: "Switch PIDEX theme: dark|light",
		getArgumentCompletions: (prefix) => {
			const values = ["dark", "light"].filter((item) => item.startsWith(prefix));
			return values.length > 0 ? values.map((value) => ({ value, label: value })) : null;
		},
		handler: async (args, ctx) => {
			const themeName = parseThemeArg(args);
			if (!themeName) {
				ctx.ui.notify("Usage: /pidex-theme dark|light", "warning");
				return;
			}
			prefs = { ...prefs, themeName };
			persistPrefs(pi, prefs);
			installPidex(pi, ctx, prefs);
			ctx.ui.notify(`PIDEX theme set to ${themeName}`, "info");
		},
	});

	pi.registerCommand("pidex-density", {
		description: "Switch PIDEX density: compact|comfortable",
		getArgumentCompletions: (prefix) => {
			const values = ["compact", "comfortable"].filter((item) => item.startsWith(prefix));
			return values.length > 0 ? values.map((value) => ({ value, label: value })) : null;
		},
		handler: async (args, ctx) => {
			const density = parseDensityArg(args);
			if (!density) {
				ctx.ui.notify("Usage: /pidex-density compact|comfortable", "warning");
				return;
			}
			prefs = { ...prefs, density };
			persistPrefs(pi, prefs);
			installPidex(pi, ctx, prefs);
			ctx.ui.notify(`PIDEX density set to ${density}`, "info");
		},
	});

	pi.registerCommand("pidex-reset", {
		description: "Restore PIDEX defaults",
		handler: async (_args, ctx) => {
			prefs = { ...DEFAULT_PREFS };
			persistPrefs(pi, prefs);
			installPidex(pi, ctx, prefs);
			ctx.ui.notify("PIDEX reset to defaults", "info");
		},
	});

	pi.registerCommand("pidex-doctor", {
		description: "Show a quick PIDEX diagnostic report",
		handler: async (_args, ctx) => {
			const themeList = ctx.ui.getAllThemes().map((theme) => theme.name);
			const lines = [
				`Active PIDEX theme: ${prefs.themeName}`,
				`Installed themes: ${themeList.includes("pidex-dark") && themeList.includes("pidex-light") ? "ok" : "missing PIDEX theme files"}`,
				`Density: ${prefs.density}`,
				`Compact tools: ${prefs.compactTools ? "on" : "off"}`,
				`Active tools: ${pi.getActiveTools().join(", ")}`,
				`Header enabled: ${prefs.showHeader ? "yes" : "no"}`,
				`Force theme: ${prefs.forceTheme ? "yes" : "no"}`,
			];
			sendInfoMessage(pi, "PIDEX doctor", lines.join("\n"));
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		prefs = loadPrefs(ctx.sessionManager.getEntries() as Array<{ type?: string; customType?: string; data?: unknown }>);
		if (!previousThemeName && !isPidexTheme(ctx.ui.theme.name)) {
			previousThemeName = ctx.ui.theme.name ?? null;
		}
		refreshPidex(pi, ctx, prefs);
	});

	pi.on("session_switch", async (_event, ctx) => {
		if (!previousThemeName && !isPidexTheme(ctx.ui.theme.name)) {
			previousThemeName = ctx.ui.theme.name ?? null;
		}
		refreshPidex(pi, ctx, prefs);
	});

	pi.on("session_fork", async (_event, ctx) => {
		if (!previousThemeName && !isPidexTheme(ctx.ui.theme.name)) {
			previousThemeName = ctx.ui.theme.name ?? null;
		}
		refreshPidex(pi, ctx, prefs);
	});

	pi.on("model_select", async (_event, ctx) => {
		refreshPidex(pi, ctx, prefs);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		if (previousThemeName) {
			ctx.ui.setTheme(previousThemeName);
		}
	});

	pi.on("input", async (event) => {
		if (event.source === "extension") return { action: "continue" as const };
		if (!event.text.trim()) return { action: "continue" as const };
		if (event.text.startsWith("/") || event.text.startsWith("!")) return { action: "continue" as const };
		if (event.text.startsWith("› ")) return { action: "continue" as const };
		return event.images
			? { action: "transform" as const, text: `› ${event.text}`, images: event.images }
			: { action: "transform" as const, text: `› ${event.text}` };
	});

	pi.on("context", async (event) => {
		const messages = event.messages.map((message) => {
			if (message.role === "user" && typeof message.content === "string" && message.content.startsWith("› ")) {
				return { ...message, content: message.content.slice(2) };
			}
			if (message.role === "user" && Array.isArray(message.content)) {
				return {
					...message,
					content: message.content.map((item, index) =>
						index === 0 && item.type === "text" && item.text.startsWith("› ") ? { ...item, text: item.text.slice(2) } : item,
					),
				};
			}
			return message;
		});
		return { messages };
	});
}
