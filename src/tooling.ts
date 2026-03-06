import type {
	BashToolDetails,
	EditToolDetails,
	ExtensionAPI,
	FindToolDetails,
	GrepToolDetails,
	LsToolDetails,
	ReadToolDetails,
} from "@mariozechner/pi-coding-agent";
import {
	createBashTool,
	createEditTool,
	createFindTool,
	createGrepTool,
	createLsTool,
	createReadTool,
	createWriteTool,
} from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

import {
	cleanOutputLines,
	countPrefixedItems,
	diffStats,
	formatDuration,
	formatLineLabel,
	joinMeta,
	lineCount,
	previewLines,
	renderToolSummary,
	shortenCommand,
	shortenPath,
} from "./format";

type BuiltInTools = ReturnType<typeof createBuiltInTools>;

type PidexMeta<TArgs = Record<string, unknown>> = {
	tool: string;
	args: TArgs;
	durationMs: number;
};

type DetailsWithPidexMeta<TDetails, TArgs = Record<string, unknown>> = TDetails & {
	pidexMeta?: PidexMeta<TArgs>;
};

const toolCache = new Map<string, BuiltInTools>();

function createBuiltInTools(cwd: string) {
	return {
		bash: createBashTool(cwd),
		read: createReadTool(cwd),
		edit: createEditTool(cwd),
		write: createWriteTool(cwd),
		find: createFindTool(cwd),
		grep: createGrepTool(cwd),
		ls: createLsTool(cwd),
	};
}

function getTools(cwd: string): BuiltInTools {
	let tools = toolCache.get(cwd);
	if (!tools) {
		tools = createBuiltInTools(cwd);
		toolCache.set(cwd, tools);
	}
	return tools;
}

function withPidexMeta<TDetails extends object, TArgs extends Record<string, unknown>>(
	details: TDetails | undefined,
	tool: string,
	args: TArgs,
	durationMs: number,
): DetailsWithPidexMeta<TDetails, TArgs> {
	return {
		...(details ?? ({} as TDetails)),
		pidexMeta: {
			tool,
			args,
			durationMs,
		},
	};
}

function getPidexMeta<TDetails extends object, TArgs extends Record<string, unknown>>(
	details: TDetails | undefined,
): PidexMeta<TArgs> | undefined {
	if (!details || typeof details !== "object") return undefined;
	return (details as DetailsWithPidexMeta<TDetails, TArgs>).pidexMeta;
}

function getTextContent(result: { content: Array<{ type: string; text?: string }> }): string {
	const item = result.content.find((content) => content.type === "text");
	return item?.text ?? "";
}

function renderOutputPreview(theme: any, lines: string[], maxLines: number): string {
	const subset = lines.slice(0, maxLines);
	let text = subset.map((line) => theme.fg("toolOutput", `  ${line}`)).join("\n");
	if (lines.length > maxLines) {
		text += `\n${theme.fg("muted", `  … +${lines.length - maxLines} more`)}`;
	}
	return text;
}

function renderVerticalPreview(theme: any, lines: string[], maxLines: number): string {
	const subset = lines.slice(0, maxLines);
	let text = subset.map((line) => `${theme.fg("muted", "│")} ${theme.fg("toolOutput", line)}`).join("\n");
	if (lines.length > maxLines) {
		text += `\n${theme.fg("muted", "│")} ${theme.fg("muted", `… +${lines.length - maxLines} more lines`)}`;
	}
	return text;
}

function renderDiffPreview(theme: any, diff: string, maxLines: number): string {
	const lines = diff.split("\n").slice(0, maxLines);
	let out = "";
	for (const line of lines) {
		const styled = line.startsWith("+") && !line.startsWith("+++")
			? theme.fg("toolDiffAdded", `  ${line}`)
			: line.startsWith("-") && !line.startsWith("---")
				? theme.fg("toolDiffRemoved", `  ${line}`)
				: theme.fg("toolDiffContext", `  ${line}`);
		out += (out ? "\n" : "") + styled;
	}
	if (diff.split("\n").length > maxLines) {
		out += `\n${theme.fg("muted", `  … +${diff.split("\n").length - maxLines} more`)}`;
	}
	return out;
}

function lineRange(offset?: number, limit?: number): string | undefined {
	if (offset == null && limit == null) return undefined;
	const start = offset ?? 1;
	if (limit == null) return `${start}`;
	return `${start}-${start + limit - 1}`;
}

function summarizeCount(text: string): number {
	return text.split("\n").filter((line) => line.trim().length > 0).length;
}

export function summarizeToolForStatus(toolName: string, args: Record<string, unknown>): string {
	switch (toolName) {
		case "bash":
			return `bash ${shortenCommand(String(args.command ?? ""), 52)}`;
		case "read": {
			const path = shortenPath(String(args.path ?? ""), 42);
			const range = lineRange(args.offset as number | undefined, args.limit as number | undefined);
			return range ? `read ${path}:${range}` : `read ${path}`;
		}
		case "edit":
			return `edit ${shortenPath(String(args.path ?? ""), 42)}`;
		case "write":
			return `write ${shortenPath(String(args.path ?? ""), 42)}`;
		case "find":
			return `find ${String(args.pattern ?? "")}`;
		case "grep":
			return `grep ${String(args.pattern ?? "")}`;
		case "ls":
			return `ls ${shortenPath(String(args.path ?? "."), 42)}`;
		default:
			return toolName;
	}
}

export function registerPidexTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "bash",
		label: "bash",
		description: getTools(process.cwd()).bash.description,
		parameters: getTools(process.cwd()).bash.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).bash.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as BashToolDetails | undefined, "bash", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			const command = shortenCommand(args.command || "");
			const timeout = (args.timeout as number | undefined) ? theme.fg("dim", ` · timeout ${args.timeout}s`) : "";
			return new Text(`${theme.fg("accent", "•")} ${theme.fg("toolTitle", "Running ")}${theme.fg("accent", command)}${theme.fg("toolTitle", " in bash")}${timeout}`, 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			const details = (result.details ?? {}) as DetailsWithPidexMeta<BashToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<BashToolDetails, Record<string, unknown>>(details);
			const command = shortenCommand(String(meta?.args.command ?? ""));
			if (isPartial) {
				return new Text(`${theme.fg("accent", "•")} ${theme.fg("toolTitle", "Running ")}${theme.fg("accent", command)}${theme.fg("toolTitle", " in bash")}`, 0, 0);
			}
			const output = getTextContent(result as any);
			const outputLines = cleanOutputLines(output);
			const exitMatch = output.match(/exit code:\s*(-?\d+)/i);
			const exitCode = exitMatch ? Number.parseInt(exitMatch[1] ?? "0", 10) : 0;
			const bullet = exitCode === 0 ? theme.fg("success", "•") : theme.fg("error", "•");
			const summary = joinMeta([
				formatLineLabel(outputLines.length, "line"),
				formatDuration(meta?.durationMs),
				details.truncation?.truncated ? "truncated" : undefined,
			]);
			let text = `${bullet} ${theme.fg("toolTitle", "Ran ")}${theme.fg("accent", command)}`;
			if (summary) text += theme.fg("dim", ` · ${summary}`);
			if (expanded && outputLines.length > 0) text += `\n${renderVerticalPreview(theme, outputLines, 10)}`;
			return new Text(text, 0, 0);
		},
	});

	pi.registerTool({
		name: "read",
		label: "read",
		description: getTools(process.cwd()).read.description,
		parameters: getTools(process.cwd()).read.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).read.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as ReadToolDetails | undefined, "read", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			const subject = lineRange(args.offset, args.limit)
				? `${shortenPath(args.path || "")}:${lineRange(args.offset, args.limit)}`
				: shortenPath(args.path || "");
			return new Text(renderToolSummary(theme, "pending", "read", subject, undefined), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "read", "loading", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<ReadToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<ReadToolDetails, Record<string, unknown>>(details);
			const subjectBase = shortenPath(String(meta?.args.path ?? ""));
			const subject = lineRange(meta?.args.offset as number | undefined, meta?.args.limit as number | undefined)
				? `${subjectBase}:${lineRange(meta?.args.offset as number | undefined, meta?.args.limit as number | undefined)}`
				: subjectBase;
			const first = result.content[0];
			if (first?.type === "image") {
				return new Text(
					renderToolSummary(theme, "success", "read", subject, joinMeta(["image", formatDuration(meta?.durationMs)])),
					0,
					0,
				);
			}
			const textContent = getTextContent(result as any);
			const lines = textContent.split("\n");
			let text = renderToolSummary(
				theme,
				"success",
				"read",
				subject,
				joinMeta([
					formatLineLabel(lines.length, "line"),
					formatDuration(meta?.durationMs),
					details.truncation?.truncated ? `from ${details.truncation.totalLines}` : undefined,
				]),
			);
			if (expanded && textContent.length > 0) text += `\n${renderOutputPreview(theme, previewLines(textContent, 14), 14)}`;
			return new Text(text, 0, 0);
		},
	});

	pi.registerTool({
		name: "edit",
		label: "edit",
		description: getTools(process.cwd()).edit.description,
		parameters: getTools(process.cwd()).edit.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).edit.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as EditToolDetails | undefined, "edit", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			return new Text(renderToolSummary(theme, "pending", "edit", shortenPath(args.path || ""), undefined), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "edit", "applying", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<EditToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<EditToolDetails, Record<string, unknown>>(details);
			const textContent = getTextContent(result as any);
			if (/^error/i.test(textContent.trim())) {
				return new Text(renderToolSummary(theme, "error", "edit", shortenPath(String(meta?.args.path ?? "")), textContent.split("\n")[0]), 0, 0);
			}
			const stats = details.diff ? diffStats(details.diff) : { additions: 0, removals: 0 };
			let text = renderToolSummary(
				theme,
				"success",
				"edit",
				shortenPath(String(meta?.args.path ?? "")),
				joinMeta([`+${stats.additions}`, `-${stats.removals}`, formatDuration(meta?.durationMs)]),
			);
			if (expanded && details.diff) text += `\n${renderDiffPreview(theme, details.diff, 18)}`;
			return new Text(text, 0, 0);
		},
	});

	pi.registerTool({
		name: "write",
		label: "write",
		description: getTools(process.cwd()).write.description,
		parameters: getTools(process.cwd()).write.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).write.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as Record<string, never> | undefined, "write", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			return new Text(
				renderToolSummary(theme, "pending", "write", shortenPath(args.path || ""), formatLineLabel(lineCount(args.content || ""), "line")),
				0,
				0,
			);
		},
		renderResult(result, { isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "write", "writing", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<Record<string, never>, Record<string, unknown>>;
			const meta = getPidexMeta<Record<string, never>, Record<string, unknown>>(details);
			const textContent = getTextContent(result as any);
			if (/^error/i.test(textContent.trim())) {
				return new Text(renderToolSummary(theme, "error", "write", shortenPath(String(meta?.args.path ?? "")), textContent.split("\n")[0]), 0, 0);
			}
			return new Text(
				renderToolSummary(
					theme,
					"success",
					"write",
					shortenPath(String(meta?.args.path ?? "")),
					joinMeta([formatLineLabel(lineCount(String(meta?.args.content ?? "")), "line"), formatDuration(meta?.durationMs)]),
				),
				0,
				0,
			);
		},
	});

	pi.registerTool({
		name: "find",
		label: "find",
		description: getTools(process.cwd()).find.description,
		parameters: getTools(process.cwd()).find.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).find.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as FindToolDetails | undefined, "find", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			return new Text(renderToolSummary(theme, "pending", "find", String(args.pattern ?? ""), args.path ? shortenPath(args.path) : undefined), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "find", "searching", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<FindToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<FindToolDetails, Record<string, unknown>>(details);
			const textContent = getTextContent(result as any);
			const count = summarizeCount(textContent);
			let text = renderToolSummary(
				theme,
				"success",
				"find",
				String(meta?.args.pattern ?? ""),
				joinMeta([formatLineLabel(count, "match"), formatDuration(meta?.durationMs), details.resultLimitReached ? "limit reached" : undefined]),
			);
			if (expanded && count > 0) text += `\n${renderOutputPreview(theme, previewLines(textContent, 10), 10)}`;
			return new Text(text, 0, 0);
		},
	});

	pi.registerTool({
		name: "grep",
		label: "grep",
		description: getTools(process.cwd()).grep.description,
		parameters: getTools(process.cwd()).grep.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).grep.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as GrepToolDetails | undefined, "grep", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			return new Text(renderToolSummary(theme, "pending", "grep", String(args.pattern ?? ""), args.path ? shortenPath(args.path) : undefined), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "grep", "searching", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<GrepToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<GrepToolDetails, Record<string, unknown>>(details);
			const textContent = getTextContent(result as any);
			const count = countPrefixedItems(textContent, ["-- "]) || summarizeCount(textContent);
			let text = renderToolSummary(
				theme,
				"success",
				"grep",
				String(meta?.args.pattern ?? ""),
				joinMeta([formatLineLabel(count, "match"), formatDuration(meta?.durationMs), details.matchLimitReached ? "limit reached" : undefined]),
			);
			if (expanded && textContent.length > 0) text += `\n${renderOutputPreview(theme, previewLines(textContent, 12), 12)}`;
			return new Text(text, 0, 0);
		},
	});

	pi.registerTool({
		name: "ls",
		label: "ls",
		description: getTools(process.cwd()).ls.description,
		parameters: getTools(process.cwd()).ls.parameters,
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const started = Date.now();
			const result = await getTools(ctx.cwd).ls.execute(toolCallId, params, signal, onUpdate);
			return {
				...result,
				details: withPidexMeta(result.details as LsToolDetails | undefined, "ls", params as Record<string, unknown>, Date.now() - started),
			};
		},
		renderCall(args, theme) {
			return new Text(renderToolSummary(theme, "pending", "ls", shortenPath(args.path || "."), undefined), 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text(renderToolSummary(theme, "pending", "ls", "listing", undefined), 0, 0);
			const details = (result.details ?? {}) as DetailsWithPidexMeta<LsToolDetails, Record<string, unknown>>;
			const meta = getPidexMeta<LsToolDetails, Record<string, unknown>>(details);
			const textContent = getTextContent(result as any);
			const count = summarizeCount(textContent);
			let text = renderToolSummary(
				theme,
				"success",
				"ls",
				shortenPath(String(meta?.args.path ?? ".")),
				joinMeta([formatLineLabel(count, "entry"), formatDuration(meta?.durationMs), details.entryLimitReached ? "limit reached" : undefined]),
			);
			if (expanded && count > 0) text += `\n${renderOutputPreview(theme, previewLines(textContent, 12), 12)}`;
			return new Text(text, 0, 0);
		},
	});
}
