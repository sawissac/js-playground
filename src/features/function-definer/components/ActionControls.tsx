import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  removeWhenSubAction,
  updateWhenSubAction,
  addCodeSnippet,
  removeLoopSubAction,
  updateLoopSubAction,
  addLoopSubAction,
  updateLoopParams,
  addWhenSubAction,
  removeFunctionAction,
  updateFunctionAction,
} from "@/state/slices/editorSlice";
import { FunctionActionInterface } from "@/state/types";
import { useDebounce } from "@/hooks/useDebounce";
import { ArrayFunctions } from "@/constants/array";
import { BooleanFunctions } from "@/constants/boolean";
import { NumberFunctions } from "@/constants/number";
import { ObjectFunctions } from "@/constants/object";
import { StringFunctions } from "@/constants/string";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTrash, IconCircleDashedPlus, IconGripVertical } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeEditor } from "@/components/code-editor";
import { CALL_PREFIX } from "../constants";
import { buildAtTokens } from "../hooks/useFunctionHelpers";
import { MethodSelector } from "./MethodSelector";
import { SuggestionPanel } from "./SuggestionPanel";
import { IfConditionBuilder } from "./IfConditionBuilder";

export const WhenSubActionRow = ({
  functionId,
  whenActionId,
  subActionId,
  subActionIndex,
  outerPrecedingActions,
}: {
  functionId: string;
  whenActionId: string;
  subActionId: string;
  subActionIndex: number;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputFocusedRef = React.useRef(false);

  const whenAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === whenActionId);

  const subAction = whenAction?.subActions?.find((sa) => sa.id === subActionId);
  const subActionName = (subAction?.name ?? "") as string;
  const subActionDataType = (subAction?.dataType ?? "") as string;
  const subActionValue = (subAction?.value?.join(",") ?? "") as string;
  const subActionCodeName = subAction?.codeName ?? "";

  const codeSnippets = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .codeSnippets,
  );
  const [codeName, setCodeName] = React.useState(subActionCodeName);
  const codeNameRef = React.useRef(subActionCodeName);

  React.useEffect(() => {
    setCodeName(subActionCodeName);
    codeNameRef.current = subActionCodeName;
  }, [subActionCodeName]);

  // Don't sync from Redux while the user is actively typing — it trims trailing
  // spaces mid-keystroke and causes characters to be dropped.
  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(subActionValue);
  }, [subActionValue]);
  React.useEffect(() => {
    setShowExamples(true);
  }, [subActionName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== functionId),
    [functions, functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (subActionDataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      case "array":
        typedFunctions = ArrayFunctions;
        break;
      case "number":
        typedFunctions = NumberFunctions;
        break;
      case "boolean":
        typedFunctions = BooleanFunctions;
        break;
      case "object":
        typedFunctions = ObjectFunctions;
        break;
    }
    const magic: { name: string | number; params: string | number }[] = [
      { name: "math", params: "n" },
      { name: "temp", params: 1 },
      { name: "return", params: 1 },
      { name: "use", params: 1 },
      { name: "code", params: "n" },
    ];
    const callEntries = callableFunctions.map((fn) => ({
      name: `${CALL_PREFIX}${fn.name}`,
      params: "n" as string | number,
    }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [subActionDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === subActionName)?.params ?? 0,
    [funcList, subActionName],
  );

  const innerPrecedingSubActions = useMemo(
    () => whenAction?.subActions?.slice(0, subActionIndex) ?? [],
    [whenAction, subActionIndex],
  );

  const atTokens = useMemo(() => {
    const all = [...outerPrecedingActions, ...innerPrecedingSubActions];
    return buildAtTokens(
      all.filter((a) => a.name === "temp").length,
      all.filter((a) => a.name === "math").length,
      all.length,
      all.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions, innerPrecedingSubActions]);

  const dispatchUpdateImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateWhenSubAction({
        functionId,
        whenActionId,
        subActionId,
        subAction: {
          id: subActionId,
          name: actionName,
          dataType: actionDataType,
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" || actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };
  const dispatchUpdate = useDebounce(dispatchUpdateImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    dispatchUpdateImpl({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: subActionValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    dispatchUpdateImpl({
      actionName: "code",
      actionDataType: subActionDataType,
      actionValue: snippet.code,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: val,
    });
  };

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    if (!atMatch) return;
    const start = cursor - atMatch[0].length;
    const newVal = val.slice(0, start) + token + val.slice(cursor);
    setValue(newVal);
    setAtQuery(null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: newVal,
    });
    setTimeout(() => {
      if (inputRef.current) {
        const pos = start + token.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  return (
    <div className="rounded border border-slate-200 p-1.5 space-y-1.5 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {subActionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={() =>
            dispatch(
              removeWhenSubAction({ functionId, whenActionId, subActionId }),
            )
          }
          className="h-5 w-5 ml-auto"
        >
          <IconTrash size={11} />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Select
          value={subActionDataType}
          onValueChange={(v) =>
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: v,
              actionValue: subActionValue,
            })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[90px] h-7 text-xs",
              !subActionDataType && "border-red-400",
            )}
          >
            <SelectValue placeholder="type" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((dt, i) => (
              <SelectItem key={i} value={dt} className="text-xs">
                {dt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MethodSelector
          value={subActionName}
          funcList={funcList}
          funcDataType={subActionDataType}
          onChange={(v) =>
            dispatchUpdate({
              actionName: v,
              actionDataType: subActionDataType,
              actionValue: subActionValue,
            })
          }
        />

        {paramsCount !== 0 &&
          subActionName !== "if" &&
          subActionName !== "code" && (
            <Input
              ref={inputRef}
              className="flex-1 min-w-[80px] h-7 text-xs"
              placeholder={
                paramsCount === "n"
                  ? "@arg1, @arg2"
                  : Array.from({ length: paramsCount as number })
                      .map((_, i) => `@arg${i + 1}`)
                      .join(", ")
              }
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
                setTimeout(() => setAtQuery(null), 150);
              }}
            />
          )}
      </div>

      {subActionName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              dispatchUpdate({
                actionName: "code",
                actionDataType: subActionDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {subActionName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {subActionName !== "if" && subActionName !== "code" && (
        <SuggestionPanel
          dataType={subActionDataType}
          methodName={subActionName}
          atQuery={atQuery}
          atTokens={atTokens}
          showExamples={showExamples}
          inputValue={value}
          onTokenSelect={insertToken}
          onExampleSelect={(expr) => {
            setValue(expr);
            setAtQuery(null);
            setShowExamples(false);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
};


export const LoopSubActionRow = ({
  functionId,
  loopActionId,
  subActionId,
  subActionIndex,
  outerPrecedingActions,
}: {
  functionId: string;
  loopActionId: string;
  subActionId: string;
  subActionIndex: number;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputFocusedRef = React.useRef(false);

  const loopAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === loopActionId);

  const subAction = loopAction?.subActions?.find((sa) => sa.id === subActionId);
  const subActionName = (subAction?.name ?? "") as string;
  const subActionDataType = (subAction?.dataType ?? "") as string;
  const subActionValue = (subAction?.value?.join(",") ?? "") as string;
  const subActionCodeName = subAction?.codeName ?? "";

  const codeSnippets = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .codeSnippets,
  );
  const [codeName, setCodeName] = React.useState(subActionCodeName);
  const codeNameRef = React.useRef(subActionCodeName);

  React.useEffect(() => {
    setCodeName(subActionCodeName);
    codeNameRef.current = subActionCodeName;
  }, [subActionCodeName]);

  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(subActionValue);
  }, [subActionValue]);
  React.useEffect(() => {
    setShowExamples(true);
  }, [subActionName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== functionId),
    [functions, functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (subActionDataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      case "array":
        typedFunctions = ArrayFunctions;
        break;
      case "number":
        typedFunctions = NumberFunctions;
        break;
      case "boolean":
        typedFunctions = BooleanFunctions;
        break;
      case "object":
        typedFunctions = ObjectFunctions;
        break;
    }
    const magic: { name: string | number; params: string | number }[] = [
      { name: "math", params: "n" },
      { name: "temp", params: 1 },
      { name: "return", params: 1 },
      { name: "use", params: 1 },
      { name: "code", params: "n" },
    ];
    const callEntries = callableFunctions.map((fn) => ({
      name: `${CALL_PREFIX}${fn.name}`,
      params: "n" as string | number,
    }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [subActionDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === subActionName)?.params ?? 0,
    [funcList, subActionName],
  );

  const innerPrecedingSubActions = useMemo(
    () => loopAction?.subActions?.slice(0, subActionIndex) ?? [],
    [loopAction, subActionIndex],
  );

  const atTokens = useMemo(() => {
    const all = [...outerPrecedingActions, ...innerPrecedingSubActions];
    return buildAtTokens(
      all.filter((a) => a.name === "temp").length,
      all.filter((a) => a.name === "math").length,
      all.length,
      all.filter((a) => a.name === "if").length,
      { loopContext: true },
    );
  }, [outerPrecedingActions, innerPrecedingSubActions]);

  const dispatchUpdateImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateLoopSubAction({
        functionId,
        loopActionId,
        subActionId,
        subAction: {
          id: subActionId,
          name: actionName,
          dataType: actionDataType,
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" || actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };
  const dispatchUpdate = useDebounce(dispatchUpdateImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    dispatchUpdateImpl({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: subActionValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    dispatchUpdateImpl({
      actionName: "code",
      actionDataType: subActionDataType,
      actionValue: snippet.code,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: val,
    });
  };

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    if (!atMatch) return;
    const start = cursor - atMatch[0].length;
    const newVal = val.slice(0, start) + token + val.slice(cursor);
    setValue(newVal);
    setAtQuery(null);
    dispatchUpdate({
      actionName: subActionName,
      actionDataType: subActionDataType,
      actionValue: newVal,
    });
    setTimeout(() => {
      if (inputRef.current) {
        const pos = start + token.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  return (
    <div className="rounded border border-slate-200 p-1.5 space-y-1.5 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {subActionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={() =>
            dispatch(
              removeLoopSubAction({ functionId, loopActionId, subActionId }),
            )
          }
          className="h-5 w-5 ml-auto"
        >
          <IconTrash size={11} />
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Select
          value={subActionDataType}
          onValueChange={(v) =>
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: v,
              actionValue: subActionValue,
            })
          }
        >
          <SelectTrigger
            className={cn(
              "w-[90px] h-7 text-xs",
              !subActionDataType && "border-red-400",
            )}
          >
            <SelectValue placeholder="type" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((dt, i) => (
              <SelectItem key={i} value={dt} className="text-xs">
                {dt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <MethodSelector
          value={subActionName}
          funcList={funcList}
          funcDataType={subActionDataType}
          onChange={(v) =>
            dispatchUpdate({
              actionName: v,
              actionDataType: subActionDataType,
              actionValue: subActionValue,
            })
          }
        />

        {paramsCount !== 0 &&
          subActionName !== "if" &&
          subActionName !== "code" && (
            <Input
              ref={inputRef}
              className="flex-1 min-w-[80px] h-7 text-xs"
              placeholder={
                paramsCount === "n"
                  ? "@arg1, @arg2"
                  : Array.from({ length: paramsCount as number })
                      .map((_, i) => `@arg${i + 1}`)
                      .join(", ")
              }
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
                setTimeout(() => setAtQuery(null), 150);
              }}
            />
          )}
      </div>

      {subActionName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              dispatchUpdate({
                actionName: "code",
                actionDataType: subActionDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {subActionName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {subActionName !== "if" && subActionName !== "code" && (
        <SuggestionPanel
          dataType={subActionDataType}
          methodName={subActionName}
          atQuery={atQuery}
          atTokens={atTokens}
          showExamples={showExamples}
          inputValue={value}
          onTokenSelect={insertToken}
          onExampleSelect={(expr) => {
            setValue(expr);
            setAtQuery(null);
            setShowExamples(false);
            dispatchUpdate({
              actionName: subActionName,
              actionDataType: subActionDataType,
              actionValue: expr,
            });
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        />
      )}
    </div>
  );
};


export const LoopBlock = ({
  functionId,
  loopActionId,
  outerPrecedingActions,
}: {
  functionId: string;
  loopActionId: string;
  outerPrecedingActions: FunctionActionInterface[];
}) => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );

  const loopAction = functions
    .find((fn) => fn.id === functionId)
    ?.actions.find((a) => a.id === loopActionId);

  const subActions = loopAction?.subActions ?? [];
  const loopParams = loopAction?.loopParams ?? {
    start: "0",
    end: "@this.length",
    step: "1",
  };

  const atTokens = useMemo(() => {
    return buildAtTokens(
      outerPrecedingActions.filter((a) => a.name === "temp").length,
      outerPrecedingActions.filter((a) => a.name === "math").length,
      outerPrecedingActions.length,
      outerPrecedingActions.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions]);

  const updateParams = useDebounce(
    (params: { start?: string; end?: string; step?: string }) => {
      dispatch(
        updateLoopParams({ functionId, loopActionId, loopParams: params }),
      );
    },
    300,
  );

  return (
    <div className="mt-1 space-y-1">
      <div className="rounded-md bg-indigo-50 border border-indigo-200 p-2 space-y-2">
        <p className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wide">
          Loop Parameters
        </p>
        <p className="text-[11px] text-indigo-600 leading-relaxed">
          Iterates from <strong>start</strong> to <strong>end</strong> by{" "}
          <strong>step</strong>. Use positive step to count up, negative to
          count down. Supports @ tokens like{" "}
          <code className="bg-indigo-100 px-1 rounded text-[10px]">
            @this.length
          </code>
          .
        </p>
        <div className="border-t border-indigo-200 pt-1.5 space-y-1.5">
          <p className="text-[10px] text-indigo-700 font-semibold uppercase tracking-wide">
            How sub-actions work
          </p>
          <div className="text-[11px] text-indigo-600 leading-relaxed space-y-1">
            <p>
              By default, each sub-action operates on the{" "}
              <strong>full current value</strong> (the whole array or object).
              Methods like{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                join
              </code>
              ,{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                reverse
              </code>
              , or{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                length
              </code>{" "}
              apply to the entire collection on each iteration.
            </p>
            <p>
              To work with <strong>individual elements</strong>, add{" "}
              <code className="bg-indigo-100 px-1 rounded text-[10px]">
                use @this
              </code>{" "}
              as the first sub-action — it switches context to the current
              element. All subsequent actions then chain off that element.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-1">
            <div className="rounded bg-white border border-indigo-200 p-1.5">
              <p className="text-[10px] text-indigo-500 font-semibold mb-0.5">
                Whole collection (no use)
              </p>
              <p className="text-[10px] text-indigo-800 font-mono">
                loop 0..3 → join @empty → ["abc","abc","abc"]
              </p>
            </div>
            <div className="rounded bg-white border border-indigo-200 p-1.5">
              <p className="text-[10px] text-indigo-500 font-semibold mb-0.5">
                Per element (with use @this)
              </p>
              <p className="text-[10px] text-indigo-800 font-mono">
                loop 0..3 → use @this → toUpperCase → ["A","B","C"]
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="start (0)"
          defaultValue={loopParams.start}
          onChange={(e) =>
            updateParams({ ...loopParams, start: e.target.value })
          }
        />
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="end (@this.length)"
          defaultValue={loopParams.end}
          onChange={(e) => updateParams({ ...loopParams, end: e.target.value })}
        />
        <Input
          className="flex-1 min-w-[60px] h-7 text-xs"
          placeholder="step (1)"
          defaultValue={loopParams.step}
          onChange={(e) =>
            updateParams({ ...loopParams, step: e.target.value })
          }
        />
      </div>

      <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wide pt-1">
        Process (for each iteration):
      </p>
      <div className="ml-2 border-l-2 border-indigo-200 pl-2 space-y-1">
        {subActions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-1.5 border border-dashed rounded">
            No process actions yet.
          </p>
        ) : (
          subActions.map((sa, idx) => (
            <LoopSubActionRow
              key={sa.id}
              functionId={functionId}
              loopActionId={loopActionId}
              subActionId={sa.id}
              subActionIndex={idx}
              outerPrecedingActions={outerPrecedingActions}
            />
          ))
        )}
        <button
          type="button"
          onClick={() =>
            dispatch(
              addLoopSubAction({
                functionId,
                loopActionId,
                subAction: { id: "", name: "", dataType: "", value: [] },
              }),
            )
          }
          className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 px-1 py-0.5 rounded hover:bg-indigo-50"
        >
          <IconCircleDashedPlus size={11} />
          add process action
        </button>
      </div>
    </div>
  );
};


export const WhenBlock = ({
  functionId,
  whenActionId,
  conditionValue,
  outerPrecedingActions,
  onConditionChange,
}: {
  functionId: string;
  whenActionId: string;
  conditionValue: string;
  outerPrecedingActions: FunctionActionInterface[];
  onConditionChange: (expr: string) => void;
}) => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );

  const subActions =
    functions
      .find((fn) => fn.id === functionId)
      ?.actions.find((a) => a.id === whenActionId)?.subActions ?? [];

  const atTokens = useMemo(() => {
    return buildAtTokens(
      outerPrecedingActions.filter((a) => a.name === "temp").length,
      outerPrecedingActions.filter((a) => a.name === "math").length,
      outerPrecedingActions.length,
      outerPrecedingActions.filter((a) => a.name === "if").length,
    );
  }, [outerPrecedingActions]);

  return (
    <div className="mt-1 space-y-1">
      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">
        Condition:
      </p>
      <IfConditionBuilder
        value={conditionValue}
        atTokens={atTokens}
        onChange={onConditionChange}
      />

      <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide pt-1">
        Then:
      </p>
      <div className="ml-2 border-l-2 border-violet-200 pl-2 space-y-1">
        {subActions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-1.5 border border-dashed rounded">
            No sub-actions yet.
          </p>
        ) : (
          subActions.map((sa, idx) => (
            <WhenSubActionRow
              key={sa.id}
              functionId={functionId}
              whenActionId={whenActionId}
              subActionId={sa.id}
              subActionIndex={idx}
              outerPrecedingActions={outerPrecedingActions}
            />
          ))
        )}
        <button
          type="button"
          onClick={() =>
            dispatch(
              addWhenSubAction({
                functionId,
                whenActionId,
                subAction: { id: "", name: "", dataType: "", value: [] },
              }),
            )
          }
          className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-800 px-1 py-0.5 rounded hover:bg-violet-50"
        >
          <IconCircleDashedPlus size={11} />
          add sub-action
        </button>
      </div>
    </div>
  );
};


export const FunctionActionInput = (payload: {
  functionId: string;
  actionId: string;
  actionDataType: string;
  actionName: string;
  actionIndex: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDrop: (index: number) => void;
  isDragging: boolean;
  isDragOver: boolean;
}) => {
  const dispatch = useAppDispatch();
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  const [value, setValue] = React.useState("");
  const [atQuery, setAtQuery] = React.useState<string | null>(null);
  const [showExamples, setShowExamples] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputFocusedRef = React.useRef(false);

  const funcName = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)?.name ?? "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  // Re-show examples whenever the selected method changes or the input is cleared
  React.useEffect(() => {
    setShowExamples(true);
  }, [funcName]);
  React.useEffect(() => {
    if (value === "") setShowExamples(true);
  }, [value]);

  const funcDataType = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)?.dataType ??
      "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  const funcValue = React.useMemo(() => {
    return (functions
      .find((fn) => fn.id === payload.functionId)
      ?.actions.find((a) => a.id === payload.actionId)
      ?.value?.join(",") ?? "") as string;
  }, [functions, payload.functionId, payload.actionId]);

  const funcCodeName = React.useMemo(() => {
    return (
      functions
        .find((fn) => fn.id === payload.functionId)
        ?.actions.find((a) => a.id === payload.actionId)?.codeName ?? ""
    );
  }, [functions, payload.functionId, payload.actionId]);

  const codeSnippets = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .codeSnippets,
  );
  const [codeName, setCodeName] = React.useState(funcCodeName);
  const codeNameRef = React.useRef(funcCodeName);

  React.useEffect(() => {
    setCodeName(funcCodeName);
    codeNameRef.current = funcCodeName;
  }, [funcCodeName]);

  // Don't sync from Redux while the user is actively typing — it trims trailing
  // spaces mid-keystroke and causes characters to be dropped.
  React.useEffect(() => {
    if (!inputFocusedRef.current) setValue(funcValue);
  }, [funcValue]);

  const callableFunctions = useMemo(
    () => functions.filter((fn) => fn.id !== payload.functionId),
    [functions, payload.functionId],
  );

  const funcList = useMemo(() => {
    let typedFunctions: readonly (readonly [
      string | number,
      string | number,
    ])[] = [];
    switch (funcDataType) {
      case "string":
        typedFunctions = StringFunctions;
        break;
      case "array":
        typedFunctions = ArrayFunctions;
        break;
      case "number":
        typedFunctions = NumberFunctions;
        break;
      case "boolean":
        typedFunctions = BooleanFunctions;
        break;
      case "object":
        typedFunctions = ObjectFunctions;
        break;
    }
    const magic: { name: string | number; params: string | number }[] = [
      { name: "math", params: "n" },
      { name: "temp", params: 1 },
      { name: "return", params: 1 },
      { name: "use", params: 1 },
      { name: "code", params: "n" },
    ];
    const callEntries: { name: string | number; params: string | number }[] =
      callableFunctions.map((fn) => ({
        name: `${CALL_PREFIX}${fn.name}`,
        params: "n",
      }));
    return [
      ...magic,
      ...callEntries,
      ...typedFunctions.map((fn) => ({ name: fn[0], params: fn[1] })),
    ];
  }, [functions, funcDataType, callableFunctions]);

  const paramsCount = useMemo(
    () => funcList.find((fn) => fn.name === funcName)?.params ?? 0,
    [funcList, funcName],
  );

  // Compute available @temp / @math tokens from preceding actions
  const precedingActions = useMemo(() => {
    const actions =
      functions.find((fn) => fn.id === payload.functionId)?.actions ?? [];
    return actions.slice(0, payload.actionIndex);
  }, [functions, payload.functionId, payload.actionIndex]);

  const atTokens = useMemo(() => {
    const tempCount = precedingActions.filter((a) => a.name === "temp").length;
    const mathCount = precedingActions.filter((a) => a.name === "math").length;
    const pickCount = precedingActions.length;
    const ifCount = precedingActions.filter((a) => a.name === "if").length;
    return buildAtTokens(tempCount, mathCount, pickCount, ifCount);
  }, [precedingActions]);

  const handleRemove = () =>
    dispatch(
      removeFunctionAction({
        functionId: payload.functionId,
        actionId: payload.actionId,
      }),
    );

  const handleDatatypeImpl = ({
    actionName,
    actionDataType,
    actionValue,
  }: {
    actionName: string;
    actionDataType: string;
    actionValue: string;
  }) => {
    dispatch(
      updateFunctionAction({
        functionId: payload.functionId,
        actionId: payload.actionId,
        action: {
          id: payload.actionId,
          name: actionName,
          dataType: actionDataType,
          codeName: codeNameRef.current || undefined,
          value:
            actionName === "if" ||
            actionName === "when" ||
            actionName === "loop" ||
            actionName === "code"
              ? [actionValue]
              : actionValue.split(",").map((v) => v.trim()),
        },
      }),
    );
  };

  const handleDatatype = useDebounce(handleDatatypeImpl, 300);

  const handleCodeNameChange = (name: string) => {
    setCodeName(name);
    codeNameRef.current = name;
    handleDatatypeImpl({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: funcValue,
    });
  };

  const handleSaveSnippet = () => {
    const name = codeNameRef.current.trim();
    if (!name || !value.trim()) return;
    dispatch(addCodeSnippet({ name, code: value }));
  };

  const handleLoadSnippet = (snippetId: string) => {
    const snippet = codeSnippets.find((s) => s.id === snippetId);
    if (!snippet) return;
    setCodeName(snippet.name);
    codeNameRef.current = snippet.name;
    setValue(snippet.code);
    handleDatatypeImpl({
      actionName: "code",
      actionDataType: funcDataType,
      actionValue: snippet.code,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    // Detect @ token being typed (including parentheses for @pick(N))
    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    setAtQuery(atMatch ? atMatch[1] : null);

    handleDatatype({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: val,
    });
  };

  const insertToken = (token: string) => {
    const input = inputRef.current;
    if (!input) return;
    const val = input.value;
    const cursor = input.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/@([\w()]*(?:\([^)]*)?)?$/);
    if (!atMatch) return;
    const start = cursor - atMatch[0].length;
    const newVal = val.slice(0, start) + token + val.slice(cursor);
    setValue(newVal);
    setAtQuery(null);
    handleDatatype({
      actionName: funcName,
      actionDataType: funcDataType,
      actionValue: newVal,
    });
    setTimeout(() => {
      if (inputRef.current) {
        const pos = start + token.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  return (
    <div
      draggable
      onDragStart={() => payload.onDragStart(payload.actionIndex)}
      onDragOver={(e) => payload.onDragOver(e, payload.actionIndex)}
      onDragEnd={payload.onDragEnd}
      onDrop={() => payload.onDrop(payload.actionIndex)}
      className={cn(
        "rounded border border-slate-200 p-1.5 my-1 space-y-1.5 transition-all cursor-move",
        "hover:shadow-sm hover:border-slate-300",
        payload.isDragging && "opacity-40 scale-95",
        payload.isDragOver && "border-blue-400 bg-blue-50 border-2",
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        <IconGripVertical
          size={14}
          className="shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing"
        />
        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0 rounded">
          {payload.actionIndex + 1}
        </span>
        <Button
          variant="destructive"
          size="icon"
          onClick={handleRemove}
          className={cn(
            "h-5 w-5 ml-auto transition-all duration-200",
            "hover:scale-110 active:scale-95",
          )}
        >
          <IconTrash size={11} />
        </Button>
      </div>

      {/* Selectors row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {funcName !== "when" && funcName !== "loop" && (
          <Select
            defaultValue={payload.actionDataType}
            value={funcDataType}
            onValueChange={(v) =>
              handleDatatype({
                actionName: funcName,
                actionDataType: v,
                actionValue: funcValue,
              })
            }
          >
            <SelectTrigger
              className={cn(
                "w-[90px] h-7 text-xs",
                !funcDataType && "border-red-400 focus:ring-red-200",
              )}
            >
              <SelectValue placeholder="type" />
            </SelectTrigger>
            <SelectContent>
              {dataTypes.map((dt, i) => (
                <SelectItem key={i} value={dt} className="text-xs">
                  {dt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <MethodSelector
          value={funcName}
          funcList={funcList}
          funcDataType={funcDataType}
          onChange={(v) =>
            handleDatatype({
              actionName: v,
              actionDataType: funcDataType,
              actionValue: funcValue,
            })
          }
        />

        {paramsCount !== 0 &&
          funcName !== "if" &&
          funcName !== "when" &&
          funcName !== "loop" &&
          funcName !== "code" && (
            <Input
              ref={inputRef}
              className={cn(
                "flex-1 min-w-[80px] h-7 text-xs transition-all duration-200",
                "focus:ring-2 focus:ring-primary/20",
              )}
              placeholder={
                paramsCount === "n"
                  ? "@arg1, @arg2"
                  : Array.from({ length: paramsCount as number })
                      .map((_, i) => `@arg${i + 1}`)
                      .join(", ")
              }
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                inputFocusedRef.current = true;
              }}
              onBlur={() => {
                inputFocusedRef.current = false;
                setTimeout(() => setAtQuery(null), 150);
              }}
            />
          )}
      </div>

      {/* Code editor block */}
      {funcName === "code" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              className="flex-1 h-7 text-xs"
              placeholder="code name (e.g. formatDate)"
              value={codeName}
              onChange={(e) => handleCodeNameChange(e.target.value)}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2 shrink-0 border-teal-300 text-teal-700 hover:bg-teal-50"
              disabled={!codeName.trim() || !value.trim()}
              onClick={handleSaveSnippet}
            >
              Save
            </Button>
            {codeSnippets.length > 0 && (
              <Select onValueChange={handleLoadSnippet}>
                <SelectTrigger className="w-[120px] h-7 text-xs shrink-0">
                  <SelectValue placeholder="Load snippet" />
                </SelectTrigger>
                <SelectContent>
                  {codeSnippets.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <CodeEditor
            value={value}
            onChange={(newCode) => {
              setValue(newCode);
              handleDatatype({
                actionName: "code",
                actionDataType: funcDataType,
                actionValue: newCode,
              });
            }}
            tokens={atTokens}
            variables={[]}
          />
        </div>
      )}

      {/* If condition builder */}
      {funcName === "if" && (
        <IfConditionBuilder
          value={value}
          atTokens={atTokens}
          onChange={(expr) => {
            setValue(expr);
            handleDatatype({
              actionName: funcName,
              actionDataType: funcDataType,
              actionValue: expr,
            });
          }}
        />
      )}

      {/* When block — condition + nested sub-actions */}
      {funcName === "when" && (
        <WhenBlock
          functionId={payload.functionId}
          whenActionId={payload.actionId}
          conditionValue={value}
          outerPrecedingActions={precedingActions}
          onConditionChange={(expr) => {
            setValue(expr);
            handleDatatype({
              actionName: "when",
              actionDataType: "",
              actionValue: expr,
            });
          }}
        />
      )}

      {/* Loop block — iteration parameters + nested process actions */}
      {funcName === "loop" && (
        <LoopBlock
          functionId={payload.functionId}
          loopActionId={payload.actionId}
          outerPrecedingActions={precedingActions}
        />
      )}

      {/* Suggestion panel */}
      {funcName !== "if" &&
        funcName !== "when" &&
        funcName !== "loop" &&
        funcName !== "code" && (
          <SuggestionPanel
            dataType={funcDataType}
            methodName={funcName}
            atQuery={atQuery}
            atTokens={atTokens}
            showExamples={showExamples}
            inputValue={value}
            onTokenSelect={insertToken}
            onExampleSelect={(expr) => {
              setValue(expr);
              setAtQuery(null);
              setShowExamples(false);
              handleDatatype({
                actionName: funcName,
                actionDataType: funcDataType,
                actionValue: expr,
              });
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          />
        )}
    </div>
  );
};
