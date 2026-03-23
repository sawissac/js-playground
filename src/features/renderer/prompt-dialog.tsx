"use client";

import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/state/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconCopy, IconCheck } from "@tabler/icons-react";

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rendererId: string;
}

const PromptDialog = ({
  open,
  onOpenChange,
  rendererId,
}: PromptDialogProps) => {
  const [copied, setCopied] = useState(false);
  const editorState = useAppSelector((s) => s.editor);
  const activePackage = useAppSelector(
    (s) => s.editor.packages.find((p) => p.id === s.editor.activePackageId)!,
  );
  const variables = activePackage.variables;
  const functions = activePackage.functions;
  const runner = activePackage.runner;
  const cdnPackages = activePackage.cdnPackages || [];

  const enabledCdn = cdnPackages.filter((c) => c.enabled);

  const prompt = useMemo(() => {
    let text = `I'm working in a JavaScript playground with a visual renderer.\n\n`;

    text += `## Project Context\n`;
    text += `- **Project:** \`${editorState.projectName}\`\n`;
    text += `- **Package:** \`${activePackage.name}\`\n`;
    text += `- **Environment:** Visual coding playground for interactive data visualizations\n`;
    text += `- **Execution:** Code runs in async JavaScript via \`new AsyncFunction()\`\n`;

    text += `\n## Renderer Element\n`;
    text += `- **ID:** \`${rendererId}\` (project-scoped, shared across all packages)\n`;
    text += `- **Access:** \`document.getElementById("${rendererId}")\`\n`;
    if (enabledCdn.some((c) => c.name === "d3")) {
      text += `- **With D3:** \`d3.select("#${rendererId}")\`\n`;
    }
    text += `- **⚠️ CRITICAL:** Never reuse \`${rendererId}\` as an ID for any child elements\n`;
    text += `- **⚠️ CRITICAL:** NEVER clear renderer with \`${rendererId}.innerHTML = ""\` (preserves multi-package content)\n`;
    text += `- **Instead:** Use descriptive custom IDs (\`viz-container\`, \`chart-svg\`, \`my-graph\`, etc.)\n`;
    text += `- **Content Management:** Use \`getElementById("your-custom-id")\` to update/remove your specific elements\n`;

    if (enabledCdn.length > 0) {
      text += `\n## CDN Libraries (Pre-loaded)\n`;
      enabledCdn.forEach((cdn) => {
        // Sanitize CDN name for display (same logic as useRunner)
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
      text += `**Encouraged:** Use these libraries to enhance visualizations!\n`;
      text += `\n**🚫 DO NOT:** Manually load scripts via \`document.createElement("script")\`\n`;
      text += `**Instead:** If you need another library, provide its CDN URL and ask me to add it\n`;
    }

    if (variables.length > 0) {
      text += `\n## Variables\n`;
      variables.forEach((v) => {
        const val =
          typeof v.value === "object"
            ? JSON.stringify(v.value)
            : String(v.value);
        text += `- \`${v.name}\` (${v.type}): ${val}\n`;
      });
    }

    if (functions.length > 0) {
      text += `\n## Functions\n`;
      functions.forEach((fn) => {
        text += `- \`${fn.name}\` — ${fn.actions.length} action${fn.actions.length !== 1 ? "s" : ""}\n`;
      });
    }

    if (runner.length > 0) {
      text += `\n## Runner Steps\n`;
      runner.forEach((r, i) => {
        if (r.type === "set") {
          text += `${i + 1}. Set \`${r.target[0]}\` = \`${r.target[1]}\`\n`;
        } else if (r.type === "call") {
          text += `${i + 1}. Call \`${r.target[1]}\` on \`${r.target[0]}\` with args: [${r.args?.join(", ") || ""}]\n`;
        } else if (r.type === "code") {
          text += `${i + 1}. Code block → \`${r.target[0]}\`\n`;
        }
      });
    }

    text += `\n## Code Execution Model\n`;
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

    text += `\n## Your Task\n`;
    text += `Create code for renderer \`${rendererId}\` that: **[describe your visualization here]**\n\n`;

    text += `## Requirements\n`;
    text += `✓ Create visually appealing and interactive output\n`;
    text += `✓ Use available CDN libraries when beneficial\n`;
    text += `✓ Ensure code is compatible with async function environment\n`;
    text += `✓ Target \`${rendererId}\` for all DOM operations\n`;
    text += `✓ Use unique custom IDs for any elements you create\n`;
    text += `✓ Manage your content via custom IDs (e.g., remove old elements before adding new ones)\n`;
    text += `✗ Never reuse \`${rendererId}\` as an element ID\n`;
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
  }, [
    rendererId,
    editorState.projectName,
    activePackage.name,
    variables,
    functions,
    runner,
    enabledCdn,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Copy Prompt</DialogTitle>
          <DialogDescription className="text-xs">
            Copy this prompt and paste it into an AI assistant to vibe code your
            renderer visualization.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
            {prompt}
          </pre>
        </div>
        <DialogFooter>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDialog;
