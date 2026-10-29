import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const FENCE_RE = /^(\s*)(`{3,}|~{3,})(.*)$/;

function closingFence(line: string, marker: string, minLength: number): boolean {
  const m = line.match(/^(\s*)(`+|~+)\s*$/);
  return !!m && m[2]?.[0] === marker[0] && (m[2]?.length ?? 0) >= minLength;
}

function codespan(line: string): string {
  if (line.length === 0) return "";
  let maxRun = 0;
  for (const run of line.match(/`+/g) ?? []) maxRun = Math.max(maxRun, run.length);
  const needsPad =
    line.startsWith("`") || line.endsWith("`") || line.startsWith(" ") || line.endsWith(" ");
  const fence = "`".repeat(maxRun + 1);
  const pad = needsPad ? " " : "";
  return fence + pad + line + pad + fence;
}

function codeLinesToQuote(codeLines: string[], indent: string): string[] {
  const out: string[] = [];
  for (const line of codeLines) {
    if (line.length === 0) {
      out.push(`${indent}>`);
      continue;
    }
    out.push(`${indent}> ${codespan(line)}`);
  }
  return out;
}

export function codifyFencedCodeBlocks(markdown: string): string {
  if (!markdown.includes("```") && !markdown.includes("~~~")) return markdown;
  const lines = markdown.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const fence = lines[i]!.match(FENCE_RE);
    if (!fence) {
      out.push(lines[i]!);
      i++;
      continue;
    }
    const indent = fence[1]!;
    const marker = fence[2]!;
    let j = i + 1;
    const body: string[] = [];
    for (; j < lines.length; j++) {
      if (closingFence(lines[j]!, marker[0]!, marker.length)) break;
      body.push(lines[j]!.startsWith(indent) ? lines[j]!.slice(indent.length) : lines[j]!);
    }
    out.push(...codeLinesToQuote(body, indent));
    i = j + 1;
  }
  return out.join("\n");
}

type MarkdownTransformerCapable = {
  registerMarkdownTransformer?: (
    transformer: (markdown: string, context: { messageType: string }) => string,
  ) => void;
};

export function registerCodexMarkdown(pi: ExtensionAPI): void {
  const api = pi as ExtensionAPI & MarkdownTransformerCapable;
  if (typeof api.registerMarkdownTransformer !== "function") return;
  api.registerMarkdownTransformer((markdown) => codifyFencedCodeBlocks(markdown));
}
