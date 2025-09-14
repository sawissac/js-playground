"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  IconArrowLeftSquareFilled,
  IconArrowsDown,
  IconBox,
  IconEqual,
  IconRun,
  IconSquareFilled,
  IconTrash,
  IconTriangleFilled,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { Badge } from "@/components/ui/badge";
import {
  createCallRunner,
  createSetRunner,
  removeRunner,
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

const RunnerInput = (payload: { runnerIndex: number }) => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.editor.variables);
  const functions = useAppSelector((state) => state.editor.functions);
  const runner = useAppSelector((state) => state.editor.runner);
  const [value, setValue] = useState<string>("");

  const runnerType = useMemo(() => {
    return runner[payload.runnerIndex].type;
  }, [runner, payload.runnerIndex]);

  const runnerTarget = useMemo(() => {
    return runner[payload.runnerIndex].target;
  }, [runner, payload.runnerIndex]);

  const funcList = useMemo(() => {
    const varType = variables.find((v) => v.name === runnerTarget[0])?.type;
    return functions
      .filter((func) => func.dataType === varType)
      .map((func) => func.name);
  }, [functions, runnerTarget]);

  const handleUpdateRunner = (
    runnerIndex: number,
    target: [string, string]
  ) => {
    dispatch(
      updateRunner({
        runnerIndex,
        target,
      })
    );
  };

  const handleRemoveRunner = (runnerIndex: number) => {
    dispatch(removeRunner(runnerIndex));
  };

  const debouncedUpdateRunner = useDebounce(handleUpdateRunner, 300);

  return (
    <>
      <div
        className={cn(
          "flex flex-row justify-start mb-0 pl-2",
          payload.runnerIndex === 0 && "hidden"
        )}
      >
        <IconArrowsDown size={16} className="shrink-0" />
      </div>
      <div className="flex flex-row gap-2 shadow-md shadow-slate-200 rounded-md p-2 items-center">
        {runnerType === "set" ? (
          <IconTriangleFilled size={16} className="shrink-0" />
        ) : (
          <IconSquareFilled size={16} className="shrink-0" />
        )}

        <IconBox size={16} className="shrink-0" />

        <Select
          value={runnerTarget[0]}
          onValueChange={(value) =>
            debouncedUpdateRunner(payload.runnerIndex, [value, runnerTarget[1]])
          }
        >
          <SelectTrigger className="w-[150px] shrink-0">
            <SelectValue placeholder="Target Variable" />
          </SelectTrigger>
          <SelectContent>
            {variables.map((variable, index) => (
              <SelectItem key={index} value={variable.name}>
                {variable.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {runnerType === "set" ? (
          <>
            <IconEqual size={16} className="shrink-0" />
            <Input
              value={value}
              placeholder="Value"
              className="flex-1"
              onChange={(e) => {
                setValue(e.target.value);
                debouncedUpdateRunner(payload.runnerIndex, [
                  runnerTarget[0],
                  e.target.value,
                ]);
              }}
            />
          </>
        ) : (
          <>
            <IconArrowLeftSquareFilled size={16} className="shrink-0" />
            <Select
              value={runnerTarget[1]}
              onValueChange={(value) =>
                debouncedUpdateRunner(payload.runnerIndex, [
                  runnerTarget[0],
                  value,
                ])
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Use Function" />
              </SelectTrigger>
              <SelectContent>
                {funcList.map((func, index) => (
                  <SelectItem key={index} value={func}>
                    {func}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <Button
          variant="destructive"
          onClick={() => handleRemoveRunner(payload.runnerIndex)}
        >
          <IconTrash size={16} className="shrink-0" />
        </Button>
      </div>
    </>
  );
};

const RunnerDefiner = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.editor.variables);
  const functions = useAppSelector((state) => state.editor.functions);
  const runner = useAppSelector((state) => state.editor.runner);
  const { run } = useRunner();

  const handleSetRunner = () => {
    dispatch(createSetRunner());
  };

  const handleCallRunner = () => {
    dispatch(createCallRunner());
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-row gap-2">
        <Badge variant="secondary">Runner Steps</Badge>
        <Badge variant="outline">{runner.length}</Badge>
      </div>
      <div className="flex flex-row gap-2 shadow-md shadow-slate-200 rounded-md p-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={!variables.length || !variables.every((v) => v.type)}
          onClick={handleSetRunner}
        >
          <IconTriangleFilled size={16} className="shrink-0" />
          Set Variable
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!functions.length}
          onClick={handleCallRunner}
        >
          <IconSquareFilled size={16} className="shrink-0" />
          Call Function
        </Button>
        <Button
          variant="default"
          disabled={
            !runner.length || !runner.every((r) => r.target[0] && r.target[1])
          }
          onClick={run}
        >
          <IconRun size={16} className="shrink-0" />
          Run
        </Button>
      </div>

      {runner.map((run, index) => (
        <RunnerInput key={index} runnerIndex={index} />
      ))}
    </div>
  );
};

export default RunnerDefiner;
