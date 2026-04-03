"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  IconArrowLeftSquareFilled,
  IconArrowsDown,
  IconCode,
  IconEqual,
  IconGripVertical,
  IconInfoCircle,
  IconRun,
  IconSquareFilled,
  IconTrash,
  IconTriangleFilled,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createCallRunner,
  createCodeRunner,
  createSetRunner,
  removeRunner,
  reorderRunnerSteps,
} from "@/state/slices/editorSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRunner } from "@/state/slices/editorSlice";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRunner } from "@/hooks/useRunner";
import { CodeEditor } from "@/components/code-editor";

const CODE_TOKENS: { token: string; desc: string }[] = [
  { token: "@this", desc: "target variable's current value" },
  { token: "@t", desc: "current value (short)" },
  { token: "@renderer", desc: "renderer element ID" },
  { token: "@r", desc: "renderer ID (short)" },
  { token: "@space", desc: 'space character " "' },
  { token: "@s", desc: "space (short)" },
  { token: "@comma", desc: 'comma character ","' },
  { token: "@c", desc: "comma (short)" },
  { token: "@empty", desc: "empty string" },
  { token: "@e", desc: "empty (short)" },
];

const InstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left text-blue-700 font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200 hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Building Runner Flows
            </p>
            <p className="text-blue-800 line-clamp-3">
              Compose ordered steps that execute from top to bottom. Use the Runner to test logic, manipulate data, or render visual outputs.
            </p>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-start gap-1.5">
              <IconTriangleFilled size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Set Variable</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Initialize or overwrite variables with static strings, numbers, booleans, arrays, or JSON arrays.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <IconSquareFilled size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Call Function</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Execute your custom JavaScript functions on variables using your defined data types.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-1.5">
              <IconCode size={12} className="text-blue-700 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-900">Code Step</strong>
                <p className="text-blue-800 text-[11px] leading-tight mt-0.5">Write freeform JS, return computed values, access variables with <code className="bg-blue-100 rounded px-1">@token</code> shortcuts, or manipulate the visual Renderer using <code className="bg-blue-100 rounded px-1">@renderer</code>.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-100/50 p-2 rounded-md border border-blue-200 mt-2">
            <p className="text-blue-800 text-[10px] italic">
              Note: All variables must be typed before running. Click "Run" or open the "Renderer" to execute the flow.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const SET_VALUE_HINTS: Record<string, string> = {
  string: "Plain text — e.g. hello world",
  array: "Comma-separated — e.g. a, b, c",
  number: "A number — e.g. 42",
  boolean: "true or false",
  object: 'JSON — e.g. {"key":"value"}',
};

const RunnerInput = (payload: {
  runner: any;
  runnerIndex: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .variables,
  );
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const [value, setValue] = useState<string>("");
  const [args, setArgs] = useState<string>("");
  const [code, setCode] = useState<string>(
    payload.runner.code ?? "return @this;\n",
  );
  const [showArgSuggestions, setShowArgSuggestions] = useState(false);
  const argsInputRef = React.useRef<HTMLInputElement>(null);

  const runnerType = useMemo(() => payload.runner.type, [payload.runner]);
  const runnerTarget = useMemo(() => payload.runner.target, [payload.runner]);
  const runnerArgs = useMemo(() => payload.runner.args, [payload.runner]);

  const selectedVar = useMemo(
    () => variables.find((v) => v.name === runnerTarget[0]),
    [variables, runnerTarget],
  );
  const varType = selectedVar?.type ?? "";

  const funcList = useMemo(() => {
    if (!selectedVar) return [];
    return functions.map((func) => func.name);
  }, [functions, selectedVar]);

  const handleUpdateRunner = (
    runnerId: string,
    target: [string, string],
    args: string[],
  ) => {
    dispatch(
      updateRunner({ runnerId, runner: { ...payload.runner, target, args } }),
    );
  };

  const debouncedUpdateRunner = useDebounce(handleUpdateRunner, 300);

  const handleUpdateCodeRunner = (
    runnerId: string,
    target: [string, string],
    codeVal: string,
  ) => {
    dispatch(
      updateRunner({
        runnerId,
        runner: { ...payload.runner, target, args: [], code: codeVal },
      }),
    );
  };
  const debouncedUpdateCode = useDebounce(handleUpdateCodeRunner, 300);

  const isSet = runnerType === "set";
  const isCode = runnerType === "code";

  const insertArgVar = (varName: string) => {
    const current = argsInputRef.current?.value ?? args;
    const newArgs = current.trim() ? `${current.trim()}, ${varName}` : varName;
    setArgs(newArgs);
    setShowArgSuggestions(false);
    debouncedUpdateRunner(
      payload.runner.id,
      [runnerTarget[0], runnerTarget[1]],
      newArgs.split(",").map((v) => v.trim()),
    );
    setTimeout(() => argsInputRef.current?.focus(), 0);
  };

  return (
    <>
      <div
        className={cn(
          "flex pl-2 text-muted-foreground",
          payload.runnerIndex === 0 && "hidden",
        )}
      >
        <IconArrowsDown size={13} className="shrink-0" />
      </div>

      <div
        draggable
        onDragStart={() => payload.onDragStart(payload.runnerIndex)}
        onDragOver={(e) => payload.onDragOver(e, payload.runnerIndex)}
        onDragEnd={payload.onDragEnd}
        onDrop={() => payload.onDrop(payload.runnerIndex)}
        className={cn(
          "rounded border p-1.5 space-y-1.5 transition-all cursor-move",
          payload.isDragging && "opacity-40 scale-95",
          payload.isDragOver && "border-blue-400 bg-blue-50 border-2",
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <IconGripVertical
            size={14}
            className="shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing"
          />
          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
            {payload.runnerIndex + 1}
          </span>
          <Badge variant="secondary" className="gap-1 text-xs py-0">
            {isSet ? (
              <IconTriangleFilled size={9} />
            ) : isCode ? (
              <IconCode size={9} />
            ) : (
              <IconSquareFilled size={9} />
            )}
            {isSet ? "Set" : isCode ? "Code" : "Call"}
          </Badge>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => dispatch(removeRunner(payload.runner.id))}
            className="ml-auto h-5 w-5"
          >
            <IconTrash size={11} />
          </Button>
        </div>

        {/* Fields */}
        {isCode ? (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Select
                value={runnerTarget[0]}
                onValueChange={(v) =>
                  debouncedUpdateCode(payload.runner.id, [v, ""], code)
                }
              >
                <SelectTrigger className="w-[120px] h-7 text-xs">
                  <SelectValue placeholder="variable" />
                </SelectTrigger>
                <SelectContent>
                  {variables.map((v) => (
                    <SelectItem key={v.id} value={v.name} className="text-xs">
                      {v.name}
                      {v.type && (
                        <span className="text-muted-foreground ml-1">
                          :{v.type}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-[10px] text-muted-foreground">
                ← code result
              </span>
            </div>

            <CodeEditor
              value={code}
              onChange={(newCode) => {
                setCode(newCode);
                debouncedUpdateCode(
                  payload.runner.id,
                  [runnerTarget[0], ""],
                  newCode,
                );
              }}
              tokens={CODE_TOKENS}
              variables={variables.map((v) => ({
                name: v.name,
                type: v.type,
              }))}
            />

            <div className="rounded bg-slate-50 border border-slate-200 px-2 py-1.5 text-xs space-y-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                @ tokens — available in code
              </p>
              <div className="flex flex-wrap gap-1">
                {CODE_TOKENS.map((t) => (
                  <span
                    key={t.token}
                    className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5"
                    title={t.desc}
                  >
                    {t.token}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                Variables accessible by name. Press{" "}
                <kbd className="bg-slate-200 px-1 rounded text-[9px]">
                  ⌘ Space
                </kbd>{" "}
                for autocomplete.
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Select
              value={runnerTarget[0]}
              onValueChange={(v) =>
                debouncedUpdateRunner(
                  payload.runner.id,
                  [v, runnerTarget[1]],
                  runnerArgs,
                )
              }
            >
              <SelectTrigger className="w-[120px] h-7 text-xs">
                <SelectValue placeholder="variable" />
              </SelectTrigger>
              <SelectContent>
                {variables.map((v) => (
                  <SelectItem key={v.id} value={v.name} className="text-xs">
                    {v.name}
                    {v.type && (
                      <span className="text-muted-foreground ml-1">
                        :{v.type}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isSet ? (
              <div className="flex items-center gap-1 flex-1 min-w-[80px]">
                <IconEqual
                  size={12}
                  className="shrink-0 text-muted-foreground"
                />
                <Input
                  value={value}
                  placeholder="value"
                  className="h-7 text-xs"
                  onChange={(e) => {
                    setValue(e.target.value);
                    debouncedUpdateRunner(
                      payload.runner.id,
                      [runnerTarget[0], e.target.value],
                      runnerArgs,
                    );
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 flex-1">
                  <IconArrowLeftSquareFilled
                    size={12}
                    className="shrink-0 text-muted-foreground"
                  />
                  <Select
                    value={runnerTarget[1]}
                    onValueChange={(v) =>
                      debouncedUpdateRunner(
                        payload.runner.id,
                        [runnerTarget[0], v],
                        runnerArgs,
                      )
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-full">
                      <SelectValue placeholder="function" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcList.map((fn, i) => (
                        <SelectItem key={i} value={fn} className="text-xs">
                          {fn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  ref={argsInputRef}
                  placeholder="args (variables)"
                  className="h-7 text-xs flex-1 min-w-[70px]"
                  value={args}
                  onFocus={() => setShowArgSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowArgSuggestions(false), 150)
                  }
                  onChange={(e) => {
                    setArgs(e.target.value);
                    debouncedUpdateRunner(
                      payload.runner.id,
                      [runnerTarget[0], runnerTarget[1]],
                      e.target.value.split(",").map((v) => v.trim()),
                    );
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Set hint: show variable type and expected format */}
        {isSet && varType && (
          <div className="rounded bg-slate-50 border border-slate-200 px-2 py-1 text-xs flex items-center gap-1.5">
            <span className="bg-slate-200 text-slate-700 px-1.5 rounded font-mono text-[11px]">
              {varType}
            </span>
            <span className="text-slate-500">
              {SET_VALUE_HINTS[varType] ?? "Enter a value"}
            </span>
          </div>
        )}

        {/* Call args: variable name chips */}
        {!isSet && !isCode && showArgSuggestions && variables.length > 0 && (
          <div className="rounded bg-slate-50 border border-slate-200 p-2 text-xs space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              variables
            </p>
            <div className="flex flex-wrap gap-1">
              {variables.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertArgVar(v.name);
                  }}
                  className="font-mono text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {v.name}
                  {v.type && (
                    <span className="text-slate-400 ml-0.5">:{v.type}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const RunnerDefiner = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .variables,
  );
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const runner = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .runner,
  );
  const { run } = useRunner();
  const [dragState, setDragState] = React.useState<{
    dragIndex: number | null;
    dragOverIndex: number | null;
  }>({ dragIndex: null, dragOverIndex: null });

  const allTyped = variables.length > 0 && variables.every((v) => v.type);
  const runDisabled =
    !runner.length ||
    !runner.every((r) => {
      if (r.type === "code") return !!r.target[0];
      return r.target[0] && r.target[1];
    });

  const handleDragStart = (index: number) => {
    setDragState({ dragIndex: index, dragOverIndex: null });
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragState.dragIndex !== index) {
      setDragState((prev) => ({ ...prev, dragOverIndex: index }));
    }
  };

  const handleDragEnd = () => {
    setDragState({ dragIndex: null, dragOverIndex: null });
  };

  const handleDrop = (toIndex: number) => {
    if (dragState.dragIndex !== null && dragState.dragIndex !== toIndex) {
      dispatch(
        reorderRunnerSteps({
          fromIndex: dragState.dragIndex,
          toIndex,
        }),
      );
    }
    setDragState({ dragIndex: null, dragOverIndex: null });
  };

  return (
    <div className="w-full space-y-1.5">
      <InstructionPanel />

      <div className="flex items-center gap-1.5">
        <Badge variant="secondary" className="text-xs py-0">
          Runner
        </Badge>
        <Badge variant="outline" className="text-xs py-0">
          {runner.length} {runner.length === 1 ? "step" : "steps"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-md border p-1.5">
        <Button
          variant="outline"
          className="flex-1 h-7 text-xs gap-1 min-w-max"
          disabled={!allTyped}
          onClick={() => dispatch(createSetRunner())}
          title={
            !allTyped
              ? "All variables need a type first"
              : "Add a Set Variable step"
          }
        >
          <IconTriangleFilled size={12} />
          Set Variable
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-7 text-xs gap-1 min-w-max"
          disabled={!functions.length}
          onClick={() => dispatch(createCallRunner())}
          title={
            !functions.length
              ? "Create functions first"
              : "Add a Call Function step"
          }
        >
          <IconSquareFilled size={12} />
          Call Function
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-7 text-xs gap-1 min-w-max"
          disabled={!allTyped}
          onClick={() => dispatch(createCodeRunner())}
          title={
            !allTyped
              ? "All variables need a type first"
              : "Add a Code block step"
          }
        >
          <IconCode size={12} />
          Code
        </Button>
        <Button
          variant="default"
          className="flex-1 h-7 text-xs gap-1 min-w-max text-white"
          disabled={runDisabled}
          onClick={run}
          title={runDisabled ? "Complete all steps first" : "Execute all steps"}
        >
          <IconRun size={12} />
          Run
        </Button>
      </div>

      {runner.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
          No steps yet — add <strong>Set Variable</strong> or{" "}
          <strong>Call Function</strong>.
        </p>
      ) : (
        runner.map((r, index) => (
          <RunnerInput
            key={r.id}
            runner={r}
            runnerIndex={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            isDragging={dragState.dragIndex === index}
            isDragOver={dragState.dragOverIndex === index}
          />
        ))
      )}
    </div>
  );
};

export default RunnerDefiner;
