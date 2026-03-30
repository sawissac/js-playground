import type {
  VariableInterface,
  FunctionInterface,
  Runner,
  CdnPackage,
} from "@/state/types";
import askPromptTemplate from "../prompts/ask-prompt.md";
import codePromptTemplate from "../prompts/code-prompt.md";
import rendererPromptTemplate from "../prompts/renderer-prompt.md";

interface ProjectContext {
  projectName: string;
  packageName: string;
  variables: VariableInterface[];
  functions: FunctionInterface[];
  runner: Runner[];
  cdnPackages: CdnPackage[];
}

// ─── Template fill helper ────────────────────────────────────────────────────

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}

// ─── Shared: project context block ──────────────────────────────────────────

function buildProjectContextBlock(ctx: ProjectContext): string {
  let text = "";

  text += `## Project Context\n`;
  text += `- **Project:** \`${ctx.projectName}\`\n`;
  text += `- **Package:** \`${ctx.packageName}\`\n`;
  text += `- **Environment:** Visual coding playground for interactive data visualizations\n`;
  text += `- **Execution:** Code runs in async JavaScript via \`new AsyncFunction()\`\n`;

  const enabledCdn = ctx.cdnPackages.filter((c) => c.enabled);

  if (enabledCdn.length > 0) {
    text += `\n## CDN Libraries (Pre-loaded)\n`;
    enabledCdn.forEach((cdn) => {
      const safeName = cdn.name
        .replace(/[^a-zA-Z0-9_$]/g, "_")
        .replace(/^[0-9]/, "_$&");
      const displayName =
        safeName !== cdn.name
          ? `${cdn.name} (use as \`${safeName}\`)`
          : cdn.name;
      text += `- \`${displayName}\` — ${cdn.url}\n`;
    });
    text += `\n**Usage:** These libraries are available as named parameters in code blocks\n`;
    text += `**Note:** Names with special characters are auto-sanitized (e.g., \`chart.js\` → \`chart_js\`)\n`;
  }

  if (ctx.variables.length > 0) {
    text += `\n## Variables\n`;
    ctx.variables.forEach((v) => {
      const val =
        typeof v.value === "object" ? JSON.stringify(v.value) : String(v.value);
      text += `- \`${v.name}\` (${v.type}): ${val}\n`;
    });
  }

  if (ctx.functions.length > 0) {
    text += `\n## Functions\n`;
    ctx.functions.forEach((fn) => {
      text += `- \`${fn.name}\` — ${fn.actions.length} action${fn.actions.length !== 1 ? "s" : ""}\n`;
    });
  }

  if (ctx.runner.length > 0) {
    text += `\n## Runner Steps\n`;
    ctx.runner.forEach((r, i) => {
      if (r.type === "set") {
        text += `${i + 1}. Set \`${r.target[0]}\` = \`${r.target[1]}\`\n`;
      } else if (r.type === "call") {
        text += `${i + 1}. Call \`${r.target[1]}\` on \`${r.target[0]}\` with args: [${r.args?.join(", ") || ""}]\n`;
      } else if (r.type === "code") {
        text += `${i + 1}. Code block → \`${r.target[0]}\`\n`;
      }
    });
  }

  return text;
}

// ─── Shared: execution model block ──────────────────────────────────────────

function buildExecutionModelBlock(cdnPackages: CdnPackage[]): string {
  const enabledCdn = cdnPackages.filter((c) => c.enabled);
  let text = `\n## Code Execution Model\n`;
  text += `- **Runtime:** Async JavaScript via \`new AsyncFunction()\`\n`;
  text += `- **Variables:** Accessible directly by name in code blocks\n`;
  if (enabledCdn.length > 0) {
    const cdnList = enabledCdn
      .map((c) => {
        const safeName = c.name
          .replace(/[^a-zA-Z0-9_$]/g, "_")
          .replace(/^[0-9]/, "_$&");
        return safeName !== c.name ? `\`${safeName}\`` : `\`${c.name}\``;
      })
      .join(", ");
    text += `- **CDN Libraries:** ${cdnList} available as function parameters\n`;
  }
  text += `- **Special Tokens:** \`@renderer\`, \`@space\`, \`@comma\`, \`@empty\`\n`;
  text += `- **Return Value:** the return value should be the feature name \n`;
  return text;
}

// ─── Renderer prompt ─────────────────────────────────────────────────────────

export function buildRendererPrompt(
  ctx: ProjectContext,
  rendererId: string,
): string {
  const enabledCdn = ctx.cdnPackages.filter((c) => c.enabled);
  const d3Line = enabledCdn.some((c) => c.name === "d3" && c.enabled)
    ? `- **With D3:** \`d3.select("#" + @renderer)\`\n`
    : "";

  return fill(rendererPromptTemplate, {
    PROJECT_CONTEXT: buildProjectContextBlock(ctx),
    EXECUTION_MODEL: buildExecutionModelBlock(ctx.cdnPackages),
    RENDERER_ID: rendererId,
    D3_LINE: d3Line,
  });
}

// ─── Code mode prompt ────────────────────────────────────────────────────────

export function buildCodePrompt(ctx: ProjectContext): string {
  return fill(codePromptTemplate, {
    PROJECT_CONTEXT: buildProjectContextBlock(ctx),
    EXECUTION_MODEL: buildExecutionModelBlock(ctx.cdnPackages),
  });
}

// ─── Ask mode prompt ─────────────────────────────────────────────────────────

export function buildAskPrompt(ctx: ProjectContext): string {
  return fill(askPromptTemplate, {
    PROJECT_CONTEXT: buildProjectContextBlock(ctx),
  });
}
