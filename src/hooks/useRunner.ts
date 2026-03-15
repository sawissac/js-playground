"use client";

import { fnRunner, deepClone } from "@/lib/function-utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateVariableValue } from "@/state/slices/editorSlice";
import { addLog, clearLogs } from "@/state/slices/logSlice";

export const useRunner = () => {
  const variables = useAppSelector((state) => state.editor.variables);
  const functions = useAppSelector((state) => state.editor.functions);
  const runner = useAppSelector((state) => state.editor.runner);
  const dispatch = useAppDispatch();

  const run = () => {
    dispatch(clearLogs());
    dispatch(
      addLog({
        type: "info",
        message: `Starting execution — ${runner.length} step${runner.length !== 1 ? "s" : ""}`,
        context: "runner",
      }),
    );

    try {
      const updatedVariables = variables.map((v) => ({
        ...v,
        value: deepClone(v.value),
      }));

      for (let stepIndex = 0; stepIndex < runner.length; stepIndex++) {
        const run = runner[stepIndex];
        const stepLabel = `step ${stepIndex + 1}`;

        if (run.type === "set") {
          const variable = updatedVariables.find(
            (v) => v.name === run.target[0],
          );
          const variableIndex = updatedVariables.findIndex(
            (v) => v.name === run.target[0],
          );

          if (variableIndex === -1 || !variable) {
            throw new Error(`Variable ${run.target[0]} not found`);
          }

          const dataType = variables.find(
            (v) => v.name === run.target[0],
          )?.type;

          let valueReturn = null;

          switch (dataType) {
            case "string":
              valueReturn = run.target[1];
              break;
            case "array":
              valueReturn = run.target[1].split(",").map((v) => v.trim());
              break;
            case "number":
              valueReturn = Number(run.target[1]);
              break;
            case "boolean":
              valueReturn = run.target[1] === "true";
              break;
            case "object":
              valueReturn = JSON.parse(run.target[1]);
              break;
            default:
              valueReturn = run.target[1];
          }

          updatedVariables[variableIndex] = {
            ...updatedVariables[variableIndex],
            value: valueReturn,
          };

          dispatch(
            updateVariableValue({
              id: variable.id,
              value: valueReturn,
            }),
          );

          dispatch(
            addLog({
              type: "info",
              message: `${run.target[0]} = ${JSON.stringify(valueReturn)}`,
              context: stepLabel,
            }),
          );
        }

        if (run.type === "call") {
          const variable = updatedVariables.find(
            (v) => v.name === run.target[0],
          );

          const func = functions.find((f) => f.name === run.target[1]);

          if (!variable) {
            throw new Error(`Variable ${run.target[0]} not found`);
          }

          if (!func) {
            throw new Error(`Function ${run.target[1]} not found`);
          }

          const argNames = run.args.length ? run.args.join(", ") : "";
          dispatch(
            addLog({
              type: "info",
              message: `${run.target[0]} ← ${run.target[1]}(${argNames})`,
              context: stepLabel,
            }),
          );

          const result = fnRunner(
            deepClone(variable.value),
            run.args.map((arg) =>
              deepClone(updatedVariables.find((v) => v.name === arg)?.value),
            ),
            func.actions,
            functions,
          );

          const resultVarIndex = updatedVariables.findIndex(
            (v) => v.name === variable.name,
          );

          if (resultVarIndex !== -1) {
            updatedVariables[resultVarIndex] = {
              ...updatedVariables[resultVarIndex],
              value: result,
            };
          }

          dispatch(
            updateVariableValue({
              id: variable.id,
              value: result,
            }),
          );

          dispatch(
            addLog({
              type: "info",
              message: `→ ${JSON.stringify(result)}`,
              context: run.target[1],
            }),
          );
        }
      }

      dispatch(
        addLog({
          type: "info",
          message: "Execution complete",
          context: "runner",
        }),
      );
    } catch (error: any) {
      dispatch(
        addLog({
          type: "error",
          message: error.message,
          context: "error",
        }),
      );
    }
  };

  return {
    run,
  };
};
