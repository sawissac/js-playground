import { FunctionActionInterface } from "@/state/types";
import { evaluate } from "mathjs";

// AsyncFunction constructor for async code blocks
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * Optimized uniqueIdentifier function that resolves variable references
 * using a pattern-matching approach for better performance
 */
export function uniqueIdentifier(
  value: string[],
  args: any[],
  temp: any,
  mathTemp: any[],
  tempVar: any[],
  stepResults: any[] = [],
  rendererId: string = "",
): any[] {
  // Define constants for common patterns to improve readability
  const PATTERNS = {
    ARG: /^@arg(\d+)$/,
    MATH: /^@math(\d+)$/,
    TEMP: /^@temp(\d+)$/,
    PICK: /^@pick\((\d+)\)$/,
  };

  // Define a map for special identifiers to avoid repetitive conditionals
  const SPECIAL_IDENTIFIERS: Record<string, any> = {
    "@this": temp,
    "@t": temp,
    "@space": " ",
    "@s": " ",
    "@comma": ",",
    "@c": ",",
    "@empty": "",
    "@e": "",
    "@renderer": rendererId,
    "@r": rendererId,
  };

  // Resolves a base token (no dot) to its value
  const resolveBaseToken = (token: string): any => {
    if (token in SPECIAL_IDENTIFIERS) return SPECIAL_IDENTIFIERS[token];
    let match: RegExpExecArray | null;
    if ((match = PATTERNS.ARG.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < args.length) {
        return args[index];
      }
      return null;
    }
    if ((match = PATTERNS.MATH.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < mathTemp.length) {
        return mathTemp[index];
      }
      return null;
    }
    if ((match = PATTERNS.TEMP.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < tempVar.length) {
        return tempVar[index];
      }
      return null;
    }
    if ((match = PATTERNS.PICK.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < stepResults.length) {
        return stepResults[index];
      }
      return null;
    }
    return null;
  };

  // Resolves a token, supporting dot-property access (e.g. @this.length, @arg1.name)
  const resolveToken = (token: string): any => {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return resolveBaseToken(token);

    const base = token.slice(0, dotIndex);
    const prop = token.slice(dotIndex + 1);
    const resolved = resolveBaseToken(base);
    if (resolved == null || !prop) return null;

    // Walk nested properties (e.g. @this.a.b)
    const parts = prop.split(".");
    let value = resolved;
    for (const p of parts) {
      if (value == null) return null;
      value = value[p];
    }
    return value ?? null;
  };

  // Process each value in the array using optimized pattern matching
  return value.map((v: string) => {
    // Exact standalone token → return raw resolved value (preserves original type)
    const standalone = resolveToken(v);
    if (standalone !== null) return standalone;

    // Embedded token(s) inside a larger string → string interpolation
    if (v.includes("@")) {
      return v.replace(/@\w+(?:\.\w+)*(?:\([^)]*\))?/g, (token) => {
        const resolved = resolveToken(token);
        return resolved !== null ? String(resolved) : token;
      });
    }

    // Default case: return the trimmed value
    return v.trim();
  });
}

/**
 * Optimized function runner with better error handling and type safety
 */
export function deepClone(value: any): any {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepClone);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  const cloned: any = {};
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      cloned[key] = deepClone(value[key]);
    }
  }
  return cloned;
}

function wrapPrimitive(value: any): any {
  const type = typeof value;
  if (type === "number") return new Number(value);
  if (type === "boolean") return new Boolean(value);
  if (type === "string") return new String(value);
  return value;
}

function unwrapPrimitive(value: any): any {
  if (
    value instanceof Number ||
    value instanceof Boolean ||
    value instanceof String
  ) {
    return value.valueOf();
  }
  return value;
}

const CALL_PREFIX = "call:";

/**
 * Execute a user-written JavaScript code block with @token context.
 * Supports async/await and fetch. Returns a Promise.
 */
async function executeCodeAction(
  codeStr: string,
  args: any[],
  temp: any,
  mathTemp: any[],
  tempVar: any[],
  stepResults: any[],
  cdnModules: Record<string, any> = {},
  rendererId: string = "",
): Promise<any> {
  if (!codeStr.trim()) return temp;

  // Build token context
  const tokenCtx: Record<string, any> = {
    this: temp,
    t: temp,
    space: " ",
    s: " ",
    comma: ",",
    c: ",",
    empty: "",
    e: "",
    renderer: rendererId,
    r: rendererId,
  };
  args.forEach((a, i) => {
    tokenCtx[`arg${i + 1}`] = a;
  });
  tempVar.forEach((tv, i) => {
    tokenCtx[`temp${i + 1}`] = tv;
  });
  mathTemp.forEach((m, i) => {
    tokenCtx[`math${i + 1}`] = m;
  });
  stepResults.forEach((s, i) => {
    tokenCtx[`pick(${i + 1})`] = s;
  });

  // Transform @tokens to context lookups
  let code = codeStr;
  code = code.replace(/@(\w+(?:\([^)]*\))?(?:\.\w+)*)/g, (_match, token) => {
    const dotIdx = token.indexOf(".");
    if (dotIdx === -1) return `__ctx__["${token}"]`;
    const base = token.slice(0, dotIdx);
    const rest = token.slice(dotIdx);
    return `__ctx__["${base}"]${rest}`;
  });

  // Inject CDN modules into code execution context
  const cdnNames = Object.keys(cdnModules);
  const cdnValues = Object.values(cdnModules);

  // eslint-disable-next-line no-new-func
  const fn = new AsyncFunction("__ctx__", ...cdnNames, code);
  return await fn(tokenCtx, ...cdnValues);
}

export async function fnRunner(
  payload: any,
  args: any[],
  actions: FunctionActionInterface[],
  allFunctions?: { name: string; actions: FunctionActionInterface[] }[],
  cdnModules: Record<string, any> = {},
  rendererId: string = "",
): Promise<any> {
  try {
    let temp: any = deepClone(payload);
    const tempVar: any[] = [];
    const mathTemp: any[] = [];
    const stepResults: any[] = [];

    // Resolve all @ tokens and bare string literals to a JS-evaluable expression
    const JS_LITERALS = new Set([
      "null",
      "true",
      "false",
      "undefined",
      "NaN",
      "Infinity",
    ]);
    const resolveConditionStr = (condition: string): string => {
      // Step 1 — replace @tokens with their JS-safe values
      let result = condition.replace(
        /@\w+(?:\.\w+)*(?:\([^)]*\))?/g,
        (token) => {
          const val = uniqueIdentifier(
            [token],
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          )[0];
          if (val === null || val === undefined) return "null";
          if (typeof val === "string") return JSON.stringify(val);
          return String(val);
        },
      );
      // Step 2 — quote remaining bareword string literals so they don't throw
      // ReferenceError (e.g. `@this == esther` → `"value" == "esther"`)
      result = result.replace(
        /("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(\b[a-zA-Z_$][a-zA-Z0-9_$]*\b)/g,
        (match, dq, sq, bareword) => {
          if (dq || sq) return match; // already quoted
          if (JS_LITERALS.has(bareword)) return match; // JS keyword
          return JSON.stringify(bareword);
        },
      );
      return result;
    };

    const evalCondition = (condition: string): boolean => {
      try {
        const resolved = resolveConditionStr(condition);
        // eslint-disable-next-line no-new-func
        return Boolean(new Function("return (" + resolved + ")")());
      } catch {
        return false;
      }
    };

    // Returns { earlyReturn: true, value } when a "return" action is hit,
    // otherwise { earlyReturn: false } after all actions are processed.
    const processActionList = async (
      actionList: FunctionActionInterface[],
    ): Promise<{ earlyReturn: boolean; value?: any }> => {
      for (const action of actionList) {
        // "loop" — iteration block: run sub-actions for each iteration
        if (action.name === "loop") {
          const params = action.loopParams ?? {};
          const startVal = params.start
            ? uniqueIdentifier(
                [params.start],
                args,
                temp,
                mathTemp,
                tempVar,
                stepResults,
                rendererId,
              )[0]
            : 0;
          const endVal = params.end
            ? uniqueIdentifier(
                [params.end],
                args,
                temp,
                mathTemp,
                tempVar,
                stepResults,
                rendererId,
              )[0]
            : Array.isArray(temp)
              ? temp.length
              : 0;
          const stepVal = params.step
            ? uniqueIdentifier(
                [params.step],
                args,
                temp,
                mathTemp,
                tempVar,
                stepResults,
                rendererId,
              )[0]
            : 1;

          const start = Number(startVal) || 0;
          const end = Number(endVal) || 0;
          const step = Number(stepVal) || 1;

          if (step === 0) {
            stepResults.push(temp);
            continue;
          }

          const runSubActions = async (iterIndex: number): Promise<any> => {
            const currentItem = Array.isArray(temp)
              ? temp[iterIndex]
              : iterIndex;
            // When temp is an array, start with the current element so methods
            // like toUpperCase() apply per-element automatically.
            let subTemp = Array.isArray(temp)
              ? deepClone(currentItem)
              : deepClone(temp);
            const subStepResults = [...stepResults];

            for (const subAction of action.subActions ?? []) {
              if (subAction.name === "use") {
                const parsed = uniqueIdentifier(
                  subAction.value,
                  args,
                  currentItem,
                  mathTemp,
                  tempVar,
                  subStepResults,
                  rendererId,
                );
                subTemp = parsed[0];
                subStepResults.push(subTemp);
                continue;
              }

              if (subAction.name === "temp") {
                const parsed = uniqueIdentifier(
                  subAction.value,
                  args,
                  subTemp,
                  mathTemp,
                  tempVar,
                  subStepResults,
                  rendererId,
                );
                tempVar.push(parsed[0]);
                subStepResults.push(subTemp);
                continue;
              }

              if (subAction.name === "math") {
                const parsed = uniqueIdentifier(
                  subAction.value,
                  args,
                  subTemp,
                  mathTemp,
                  tempVar,
                  subStepResults,
                  rendererId,
                );
                const mathResult = evaluate(parsed.join(" "));
                mathTemp.push(mathResult);
                subTemp = mathResult;
                subStepResults.push(subTemp);
                continue;
              }

              if (subAction.name === "code") {
                const codeStr = Array.isArray(subAction.value)
                  ? (subAction.value[0] ?? "")
                  : "";
                subTemp = await executeCodeAction(
                  codeStr,
                  args,
                  subTemp,
                  mathTemp,
                  tempVar,
                  subStepResults,
                  cdnModules,
                  rendererId,
                );
                subStepResults.push(subTemp);
                continue;
              }

              const subParsed = uniqueIdentifier(
                subAction.value,
                args,
                subTemp,
                mathTemp,
                tempVar,
                subStepResults,
                rendererId,
              );

              if (subAction.name === "return") {
                return { earlyReturn: true, value: subParsed[0] };
              }

              if (subAction.name.startsWith(CALL_PREFIX)) {
                const targetName = subAction.name.slice(CALL_PREFIX.length);
                const targetFunc = allFunctions?.find(
                  (f) => f.name === targetName,
                );
                if (targetFunc) {
                  subTemp = await fnRunner(
                    deepClone(subTemp),
                    subParsed,
                    targetFunc.actions,
                    allFunctions,
                    cdnModules,
                  );
                }
                subStepResults.push(subTemp);
                continue;
              }

              const wrapped = wrapPrimitive(subTemp);
              if (
                wrapped != null &&
                typeof wrapped[subAction.name] === "function"
              ) {
                subTemp = unwrapPrimitive(
                  wrapped[subAction.name](...subParsed),
                );
              } else if (wrapped != null) {
                subTemp = unwrapPrimitive(wrapped[subAction.name]);
              }
              subStepResults.push(subTemp);
            }
            return subTemp;
          };

          const results: any[] = [];
          if (step > 0) {
            for (let i = start; i < end; i += step) {
              const result = await runSubActions(i);
              if (result && typeof result === "object" && result.earlyReturn) {
                return result;
              }
              results.push(result);
            }
          } else {
            for (let i = start; i > end; i += step) {
              const result = await runSubActions(i);
              if (result && typeof result === "object" && result.earlyReturn) {
                return result;
              }
              results.push(result);
            }
          }

          temp = results.length > 0 ? results : temp;
          stepResults.push(temp);
          continue;
        }

        // "when" — conditional block: run sub-actions only if condition is true
        if (action.name === "when") {
          const condExpr = Array.isArray(action.value)
            ? (action.value[0] ?? "")
            : "";
          if (condExpr && evalCondition(condExpr)) {
            const sub = await processActionList(action.subActions ?? []);
            if (sub.earlyReturn) return sub;
          }
          stepResults.push(temp);
          continue;
        }

        // "return" — early-exit with a specific value
        if (action.name === "return") {
          const parsed = uniqueIdentifier(
            action.value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          );
          return { earlyReturn: true, value: parsed[0] };
        }

        // "use" — switch current working value
        if (action.name === "use") {
          const parsed = uniqueIdentifier(
            action.value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          );
          temp = parsed[0];
          stepResults.push(temp);
          continue;
        }

        // "math" — evaluate a mathjs expression, store in mathTemp
        if (action.name === "math") {
          const parsed = uniqueIdentifier(
            action.value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          );
          mathTemp.push(evaluate(parsed.join(" ")));
          stepResults.push(temp);
          continue;
        }

        // "temp" — store a value in tempVar
        if (action.name === "temp") {
          const parsed = uniqueIdentifier(
            action.value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          );
          tempVar.push(parsed[0]);
          stepResults.push(temp);
          continue;
        }

        // "code" — execute JavaScript code block (async)
        if (action.name === "code") {
          const codeStr = Array.isArray(action.value)
            ? (action.value[0] ?? "")
            : "";
          temp = await executeCodeAction(
            codeStr,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            cdnModules,
            rendererId,
          );
          stepResults.push(temp);
          continue;
        }

        // cross-function call
        if (action.name.startsWith(CALL_PREFIX)) {
          const targetName = action.name.slice(CALL_PREFIX.length);
          const targetFunc = allFunctions?.find((f) => f.name === targetName);
          if (!targetFunc)
            throw new Error(`Function "${targetName}" not found`);
          const parsedArgs = uniqueIdentifier(
            action.value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
            rendererId,
          );
          temp = await fnRunner(
            deepClone(temp),
            parsedArgs,
            targetFunc.actions,
            allFunctions,
            cdnModules,
            rendererId,
          );
          stepResults.push(temp);
          continue;
        }

        // native method call or property access
        if (temp != null) {
          const wrapped = wrapPrimitive(temp);
          if (typeof wrapped[action.name] === "function") {
            const parsed = uniqueIdentifier(
              action.value,
              args,
              temp,
              mathTemp,
              tempVar,
              stepResults,
              rendererId,
            );
            temp = unwrapPrimitive(wrapped[action.name](...parsed));
          } else {
            temp = unwrapPrimitive(wrapped[action.name]);
          }
          stepResults.push(temp);
        }
      }
      return { earlyReturn: false };
    };

    const result = await processActionList(actions);
    return result.earlyReturn ? result.value : temp;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Function execution error: ${error.message}`);
    }
    throw new Error(`Unknown error occurred during function execution`);
  }
}
