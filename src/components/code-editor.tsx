"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
  autocompletion,
  startCompletion,
  CompletionContext,
} from "@codemirror/autocomplete";
import { basicSetup } from "codemirror";
import { lintCode } from "@/lib/codeLinting";
import { formatCode } from "@/lib/codeFormatting";
import { CodeLintBadge } from "@/components/CodeLintWarnings";
import { Button } from "@/components/ui/button";
import {
  IconWand,
  IconAlertTriangle,
  IconMaximize,
  IconMinimize,
} from "@tabler/icons-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  tokens: { token: string; desc: string }[];
  variables: { name: string; type: string }[];
}

export const CodeEditor = ({
  value,
  onChange,
  tokens,
  variables,
}: CodeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const [lintResults, setLintResults] = useState(() => lintCode(value));
  const [isExpanded, setIsExpanded] = useState(false);
  const tokensRef = useRef(tokens);
  const variablesRef = useRef(variables);

  onChangeRef.current = onChange;
  tokensRef.current = tokens;
  variablesRef.current = variables;

  useEffect(() => {
    if (!containerRef.current) return;

    const tokenCompletion = (context: CompletionContext) => {
      const word = context.matchBefore(/@[\w.]*/);
      if (!word && !context.explicit) return null;
      return {
        from: word ? word.from : context.pos,
        options: tokensRef.current.map((t) => ({
          label: t.token,
          type: "variable" as const,
          info: t.desc,
        })),
      };
    };

    const variableCompletion = (context: CompletionContext) => {
      const word = context.matchBefore(/[a-zA-Z_$][\w$]*/);
      if (!word && !context.explicit) return null;
      if (word && word.text.startsWith("@")) return null;
      return {
        from: word ? word.from : context.pos,
        options: variablesRef.current.map((v) => ({
          label: v.name,
          type: "variable" as const,
          detail: `:${v.type}`,
        })),
      };
    };

    const jsGlobalsCompletion = (context: CompletionContext) => {
      const word = context.matchBefore(/[a-zA-Z_$][\w$]*/);
      if (!word && !context.explicit) return null;
      if (word && word.text.startsWith("@")) return null;

      const globals = [
        { label: "console.log", type: "function", info: "Output to console" },
        { label: "console.error", type: "function", info: "Log error message" },
        {
          label: "console.warn",
          type: "function",
          info: "Log warning message",
        },
        {
          label: "document.getElementById",
          type: "function",
          info: "Get element by ID",
        },
        {
          label: "document.querySelector",
          type: "function",
          info: "Query selector",
        },
        {
          label: "document.querySelectorAll",
          type: "function",
          info: "Query all matching selectors",
        },
        {
          label: "document.createElement",
          type: "function",
          info: "Create new element",
        },
        { label: "Math.random", type: "function", info: "Random number 0-1" },
        { label: "Math.floor", type: "function", info: "Round down" },
        { label: "Math.ceil", type: "function", info: "Round up" },
        {
          label: "Math.round",
          type: "function",
          info: "Round to nearest integer",
        },
        { label: "Math.abs", type: "function", info: "Absolute value" },
        { label: "Math.max", type: "function", info: "Maximum value" },
        { label: "Math.min", type: "function", info: "Minimum value" },
        { label: "JSON.parse", type: "function", info: "Parse JSON string" },
        {
          label: "JSON.stringify",
          type: "function",
          info: "Convert to JSON string",
        },
        {
          label: "Array.isArray",
          type: "function",
          info: "Check if value is array",
        },
        { label: "Object.keys", type: "function", info: "Get object keys" },
        { label: "Object.values", type: "function", info: "Get object values" },
        {
          label: "Object.entries",
          type: "function",
          info: "Get key-value pairs",
        },
        { label: "setTimeout", type: "function", info: "Delay execution" },
        { label: "setInterval", type: "function", info: "Repeat execution" },
        { label: "clearTimeout", type: "function", info: "Cancel timeout" },
        { label: "clearInterval", type: "function", info: "Cancel interval" },
        { label: "fetch", type: "function", info: "Make HTTP request" },
        { label: "async", type: "keyword", info: "Async function keyword" },
        { label: "await", type: "keyword", info: "Await promise resolution" },
        {
          label: "return",
          type: "keyword",
          info: "Return value from function",
        },
        { label: "const", type: "keyword", info: "Constant declaration" },
        { label: "let", type: "keyword", info: "Variable declaration" },
        {
          label: "var",
          type: "keyword",
          info: "Variable declaration (legacy)",
        },
      ];

      return {
        from: word ? word.from : context.pos,
        options: globals,
      };
    };

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        autocompletion({
          override: [tokenCompletion, variableCompletion, jsGlobalsCompletion],
        }),
        keymap.of([
          {
            key: "Mod-Space",
            run: startCompletion,
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newCode = update.state.doc.toString();
            onChangeRef.current(newCode);
            // Lint code on change
            setLintResults(lintCode(newCode));
          }
        }),
        EditorView.theme({
          "&": {
            fontSize: "12px",
            border: "none",
          },
          "&.cm-focused": {
            outline: "none",
          },
          ".cm-scroller": {
            overflow: "auto",
            minHeight: "120px",
          },
          ".cm-content": {
            fontFamily: "var(--font-geist-mono), monospace",
            padding: "8px 0",
          },
          ".cm-gutters": {
            backgroundColor: "#f8fafc",
            borderRight: "1px solid #e2e8f0",
            color: "#94a3b8",
          },
          ".cm-activeLineGutter": {
            backgroundColor: "#f1f5f9",
          },
          ".cm-activeLine": {
            backgroundColor: "#f8fafc",
          },
          ".cm-cursor": {
            borderLeftColor: "hsl(var(--primary))",
            borderLeftWidth: "2px",
          },
          "&.cm-focused .cm-cursor": {
            borderLeftColor: "hsl(var(--primary))",
          },
          "&.cm-focused .cm-selectionBackground, ::selection": {
            backgroundColor: "hsl(var(--primary) / 0.2)",
          },
          ".cm-selectionBackground": {
            backgroundColor: "hsl(var(--primary) / 0.15)",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const handleFormat = async () => {
    try {
      const formatted = await formatCode(value, {
        indentSize: 2,
        semicolons: true,
        singleQuotes: false,
      });
      onChange(formatted);
    } catch (error) {
      console.error("Format error:", error);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md">
        <div className="flex items-center gap-2">
          <CodeLintBadge issues={lintResults.issues} />
          {lintResults.hasWarnings && (
            <span className="text-[9px] text-amber-600 flex items-center gap-1">
              <IconAlertTriangle size={10} />
              Check code quality
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={handleFormat}
            title="Format code (Ctrl+Shift+F)"
          >
            <IconWand size={12} />
            Format
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse editor" : "Expand editor"}
          >
            {isExpanded ? (
              <IconMinimize size={12} />
            ) : (
              <IconMaximize size={12} />
            )}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className="border rounded-md overflow-auto"
        style={{
          maxHeight: isExpanded ? "600px" : "250px",
          transition: "max-height 0.3s ease",
        }}
      />
    </div>
  );
};
