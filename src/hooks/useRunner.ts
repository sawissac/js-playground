"use client";

import { fnRunner } from "@/lib/function-utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateVariableValue } from "@/state/slices/editorSlice";
import { addLog } from "@/state/slices/logSlice";

export const useRunner = () => {
  const variables = useAppSelector((state) => state.editor.variables);
  const functions = useAppSelector((state) => state.editor.functions);
  const runner = useAppSelector((state) => state.editor.runner);
  const dispatch = useAppDispatch();

  const run = () => {
    try {
      // Create a local copy of variables to track updates during execution
      const updatedVariables = [...variables];

      for (const run of runner) {
        if (run.type === "set") {
          const variableIndex = updatedVariables.findIndex((v) => v.name === run.target[0]);

          if (variableIndex === -1) {
            throw new Error(`Variable ${run.target[0]} not found`);
          }

          dispatch(
            addLog({
              type: "info",
              message: `Setting variable ${run.target[0]} to ${run.target[1]}`,
            })
          );

          // Update local copy of variables with new value
          updatedVariables[variableIndex] = {
            ...updatedVariables[variableIndex],
            value: run.target[1],
          };

          dispatch(
            updateVariableValue({
              name: run.target[0],
              value: run.target[1],
            })
          );
        }

        if (run.type === "call") {
          // Use the updated local copy instead of the Redux state
          const variable = updatedVariables.find((v) => v.name === run.target[0]);
          const func = functions.find((f) => f.name === run.target[1]);

          if (!variable) {
            throw new Error(`Variable ${run.target[0]} not found`);
          }

          if (!func) {
            throw new Error(`Function ${run.target[1]} not found`);
          }

          dispatch(
            addLog({
              type: "info",
              message: `Function ${run.target[1]} called with value ${variable.value}`,
            })
          );

          const result = fnRunner(variable.value, func.actions);

          // Update local copy with result
          const resultVarIndex = updatedVariables.findIndex((v) => v.name === variable.name);
          if (resultVarIndex !== -1) {
            updatedVariables[resultVarIndex] = {
              ...updatedVariables[resultVarIndex],
              value: result,
            };
          }

          dispatch(
            updateVariableValue({
              name: variable.name,
              value: result,
            })
          );

          dispatch(
            addLog({
              type: "info",
              message: `Result: ${result}`,
            })
          );
        }
      }
    } catch (error: any) {
      dispatch(
        addLog({
          type: "error",
          message: error.message,
        })
      );
    }
  };

  return {
    run,
  };
};
