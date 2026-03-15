"use client";

import { fnRunner, deepClone } from "@/lib/function-utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateVariableValue } from "@/state/slices/editorSlice";
import { addLog, clearLogs } from "@/state/slices/logSlice";

// AsyncFunction constructor for async code blocks
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export const useRunner = () => {
  const variables = useAppSelector((state) => state.editor.packages.find(p => p.id === state.editor.activePackageId)!.variables);
  const functions = useAppSelector((state) => state.editor.packages.find(p => p.id === state.editor.activePackageId)!.functions);
  const runner = useAppSelector((state) => state.editor.packages.find(p => p.id === state.editor.activePackageId)!.runner);
  const dispatch = useAppDispatch();

  const run = async () => {
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

        if (run.type === "code") {
          const variable = updatedVariables.find(
            (v) => v.name === run.target[0],
          );

          if (!variable) {
            throw new Error(`Variable ${run.target[0]} not found`);
          }

          dispatch(
            addLog({
              type: "info",
              message: `${run.target[0]} ← code block`,
              context: stepLabel,
            }),
          );

          // Build token context
          const tokenCtx: Record<string, any> = {
            this: deepClone(variable.value),
            t: deepClone(variable.value),
            space: " ",
            s: " ",
            comma: ",",
            c: ",",
            empty: "",
            e: "",
          };

          // Transform code: replace @token with __ctx__["token"]
          let code = run.code || "return undefined;";
          code = code.replace(/@(\w+(?:\.\w+)*)/g, (_match, token) => {
            const dotIndex = token.indexOf(".");
            if (dotIndex === -1) {
              return `__ctx__["${token}"]`;
            }
            const base = token.slice(0, dotIndex);
            const rest = token.slice(dotIndex);
            return `__ctx__["${base}"]${rest}`;
          });

          // Build safe variable names as function parameters
          const safeVarNames = updatedVariables
            .filter((v) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v.name))
            .map((v) => v.name);
          const safeVarValues = safeVarNames.map((name) => {
            const v = updatedVariables.find((uv) => uv.name === name);
            return deepClone(v?.value);
          });

          // eslint-disable-next-line no-new-func
          const fn = new AsyncFunction("__ctx__", ...safeVarNames, code);
          const result = await fn(tokenCtx, ...safeVarValues);

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
              context: "code",
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

          const result = await fnRunner(
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
