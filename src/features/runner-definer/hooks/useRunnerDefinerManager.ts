import React from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  createCallRunner,
  createCodeRunner,
  createSetRunner,
  reorderRunnerSteps,
} from "@/state/slices/editorSlice";
import { useRunner } from "@/hooks/useRunner";

export const useRunnerDefinerManager = () => {
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

  const handleCreateSetRunner = () => dispatch(createSetRunner());
  const handleCreateCallRunner = () => dispatch(createCallRunner());
  const handleCreateCodeRunner = () => dispatch(createCodeRunner());
  const handleRun = () => run({ onlyActivePackage: true });

  return {
    variables,
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
  };
};
