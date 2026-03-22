/**
 * Code Formatting Utilities using Prettier
 */

import prettier from "prettier/standalone";
import babelPlugin from "prettier/plugins/babel";
import estreePlugin from "prettier/plugins/estree";

export interface FormatOptions {
  indentSize?: number;
  useTabs?: boolean;
  semicolons?: boolean;
  singleQuotes?: boolean;
  trailingComma?: "none" | "es5" | "all";
}

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  indentSize: 2,
  useTabs: false,
  semicolons: true,
  singleQuotes: false,
  trailingComma: "es5",
};

/**
 * Format JavaScript code using Prettier
 */
export async function formatCode(
  code: string,
  options: FormatOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const formatted = await prettier.format(code, {
      parser: "babel",
      plugins: [babelPlugin, estreePlugin],
      tabWidth: opts.indentSize,
      useTabs: opts.useTabs,
      semi: opts.semicolons,
      singleQuote: opts.singleQuotes,
      trailingComma: opts.trailingComma,
      printWidth: 80,
      arrowParens: "always",
    });

    return formatted;
  } catch (error) {
    // If formatting fails, return original code
    console.error("Prettier formatting error:", error);
    return code;
  }
}

/**
 * Quick format: just fix indentation using Prettier
 */
export async function quickFormat(
  code: string,
  indentSize: number = 2,
): Promise<string> {
  return formatCode(code, { indentSize });
}

/**
 * Remove extra blank lines
 */
export function removeExtraBlankLines(code: string): string {
  return code.replace(/\n{3,}/g, "\n\n");
}

/**
 * Add blank lines between major blocks
 */
export function addBlockSpacing(code: string): string {
  let formatted = code;

  // Add blank line before function declarations
  formatted = formatted.replace(
    /([^\n])\n((?:function|const|let|var)\s+\w+\s*=\s*(?:function|\())/g,
    "$1\n\n$2",
  );

  // Add blank line before class declarations
  formatted = formatted.replace(/([^\n])\n(class\s+\w+)/g, "$1\n\n$2");

  // Add blank line before if/for/while blocks
  formatted = formatted.replace(
    /([^\n])\n((?:if|for|while|switch)\s*\()/g,
    "$1\n\n$2",
  );

  return formatted;
}

/**
 * Organize imports (basic)
 */
export function organizeImports(code: string): string {
  const lines = code.split("\n");
  const imports: string[] = [];
  const rest: string[] = [];

  lines.forEach((line) => {
    if (line.trim().startsWith("import ")) {
      imports.push(line);
    } else {
      rest.push(line);
    }
  });

  // Sort imports alphabetically
  imports.sort();

  return [...imports, "", ...rest].join("\n");
}

/**
 * Complete formatting pipeline using Prettier
 */
export async function fullFormat(
  code: string,
  options: FormatOptions = {},
): Promise<string> {
  // Prettier handles all formatting comprehensively
  return formatCode(code, options);
}
