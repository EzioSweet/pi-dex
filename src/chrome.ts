import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { AssistantMessage } from "@mariozechner/pi-ai";
import { VERSION, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

import { PidexEditor } from "./editor";
import type { PidexPrefs } from "./prefs";

const PI_VERSION = VERSION;

function basename(path: string): string {
	const normalized = path.replace(/\/$/, "");
	const parts = normalized.split("/");
	return parts[parts.length - 1] || path;
}

function fitVisible(text: string, width: number): string {
	const truncated = truncateToWidth(text, width);
	return truncated + " ".repeat(Math.max(0, width - visibleWidth(truncated)));
}

function formatThinking(level: ThinkingLevel): string {
	return level === "off" ? "standard" : level;
}

function formatContextLeft(percent: number | null | undefined): string | undefined {
	if (percent == null) return undefined;
	const left = Math.max(0, Math.min(100, Math.round(100 - percent)));
	return `${left}% left`;
}

export function applyPidexChrome(ctx: ExtensionContext, prefs: PidexPrefs, getThinkingLevel: () => ThinkingLevel): void {
	if (prefs.forceTheme) ctx.ui.setTheme(prefs.themeName);
	ctx.ui.setToolsExpanded(!prefs.compactTools);
	ctx.ui.setEditorComponent((tui, theme, keybindings) => {
		const editor = new PidexEditor(tui, theme, keybindings);
		editor.setPrefs(prefs);
		return editor;
	});
	ctx.ui.setHeader(
		prefs.showHeader
			? (_tui, theme) => ({
				invalidate() {},
				render(width: number): string[] {
					const boxWidth = width >= 54 ? 50 : Math.max(24, width);
					const model = ctx.model?.id ?? "no-model";
					const thinking = formatThinking(getThinkingLevel());
					const leftPad = "";
					const border = (text: string) => theme.fg("borderAccent", text);
					const top = leftPad + border(`╭${"─".repeat(Math.max(0, boxWidth - 2))}╮`);
					const line1 =
						leftPad +
						border("│") +
						fitVisible(` ${theme.fg("dim", ">_")} ${theme.bold("PIDEX")} ${theme.fg("dim", `(v${PI_VERSION})`)}`, boxWidth - 2) +
						border("│");
					const gap = leftPad + border("│") + fitVisible("", boxWidth - 2) + border("│");
					const line2 =
						leftPad +
						border("│") +
						fitVisible(
							` ${theme.fg("dim", "model:".padEnd(11))}${model} ${thinking}${theme.fg("accent", "    /model")}${theme.fg("dim", " to change")}`,
							boxWidth - 2,
						) +
						border("│");
					const line3 =
						leftPad +
						border("│") +
						fitVisible(` ${theme.fg("dim", "directory:".padEnd(11))}${basename(ctx.cwd)}`, boxWidth - 2) +
						border("│");
					const bottom = leftPad + border(`╰${"─".repeat(Math.max(0, boxWidth - 2))}╯`);
					return [top, line1, gap, line2, line3, bottom];
				},
			})
			: undefined,
	);
	ctx.ui.setFooter((tui, theme, footerData) => {
		const unsubscribe = footerData.onBranchChange(() => tui.requestRender());
		return {
			dispose: unsubscribe,
			invalidate() {},
			render(width: number): string[] {
				const modelId = ctx.model?.id ?? "no-model";
				const thinking = formatThinking(getThinkingLevel());
				const contextUsage = ctx.getContextUsage();
				const line = theme.fg(
					"dim",
					[
						`${modelId} ${thinking}`,
						formatContextLeft(contextUsage?.percent),
						basename(ctx.cwd),
					]
						.filter((part): part is string => Boolean(part))
						.join(" · "),
				);
				return [truncateToWidth(line, width)];
			},
		};
	});
}

export function buildPidexInfoMessage(ctx: ExtensionContext, prefs: PidexPrefs): string {
	let input = 0;
	let output = 0;
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "message" && entry.message.role === "assistant") {
			const assistant = entry.message as AssistantMessage;
			input += assistant.usage.input;
			output += assistant.usage.output;
		}
	}
	const contextUsage = ctx.getContextUsage();
	const lines = [
		`Theme: ${prefs.themeName}`,
		`Density: ${prefs.density}`,
		`Compact tools: ${prefs.compactTools ? "on" : "off"}`,
		`Forced theme: ${prefs.forceTheme ? "on" : "off"}`,
		`CWD: ${ctx.cwd}`,
		`Model: ${ctx.model?.id ?? "none"}`,
		`Context: ${contextUsage?.tokens ?? "unknown"}/${contextUsage?.contextWindow ?? "unknown"}`,
		`Assistant tokens: ↑${input} ↓${output}`,
	];
	return lines.join("\n");
}
