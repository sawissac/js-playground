"use client";

import { fnRunner, deepClone } from "@/lib/function-utils";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addLog, clearLogs } from "@/state/slices/logSlice";
import { updateRendererVariableValue } from "@/state/slices/canvasRunnerSlice";
import {
  executeWithTimeout,
  detectDangerousPatterns,
} from "@/lib/executionSandbox";
import { validateCodeLength } from "@/lib/validation";
import { canExecuteCode, recordCodeExecution } from "@/lib/rateLimiter";
import { auditLog } from "@/lib/securityAudit";
import type { Runner } from "@/state/types";
import type { CanvasNode, CanvasEdge } from "@/state/slices/canvasSlice";

// AsyncFunction constructor for async code blocks
const CODE_EXECUTION_TIMEOUT = 10000;

/**
 * Derive an ordered list of runner steps from the canvas edge graph for a
 * specific renderer node.  Walks backwards from variables that feed the
 * renderer, following "return" edges through function nodes, and collects
 * "call" steps in dependency order (args before the function that uses them).
 */
function buildDynamicRunner(
  rendererId: string,
  canvasNodes: CanvasNode[],
  canvasEdges: CanvasEdge[],
  allRenderers: Record<
    string,
    { variables: Array<{ id: string; value: any }> }
  >,
): Runner[] {
  const steps: Runner[] = [];
  const visited = new Set<string>();

  /**
   * Auto-resolve: check whether a variable already has a usable value stored
   * in the editor snapshot OR in any renderer's runtime state.
   * If yes, the runner can use it as-is without re-computing the upstream chain.
   */
  function hasResolvedValue(linkedId: string | undefined): boolean {
    if (!linkedId) return false;
    for (const entry of Object.values(allRenderers)) {
      const v = entry.variables.find((v) => v.id === linkedId);
      if (
        v !== undefined &&
        v.value !== undefined &&
        v.value !== null &&
        v.value !== ""
      ) {
        return true;
      }
    }
    return false;
  }

  function processNode(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = canvasNodes.find((n) => n.id === nodeId);
    if (!node || node.data.nodeType !== "variable") return;

    // Find whether any function produces this variable via a "return" edge.
    const returnEdge = canvasEdges.find(
      (e) => e.target === nodeId && e.label === "return",
    );

    if (!returnEdge) {
      // Leaf variable — no function computes it.  Its stored value (from the
      // editor or a previous run) is the authoritative input.  Use it as-is.
      return;
    }

    const funcNode = canvasNodes.find((n) => n.id === returnEdge.source);
    if (!funcNode || funcNode.data.nodeType !== "function") return;

    // Auto-resolve cross-renderer outputs: if this variable is produced by a
    // function AND is connected as "value" to a DIFFERENT renderer, it is that
    // renderer's computed output.  If a stored value exists (from that renderer's
    // previous run), use it rather than re-executing its upstream chain here.
    const isCrossRendererOutput = canvasEdges.some(
      (e) =>
        e.source === nodeId &&
        e.label === "value" &&
        e.target !== rendererId &&
        canvasNodes.find((n) => n.id === e.target)?.data.nodeType ===
          "renderer",
    );
    if (
      isCrossRendererOutput &&
      hasResolvedValue(node.data.linkedId as string | undefined)
    ) {
      return;
    }

    // Collect and order arg edges by their label number ("arg1" < "arg2" < …).
    // data.order is only set when addCanvasEdge auto-assigns the label, but
    // onConnect always pre-sets the label before dispatching, so data.order is
    // undefined for every manually-drawn edge.  Parsing the label is reliable.
    const argEdges = canvasEdges
      .filter((e) => e.target === funcNode.id)
      .sort((a, b) => {
        const aNum = parseInt((a.label ?? "").replace("arg", ""), 10) || 0;
        const bNum = parseInt((b.label ?? "").replace("arg", ""), 10) || 0;
        return aNum - bNum;
      });

    // Resolve each arg edge source to a variable name.
    // - variable node  → use its label directly
    // - renderer node  → look up the variable connected to that renderer as "value"
    //                    (renderer acts as a pass-through for its input variable)
    const argNames: string[] = [];
    for (const argEdge of argEdges) {
      const srcNode = canvasNodes.find((n) => n.id === argEdge.source);
      if (!srcNode) continue;

      if (srcNode.data.nodeType === "variable") {
        processNode(srcNode.id);
        argNames.push(srcNode.data.label as string);
      } else if (srcNode.data.nodeType === "renderer") {
        // Renderer passes through the variable connected to it as "value"
        const valueEdge = canvasEdges.find(
          (e) => e.target === srcNode.id && e.label === "value",
        );
        const inputVarNode = valueEdge
          ? canvasNodes.find(
              (n) =>
                n.id === valueEdge.source && n.data.nodeType === "variable",
            )
          : undefined;
        if (inputVarNode) {
          argNames.push(inputVarNode.data.label as string);
        }
      }
    }

    steps.push({
      id: `canvas-derived-${nodeId}`,
      type: "call",
      target: [node.data.label as string, funcNode.data.label as string],
      args: argNames,
    });
  }

  // Start from variables (or nodes) that connect directly into this renderer
  const incomingEdges = canvasEdges.filter((e) => e.target === rendererId);
  for (const edge of incomingEdges) {
    processNode(edge.source);
  }

  return steps;
}

// Sanitize CDN names to valid JavaScript identifiers
const sanitizeCdnName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^[0-9]/, "_$&");

/**
 * Canvas Runner — completely independent from the editor runner.
 *
 * Each renderer node on the canvas has its own state:
 *   - renderer DOM element: `canvas-renderer-<rendererId>`
 *   - variables / functions / CDN packages from canvasRunnerSlice
 *   - @renderer token in code blocks is replaced with the specific renderer's DOM id
 *
 * Usage:
 *   const { run } = useCanvasRunner(rendererId);
 *   <button onClick={run}>Run Canvas</button>
 */
export const useCanvasRunner = (rendererId: string) => {
  const dispatch = useAppDispatch();

  // Pull this renderer's isolated state from canvasRunnerSlice
  const rendererEntry = useAppSelector(
    (state) => state.canvasRunner.renderers[rendererId],
  );

  const activePackageId = useAppSelector(
    (state) => state.editor.activePackageId,
  );
  const currentCanvas = useAppSelector(
    (state) =>
      state.canvas.canvases[activePackageId] || { nodes: [], edges: [] },
  );
  const canvasNodes = currentCanvas.nodes;
  const canvasEdges = currentCanvas.edges;
  const allRenderers = useAppSelector((state) => state.canvasRunner.renderers);

  const run = async () => {
    // The DOM element used as the render target for this canvas renderer
    const domRendererId = `canvas-renderer-${rendererId}`;

    // Rate limit check
    const rateLimitCheck = canExecuteCode();
    if (!rateLimitCheck.allowed) {
      dispatch(
        addLog({
          type: "error",
          message: rateLimitCheck.reason || "Rate limit exceeded",
          context: "canvas-rate-limit",
        }),
      );
      auditLog.rateLimitExceeded(rateLimitCheck.retryAfter || 0);
      return;
    }

    dispatch(clearLogs());

    // Clear renderer DOM
    const rendererEl = document.getElementById(domRendererId);
    if (rendererEl) {
      rendererEl.innerHTML = "";
    }

    if (!rendererEntry) {
      dispatch(
        addLog({
          type: "error",
          message: `Canvas renderer "${rendererId}" not registered`,
          context: "canvas-runner",
        }),
      );
      return;
    }

    const { variables, functions, cdnPackages } = rendererEntry;
    // Derive execution steps from the canvas graph for THIS renderer.
    // This means each renderer only runs the function chains that are visually
    // connected to it — rather than sharing the editor package's runner.
    const runner = buildDynamicRunner(
      rendererId,
      canvasNodes,
      canvasEdges,
      allRenderers,
    );

    // Only run enabled CDN packages registered for THIS renderer
    const enabledCdns = cdnPackages.filter((c) => c.enabled);

    dispatch(
      addLog({
        type: "info",
        message: `Canvas runner [${rendererEntry.label}] — ${runner.length} step(s), ${enabledCdns.length} CDN(s)`,
        context: "canvas-runner",
      }),
    );

    try {
      // ── Load CDN packages (renderer-scoped) ───────────────────────────────
      const cdnModules: Record<string, any> = {};

      for (const cdn of enabledCdns) {
        const safeName = sanitizeCdnName(cdn.name);

        if ((window as any)[cdn.name]) {
          cdnModules[safeName] = (window as any)[cdn.name];
          dispatch(
            addLog({
              type: "info",
              message: `CDN ready: ${cdn.name} (cached)`,
              context: "canvas-cdn",
            }),
          );
          continue;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
          `script[src="${cdn.url}"]`,
        );
        if (existingScript) {
          if ((window as any)[cdn.name]) {
            cdnModules[safeName] = (window as any)[cdn.name];
          } else {
            dispatch(
              addLog({
                type: "warning",
                message: `CDN script exists but ${cdn.name} not on window`,
                context: "canvas-cdn",
              }),
            );
          }
          continue;
        }

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
              context: "canvas-cdn",
            }),
          );
        } catch {
          dispatch(
            addLog({
              type: "error",
              message: `Failed to load CDN: ${cdn.name} (${cdn.url})`,
              context: "canvas-cdn",
            }),
          );
        }
      }

      // ── Execute runner steps ───────────────────────────────────────────────
      // Build updatedVariables with cross-renderer value resolution:
      //
      // 1. If a variable is the output of a DIFFERENT renderer (connected to it
      //    via a "value" edge), ALWAYS use that renderer's computed value.  The
      //    local/editor snapshot may be stale from a previous run, so we must
      //    prefer the owning renderer's authoritative runtime value.
      //
      // 2. Otherwise fall back to the local editor value, then scan other
      //    renderer entries (for variables shared without explicit ownership).
      const updatedVariables = variables.map((v) => {
        // Find the canvas node linked to this variable
        const varCanvasNode = canvasNodes.find(
          (n) => n.data.nodeType === "variable" && n.data.linkedId === v.id,
        );

        if (varCanvasNode) {
          // Check if this variable is owned by a different renderer
          const ownerEdge = canvasEdges.find(
            (e) =>
              e.source === varCanvasNode.id &&
              e.label === "value" &&
              e.target !== rendererId &&
              canvasNodes.find((n) => n.id === e.target)?.data.nodeType ===
                "renderer",
          );
          if (ownerEdge) {
            const ownerEntry = allRenderers[ownerEdge.target];
            const ownerVar = ownerEntry?.variables.find((ov) => ov.id === v.id);
            if (
              ownerVar?.value !== undefined &&
              ownerVar.value !== null &&
              ownerVar.value !== ""
            ) {
              return { ...v, value: deepClone(ownerVar.value) };
            }
          }
        }

        // Not owned by another renderer: use local value, fall back to any
        // renderer that has a non-empty value for this variable.
        let value = deepClone(v.value);
        if ((value === undefined || value === null || value === "") && v.id) {
          for (const [rid, entry] of Object.entries(allRenderers)) {
            if (rid === rendererId) continue;
            const otherVar = entry.variables.find((ov) => ov.id === v.id);
            if (
              otherVar?.value !== undefined &&
              otherVar.value !== null &&
              otherVar.value !== ""
            ) {
              value = deepClone(otherVar.value);
              break;
            }
          }
        }
        return { ...v, value };
      });

      for (let stepIndex = 0; stepIndex < runner.length; stepIndex++) {
        const step = runner[stepIndex];
        const stepLabel = `canvas-step ${stepIndex + 1}`;

        // ── SET step ────────────────────────────────────────────────────────
        if (step.type === "set") {
          const varName = step.target[0];
          const rawValue = step.target[1];
          const varIndex = updatedVariables.findIndex(
            (v) => v.name === varName,
          );

          if (varIndex === -1) {
            throw new Error(`Canvas variable "${varName}" not found`);
          }

          const dataType = variables[varIndex]?.type;
          let valueReturn: any = rawValue;

          switch (dataType) {
            case "string":
              valueReturn = rawValue;
              break;
            case "array":
              valueReturn = rawValue.split(",").map((v: string) => v.trim());
              break;
            case "number":
              valueReturn = Number(rawValue);
              break;
            case "boolean":
              valueReturn = rawValue === "true";
              break;
            case "object":
              valueReturn = JSON.parse(rawValue);
              break;
            default:
              valueReturn = rawValue;
          }

          updatedVariables[varIndex] = {
            ...updatedVariables[varIndex],
            value: valueReturn,
          };

          dispatch(
            updateRendererVariableValue({
              rendererId,
              variableId: updatedVariables[varIndex].id,
              value: valueReturn,
            }),
          );

          dispatch(
            addLog({
              type: "info",
              message: `${varName} = ${JSON.stringify(valueReturn)}`,
              context: stepLabel,
            }),
          );
        }

        // ── CODE step ────────────────────────────────────────────────────────
        if (step.type === "code") {
          const varName = step.target[0];
          const variable = updatedVariables.find((v) => v.name === varName);

          if (!variable) {
            throw new Error(`Canvas variable "${varName}" not found`);
          }

          dispatch(
            addLog({
              type: "info",
              message: `${varName} ← code block`,
              context: stepLabel,
            }),
          );

          // Token context — @renderer replaced with the canvas DOM id
          const tokenCtx: Record<string, any> = {
            this: deepClone(variable.value),
            t: deepClone(variable.value),
            space: " ",
            s: " ",
            comma: ",",
            c: ",",
            empty: "",
            e: "",
            renderer: domRendererId,
            r: domRendererId,
          };

          const rawCode = step.code || "return undefined;";
          const codeValidation = validateCodeLength(rawCode);
          if (!codeValidation.valid) {
            throw new Error(codeValidation.error);
          }

          const safetyCheck = detectDangerousPatterns(rawCode);
          if (!safetyCheck.safe) {
            dispatch(
              addLog({
                type: "warning",
                message: `Code warnings: ${safetyCheck.warnings.join(", ")}`,
                context: "canvas-safety",
              }),
            );
            safetyCheck.warnings.forEach((warning) => {
              auditLog.dangerousPattern(warning, rawCode, {
                variableName: variable.name,
                packageName: rendererEntry.label,
              });
            });
          }

          // Transform @token → __ctx__["token"]
          let code = rawCode;
          code = code.replace(/@(\w+(?:\.\w+)*)/g, (_match, token) => {
            const dotIndex = token.indexOf(".");
            if (dotIndex === -1) {
              return `__ctx__["${token}"]`;
            }
            const base = token.slice(0, dotIndex);
            const rest = token.slice(dotIndex);
            return `__ctx__["${base}"]${rest}`;
          });

          const safeVarNames = updatedVariables
            .filter((v) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v.name))
            .map((v) => v.name);
          const safeVarValues = safeVarNames.map((name) => {
            const v = updatedVariables.find((uv) => uv.name === name);
            return deepClone(v?.value);
          });

          const cdnParamNames = Object.keys(cdnModules);
          const cdnParamValues = Object.values(cdnModules);

          const executionContext: Record<string, any> = { __ctx__: tokenCtx };
          cdnParamNames.forEach((name, i) => {
            executionContext[name] = cdnParamValues[i];
          });
          safeVarNames.forEach((name, i) => {
            executionContext[name] = safeVarValues[i];
          });

          const executionResult = await executeWithTimeout(code, {
            timeout: CODE_EXECUTION_TIMEOUT,
            context: executionContext,
          });

          if (!executionResult.success) {
            if (executionResult.timedOut) {
              dispatch(
                addLog({
                  type: "error",
                  message: executionResult.error || "Execution timeout",
                  context: "canvas-timeout",
                }),
              );
              auditLog.codeTimeout(CODE_EXECUTION_TIMEOUT, {
                variableName: variable.name,
                packageName: rendererEntry.label,
              });
              recordCodeExecution(false, true);
            } else {
              recordCodeExecution(false, false);
            }
            throw new Error(executionResult.error || "Code execution failed");
          }

          recordCodeExecution(true, false);
          auditLog.codeExecution(true, executionResult.executionTime, {
            variableName: variable.name,
            packageName: rendererEntry.label,
          });

          const result = executionResult.result;

          dispatch(
            addLog({
              type: "info",
              message: `Executed in ${executionResult.executionTime.toFixed(2)}ms`,
              context: "canvas-performance",
            }),
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
            updateRendererVariableValue({
              rendererId,
              variableId: variable.id,
              value: result,
            }),
          );

          dispatch(
            addLog({
              type: "info",
              message: `→ ${JSON.stringify(result)}`,
              context: "canvas-code",
            }),
          );
        }

        // ── CALL step ────────────────────────────────────────────────────────
        if (step.type === "call") {
          const varName = step.target[0];
          const funcName = step.target[1];
          const variable = updatedVariables.find((v) => v.name === varName);
          const func = functions.find((f) => f.name === funcName);

          if (!variable) {
            throw new Error(`Canvas variable "${varName}" not found`);
          }
          if (!func) {
            throw new Error(`Canvas function "${funcName}" not found`);
          }

          const argNames = step.args.length ? step.args.join(", ") : "";
          dispatch(
            addLog({
              type: "info",
              message: `${varName} ← ${funcName}(${argNames})`,
              context: stepLabel,
            }),
          );

          const result = await fnRunner(
            deepClone(variable.value),
            step.args.map((arg: string) =>
              deepClone(updatedVariables.find((v) => v.name === arg)?.value),
            ),
            func.actions,
            functions,
            cdnModules,
            domRendererId, // ← pass the canvas renderer DOM id
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
            updateRendererVariableValue({
              rendererId,
              variableId: variable.id,
              value: result,
            }),
          );

          dispatch(
            addLog({
              type: "info",
              message: `→ ${JSON.stringify(result)}`,
              context: funcName,
            }),
          );
        }
      }

      // ── Auto-render connected variables ──────────────────────────────
      const connectedEdges = canvasEdges.filter((e) => e.target === rendererId);
      let autoRenderedContent = "";
      let hasAutoRender = false;

      for (const edge of connectedEdges) {
        const sourceNode = canvasNodes.find((n) => n.id === edge.source);
        if (sourceNode?.data.nodeType === "variable") {
          const variable = updatedVariables.find(
            (v) => v.id === sourceNode.data.linkedId,
          );
          if (variable) {
            hasAutoRender = true;
            if (typeof variable.value === "object" && variable.value !== null) {
              autoRenderedContent += `<pre class="text-xs p-2 overflow-auto bg-slate-50 text-slate-800 rounded font-mono border border-slate-200 mt-2">${JSON.stringify(variable.value, null, 2)}</pre>`;
            } else {
              autoRenderedContent += `<div class="p-2 text-sm text-slate-800">${String(variable.value ?? "")}</div>`;
            }
            dispatch(
              addLog({
                type: "info",
                message: `Auto-rendering connected variable: ${variable.name}`,
                context: "canvas-auto-render",
              }),
            );
          }
        }
      }

      if (hasAutoRender) {
        const rendererEl = document.getElementById(domRendererId);
        if (rendererEl) {
          // Append in case the user also had custom code rendering
          rendererEl.insertAdjacentHTML("beforeend", autoRenderedContent);
        }
      }

      dispatch(
        addLog({
          type: "info",
          message: `Canvas execution complete [${rendererEntry.label}]`,
          context: "canvas-runner",
        }),
      );
    } catch (error: any) {
      dispatch(
        addLog({
          type: "error",
          message: error.message,
          context: "canvas-error",
        }),
      );
    }
  };

  return { run, rendererEntry };
};
