"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  IconCode,
  IconRun,
  IconSquareFilled,
  IconTriangleFilled,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { RunnerInstructionPanel } from "./components/RunnerInstructionPanel";
import { RunnerInput } from "./components/RunnerInput";
import { useRunnerDefinerManager } from "./hooks/useRunnerDefinerManager";

const RunnerDefiner = () => {
  const {
    functions,
    runner,
    dragState,
    allTyped,
    runDisabled,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleCreateSetRunner,
    handleCreateCallRunner,
    handleCreateCodeRunner,
    handleRun,
  } = useRunnerDefinerManager();

  return (
    <div className="w-full space-y-1.5">
      <RunnerInstructionPanel />

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
          onClick={handleCreateSetRunner}
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
          onClick={handleCreateCallRunner}
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
          onClick={handleCreateCodeRunner}
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
          onClick={handleRun}
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
