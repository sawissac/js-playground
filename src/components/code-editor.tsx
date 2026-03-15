"use client";

import React, { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import {
  autocompletion,
  startCompletion,
  CompletionContext,
} from "@codemirror/autocomplete";
import { basicSetup } from "codemirror";

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

    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        autocompletion({
          override: [tokenCompletion, variableCompletion],
        }),
        keymap.of([
          {
            key: "Mod-Space",
            run: startCompletion,
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
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
            maxHeight: "250px",
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

  return (
    <div
      ref={containerRef}
      className="border rounded-md overflow-hidden"
    />
  );
};
