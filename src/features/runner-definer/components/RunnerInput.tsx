import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  IconArrowLeftSquareFilled,
  IconArrowsDown,
  IconCode,
  IconEqual,
  IconGripVertical,
  IconSquareFilled,
  IconTrash,
  IconTriangleFilled,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { Badge } from "@/components/ui/badge";
import { removeRunner, updateRunner } from "@/state/slices/editorSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/code-editor";
import { CODE_TOKENS, SET_VALUE_HINTS } from "../constants";

export const RunnerInput = (payload: {
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
