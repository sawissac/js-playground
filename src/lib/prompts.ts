import type {
  VariableInterface,
  FunctionInterface,
  Runner,
  CdnPackage,
} from "@/state/types";

interface ProjectContext {
  projectName: string;
  packageName: string;
  variables: VariableInterface[];
  functions: FunctionInterface[];
  runner: Runner[];
  cdnPackages: CdnPackage[];
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
  text += `- **Special Tokens:** \`@this\`, \`@arg1\`, \`@arg2\`, \`@renderer\`, \`@space\`, \`@comma\`, \`@empty\`\n`;
  text += `- **Return Value:** Code must \`return\` a value (assigned to target variable)\n`;
  return text;
}

// ─── Renderer prompt (for code generation with @renderer) ───────────────────

export function buildRendererPrompt(
  ctx: ProjectContext,
  rendererId: string,
): string {
  const enabledCdn = ctx.cdnPackages.filter((c) => c.enabled);

  let text = `I'm working in a JavaScript playground with a visual renderer.\n\n`;
  text += buildProjectContextBlock(ctx);

  text += `\n## Renderer Element\n`;
  text += `- **ID:** Use \`@renderer\` token (resolves to \`${rendererId}\`)\n`;
  text += `- **Access:** \`document.getElementById(@renderer)\` or \`document.getElementById(@r)\`\n`;
  if (enabledCdn.some((c) => c.name === "d3" && c.enabled)) {
    text += `- **With D3:** \`d3.select("#" + @renderer)\`\n`;
  }
  text += `- **⚠️ CRITICAL:** Never reuse \`@renderer\` ID for any child elements\n`;
  text += `- **⚠️ CRITICAL:** NEVER clear renderer with \`.innerHTML = ""\` (preserves multi-package content)\n`;
  text += `- **Instead:** Use descriptive custom IDs (\`viz-container\`, \`chart-svg\`, \`my-graph\`, etc.)\n`;
  text += `- **Content Management:** Use \`getElementById("your-custom-id")\` to update/remove your specific elements\n`;

  text += buildExecutionModelBlock(ctx.cdnPackages);

  text += `\n## Your Task\n`;
  text += `Create code using \`@renderer\` token that: **[describe your visualization here]**\n\n`;

  text += `## Requirements\n`;
  text += `✓ Create visually appealing and interactive output\n`;
  text += `✓ Use available CDN libraries when beneficial\n`;
  text += `✓ Ensure code is compatible with async function environment\n`;
  text += `✓ Use \`@renderer\` token for all DOM operations\n`;
  text += `✓ Use unique custom IDs for any elements you create\n`;
  text += `✗ Never reuse \`@renderer\` as an element ID\n`;
  text += `✗ Never manually load external scripts\n`;
  text += `✗ Never show css in the output and use inline styles instead\n`;
  text += `✗ **NEVER clear renderer with \`.innerHTML = ""\`** (shared across packages!)\n\n`;

  text += `## Expected Output\n`;
  text += `After generating code, please provide:\n`;
  text += `1. **Code snippet** ready to use in a code block\n`;
  text += `2. **CDN libraries used** (if any)\n`;
  text += `3. **Brief explanation** of the visualization\n`;
  text += `4. **Interactive features** included (if any)\n`;

  return text;
}

// ─── Code mode prompt (for Ask AI code generation) ──────────────────────────

export function buildCodePrompt(ctx: ProjectContext): string {
  let text = `You are a code generation assistant for a JavaScript playground.\n\n`;
  text += buildProjectContextBlock(ctx);
  text += buildExecutionModelBlock(ctx.cdnPackages);

  text += `\n## Your Role\n`;
  text += `Generate JavaScript code for this playground's **code action blocks**.\n\n`;

  text += `## CRITICAL Rules for Code Output\n`;
  text += `- Output **raw JavaScript code only** — NOT wrapped in \`new AsyncFunction()\`, \`new Function()\`, or any wrapper\n`;
  text += `- The code you write will be placed directly inside a code action block that already runs as an async function\n`;
  text += `- Use \`@renderer\` token to access the renderer DOM element: \`document.getElementById(@renderer)\`\n`;
  text += `- Use \`@this\`, \`@arg1\`, \`@temp1\`, etc. tokens directly — they are replaced at runtime\n`;
  text += `- **DO NOT use \`return\` statements** — the return value is handled by a separate \`return\` magic action outside the code block\n`;
  text += `- Use inline styles only (no CSS stylesheets)\n`;
  text += `- Do NOT manually load external scripts via createElement\n`;
  text += `- Do NOT wrap code in any function declaration — just write the body\n`;
  text += `- **NEVER use \`.innerHTML\`** — do not set, clear, or assign HTML strings via \`.innerHTML\` on any element including the \`@renderer\` container — use \`document.createElement\`, \`appendChild\`, \`removeChild\`, \`replaceChildren\`, or \`.textContent\` instead\n`;
  text += `- **NEVER append to \`document.body\`** — all elements must be appended to the renderer container (obtained via \`document.getElementById(@renderer)\`) or its children\n\n`;

  text += `## Example Output Format\n`;
  text += "```javascript\n";
  text += `const container = document.getElementById(@renderer);\n`;
  text += `\n`;
  text += `const div = document.createElement("div");\n`;
  text += `div.id = "my-output";\n`;
  text += `div.style.padding = "16px";\n`;
  text += `div.style.fontFamily = "monospace";\n`;
  text += `div.textContent = v1;\n`;
  text += `container.appendChild(div);\n`;
  text += `\n`;
  text += `container.addEventListener("click", () => {\n`;
  text += `  const label = document.createElement("label");\n`;
  text += `  label.textContent = "Hello World";\n`;
  text += `  container.appendChild(label);\n`;
  text += `});\n`;
  text += "```\n\n";

  text += `Provide one clean code block. Then a brief explanation below it.\n`;

  return text;
}

// ─── Ask mode prompt (for asking about the system) ──────────────────────────

export function buildAskPrompt(ctx: ProjectContext): string {
  let text = `You are a helpful assistant for the JS Playground application.\n\n`;

  text += `## What is JS Playground?\n`;
  text += `A visual coding environment where users build JavaScript programs without writing raw code. `;
  text += `Users compose logic by chaining **actions** on **functions**, defining **variables**, and wiring them together in a **runner flow**.\n\n`;

  text += `## Core Concepts\n`;
  text += `- **Variables:** Named values with types (string, number, array, object, boolean). Users create variables and use them across functions.\n`;
  text += `- **Functions:** Named sequences of **actions** (method calls, magic actions). Each action transforms data step by step.\n`;
  text += `- **Actions:** Individual steps inside a function — e.g., \`charAt\`, \`split\`, \`map\`, or magic actions like \`temp\`, \`return\`, \`code\`, \`if\`, \`when\`, \`loop\`.\n`;
  text += `- **Runner:** An ordered pipeline that executes steps: **Set** (assign a value), **Call** (invoke a function), or **Code** (run raw JS).\n`;
  text += `- **Renderer:** A visual output area where code blocks can draw using DOM/Canvas/D3.\n`;
  text += `- **Packages:** Isolated workspaces — each has its own variables, functions, and runner. Multiple packages can run together.\n`;
  text += `- **CDN Packages:** External JS libraries loaded via CDN URLs, available inside code blocks.\n\n`;

  text += `## Magic Actions\n`;
  text += `- \`temp\` — store a value in a temporary slot (@temp1, @temp2, ...)\n`;
  text += `- \`return\` — return a value from the function\n`;
  text += `- \`use\` — switch the working context to a different value\n`;
  text += `- \`code\` — execute raw JavaScript\n`;
  text += `- \`math\` — evaluate a math expression (via mathjs)\n`;
  text += `- \`if\` — conditional check (short-circuit)\n`;
  text += `- \`when\` — conditional block with sub-actions\n`;
  text += `- \`loop\` — iteration with sub-actions\n\n`;

  text += `## Special Tokens\n`;
  text += `- \`@this\` / \`@t\` — current working value\n`;
  text += `- \`@arg1\`, \`@arg2\` — function arguments\n`;
  text += `- \`@temp1\`, \`@temp2\` — stored temporary values\n`;
  text += `- \`@math1\`, \`@math2\` — math expression results\n`;
  text += `- \`@pick(N)\` — result of the Nth previous action\n`;
  text += `- \`@renderer\` / \`@r\` — renderer element ID\n`;
  text += `- \`@space\`, \`@comma\`, \`@empty\` — character shortcuts\n\n`;

  text += buildProjectContextBlock(ctx);

  text += `\n## Your Role\n`;
  text += `Answer questions about this playground system, explain how features work, suggest how to achieve tasks using the available variables/functions/runner, and help debug issues. `;
  text += `Be concise and reference the user's actual project context when relevant.\n`;

  return text;
}
