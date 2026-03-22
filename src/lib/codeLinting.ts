/**
 * Code Linting and Quality Checks
 * Provides lightweight linting without full ESLint dependency
 */

export interface LintIssue {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
  rule: string;
}

export interface LintResult {
  issues: LintIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

/**
 * Lint JavaScript code for common issues
 */
export function lintCode(code: string): LintResult {
  const issues: LintIssue[] = [];
  const lines = code.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for console.log (should be removed in production)
    if (/console\.log\s*\(/.test(line)) {
      issues.push({
        line: lineNumber,
        column: line.indexOf("console.log") + 1,
        message: "Unexpected console.log statement",
        severity: "warning",
        rule: "no-console",
      });
    }

    // Check for debugger statements
    if (/\bdebugger\b/.test(line)) {
      issues.push({
        line: lineNumber,
        column: line.indexOf("debugger") + 1,
        message: "Unexpected debugger statement",
        severity: "warning",
        rule: "no-debugger",
      });
    }

    // Check for == instead of ===
    if (/[^=!]={2}[^=]/.test(line) && !/===/.test(line)) {
      const match = line.match(/[^=!]={2}[^=]/);
      if (match) {
        issues.push({
          line: lineNumber,
          column: match.index! + 2,
          message: "Use '===' instead of '=='",
          severity: "warning",
          rule: "eqeqeq",
        });
      }
    }

    // Check for != instead of !==
    if (/!={1}[^=]/.test(line) && !/!==/.test(line)) {
      const match = line.match(/!={1}[^=]/);
      if (match) {
        issues.push({
          line: lineNumber,
          column: match.index! + 1,
          message: "Use '!==' instead of '!='",
          severity: "warning",
          rule: "eqeqeq",
        });
      }
    }

    // Check for var declarations (prefer const/let)
    if (/\bvar\s+\w+/.test(line)) {
      issues.push({
        line: lineNumber,
        column: line.indexOf("var") + 1,
        message: "Unexpected 'var', use 'const' or 'let' instead",
        severity: "warning",
        rule: "no-var",
      });
    }

    // Check for unused variables (simple heuristic)
    const varDeclaration = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (varDeclaration) {
      const varName = varDeclaration[1];
      const restOfCode = lines.slice(index + 1).join("\n");
      if (!restOfCode.includes(varName)) {
        issues.push({
          line: lineNumber,
          column: line.indexOf(varName) + 1,
          message: `'${varName}' is assigned but never used`,
          severity: "warning",
          rule: "no-unused-vars",
        });
      }
    }

    // Check for empty catch blocks
    if (/catch\s*\(\s*\w*\s*\)\s*\{\s*\}/.test(line)) {
      issues.push({
        line: lineNumber,
        column: line.indexOf("catch") + 1,
        message: "Empty catch block",
        severity: "warning",
        rule: "no-empty",
      });
    }

    // Check for missing semicolons (basic check)
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.endsWith(";") &&
      !trimmed.endsWith("{") &&
      !trimmed.endsWith("}") &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*") &&
      !trimmed.endsWith(",") &&
      !/^\s*(?:if|else|for|while|do|switch|try|catch|finally|function|class)\b/.test(
        trimmed
      )
    ) {
      const nextLine = lines[index + 1];
      if (nextLine && !nextLine.trim().startsWith(".")) {
        issues.push({
          line: lineNumber,
          column: line.length,
          message: "Missing semicolon",
          severity: "info",
          rule: "semi",
        });
      }
    }

    // Check for unreachable code after return
    if (/\breturn\b/.test(line)) {
      const afterReturn = line.substring(line.indexOf("return") + 6).trim();
      if (afterReturn && afterReturn !== ";" && !afterReturn.startsWith(";")) {
        const nextLine = lines[index + 1];
        if (nextLine && nextLine.trim() && !nextLine.trim().startsWith("}")) {
          issues.push({
            line: lineNumber + 1,
            column: 1,
            message: "Unreachable code after return statement",
            severity: "warning",
            rule: "no-unreachable",
          });
        }
      }
    }

    // Check for constant conditions
    if (/if\s*\(\s*(?:true|false)\s*\)/.test(line)) {
      issues.push({
        line: lineNumber,
        column: line.indexOf("if") + 1,
        message: "Unexpected constant condition",
        severity: "warning",
        rule: "no-constant-condition",
      });
    }

    // Check for duplicate keys in objects (basic)
    const objectLiteral = line.match(/\{\s*(\w+):/g);
    if (objectLiteral && objectLiteral.length > 1) {
      const keys = objectLiteral.map((k) => k.match(/(\w+):/)?.[1]);
      const duplicates = keys.filter(
        (key, idx) => keys.indexOf(key) !== idx
      );
      if (duplicates.length > 0) {
        issues.push({
          line: lineNumber,
          column: 1,
          message: `Duplicate key '${duplicates[0]}' in object literal`,
          severity: "error",
          rule: "no-dupe-keys",
        });
      }
    }

    // Check for missing parentheses in arrow functions
    if (/=>\s*\w+\s*;/.test(line) && !/=>\s*\{/.test(line)) {
      const hasReturn = /=>\s*return\s+/.test(line);
      if (!hasReturn) {
        issues.push({
          line: lineNumber,
          column: line.indexOf("=>") + 1,
          message: "Arrow function should return a value or use block body",
          severity: "info",
          rule: "arrow-body-style",
        });
      }
    }
  });

  return {
    issues,
    hasErrors: issues.some((i) => i.severity === "error"),
    hasWarnings: issues.some((i) => i.severity === "warning"),
  };
}

/**
 * Get lint statistics
 */
export function getLintStats(result: LintResult) {
  const errorCount = result.issues.filter((i) => i.severity === "error").length;
  const warningCount = result.issues.filter(
    (i) => i.severity === "warning"
  ).length;
  const infoCount = result.issues.filter((i) => i.severity === "info").length;

  return {
    total: result.issues.length,
    errors: errorCount,
    warnings: warningCount,
    info: infoCount,
  };
}

/**
 * Format lint issues for display
 */
export function formatLintIssues(issues: LintIssue[]): string {
  if (issues.length === 0) return "No issues found ✓";

  return issues
    .map((issue) => {
      const icon =
        issue.severity === "error"
          ? "❌"
          : issue.severity === "warning"
          ? "⚠️"
          : "ℹ️";
      return `${icon} Line ${issue.line}:${issue.column} - ${issue.message} (${issue.rule})`;
    })
    .join("\n");
}
