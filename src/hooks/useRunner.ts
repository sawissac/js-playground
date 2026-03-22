"use client";

import { fnRunner, deepClone } from "@/lib/function-utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { updateVariableValue } from "@/state/slices/editorSlice";
import { addLog, clearLogs } from "@/state/slices/logSlice";

// AsyncFunction constructor for async code blocks
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

// Sanitize CDN names to valid JavaScript identifiers
const sanitizeCdnName = (name: string): string => {
  // Replace invalid characters with underscores and ensure valid start
  return name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^[0-9]/, "_$&");
};

export const useRunner = () => {
  const packages = useAppSelector((state) => state.editor.packages);
  const dispatch = useAppDispatch();

  const run = async () => {
    dispatch(clearLogs());

    // Get all enabled packages in order
    const enabledPackages = packages.filter((pkg) => pkg.enabled !== false);

    if (enabledPackages.length === 0) {
      dispatch(
        addLog({
          type: "warning",
          message: "No enabled packages to execute",
          context: "runner",
        }),
      );
      return;
    }

    const totalSteps = enabledPackages.reduce(
      (sum, pkg) => sum + pkg.runner.length,
      0,
    );

    dispatch(
      addLog({
        type: "info",
        message: `Starting execution — ${enabledPackages.length} package${enabledPackages.length !== 1 ? "s" : ""}, ${totalSteps} step${totalSteps !== 1 ? "s" : ""}`,
        context: "runner",
      }),
    );

    try {
      // Collect all enabled CDN packages from all enabled packages
      const allCdnPackages = new Map<string, { name: string; url: string }>();
      for (const pkg of enabledPackages) {
        const pkgCdnPackages = pkg.cdnPackages || [];
        for (const cdn of pkgCdnPackages) {
          if (cdn.enabled && !allCdnPackages.has(cdn.name)) {
            allCdnPackages.set(cdn.name, { name: cdn.name, url: cdn.url });
          }
        }
      }

      // Load enabled CDN packages via <script> tags
      const cdnModules: Record<string, any> = {};
      const cdnNameMap: Record<string, string> = {}; // maps safe name -> original name

      for (const cdn of allCdnPackages.values()) {
        const safeName = sanitizeCdnName(cdn.name);
        cdnNameMap[safeName] = cdn.name;

        // Skip if already loaded on window
        if ((window as any)[cdn.name]) {
          cdnModules[safeName] = (window as any)[cdn.name];
          dispatch(
            addLog({
              type: "info",
              message: `CDN ready: ${cdn.name} (cached)`,
              context: "cdn",
            }),
          );
          continue;
        }

        // Check if script tag already exists in DOM
        const existingScript = document.querySelector(
          `script[src="${cdn.url}"]`,
        );

        if (existingScript) {
          // Script exists but library not on window yet, wait for it
          if ((window as any)[cdn.name]) {
            cdnModules[safeName] = (window as any)[cdn.name];
            dispatch(
              addLog({
                type: "info",
                message: `CDN ready: ${cdn.name} (loaded)`,
                context: "cdn",
              }),
            );
          } else {
            dispatch(
              addLog({
                type: "warning",
                message: `CDN script exists but ${cdn.name} not available on window`,
                context: "cdn",
              }),
            );
          }
          continue;
        }

        // Load new script
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = cdn.url;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error(`Failed to load ${cdn.url}`));
            document.head.appendChild(script);
          });
          cdnModules[safeName] = (window as any)[cdn.name];
          dispatch(
            addLog({
              type: "info",
              message: `Loaded CDN: ${cdn.name}`,
              context: "cdn",
            }),
          );
        } catch {
          dispatch(
            addLog({
              type: "error",
              message: `Failed to load CDN: ${cdn.name} (${cdn.url})`,
              context: "cdn",
            }),
          );
        }
      }

      // Execute each enabled package in order
      for (const pkg of enabledPackages) {
        dispatch(
          addLog({
            type: "info",
            message: `Package: ${pkg.name}`,
            context: "package",
          }),
        );

        const variables = pkg.variables;
        const functions = pkg.functions;
        const runner = pkg.runner;

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

            // Inject CDN modules into code execution context
            // Use sanitized names as parameters, values are the actual CDN objects
            const cdnParamNames = Object.keys(cdnModules);
            const cdnParamValues = Object.values(cdnModules);

            // eslint-disable-next-line no-new-func
            const fn = new AsyncFunction(
              "__ctx__",
              ...cdnParamNames,
              ...safeVarNames,
              code,
            );
            const result = await fn(
              tokenCtx,
              ...cdnParamValues,
              ...safeVarValues,
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
              cdnModules,
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
