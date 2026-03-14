import { FunctionActionInterface } from "@/state/types";
import { evaluate } from "mathjs";

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
  };

  // Resolves a single standalone token (exact match only)
  const resolveToken = (token: string): any => {
    if (token in SPECIAL_IDENTIFIERS) return SPECIAL_IDENTIFIERS[token];
    let match: RegExpExecArray | null;
    if ((match = PATTERNS.ARG.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < args.length) {
        return args[index];
      }
      return null; // Invalid index
    }
    if ((match = PATTERNS.MATH.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < mathTemp.length) {
        return mathTemp[index];
      }
      return null; // Invalid index
    }
    if ((match = PATTERNS.TEMP.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < tempVar.length) {
        return tempVar[index];
      }
      return null; // Invalid index
    }
    if ((match = PATTERNS.PICK.exec(token)) !== null) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < stepResults.length) {
        const result = stepResults[index];
        // Return the result even if it's undefined - that's the actual value
        // Only return null if the index is out of bounds
        return result;
      }
      return null; // Invalid index
    }
    return null; // not a known token
  };

  // Process each value in the array using optimized pattern matching
  return value.map((v: string) => {
    // Exact standalone token → return raw resolved value (preserves original type)
    const standalone = resolveToken(v);
    if (standalone !== null) return standalone;

    // Embedded token(s) inside a larger string → string interpolation
    if (v.includes("@")) {
      return v.replace(/@\w+(?:\([^)]*\))?/g, (token) => {
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

export function fnRunner(
  payload: any,
  args: any[],
  actions: FunctionActionInterface[],
  allFunctions?: { name: string; actions: FunctionActionInterface[] }[],
): any {
  try {
    let temp: any = deepClone(payload);
    const tempVar: any[] = [];
    const mathTemp: any[] = [];
    const stepResults: any[] = [];

    // Resolve all @ tokens and bare string literals to a JS-evaluable expression
    const JS_LITERALS = new Set([
      "null", "true", "false", "undefined", "NaN", "Infinity",
    ]);
    const resolveConditionStr = (condition: string): string => {
      // Step 1 — replace @tokens with their JS-safe values
      let result = condition.replace(/@\w+(?:\([^)]*\))?/g, (token) => {
        const val = uniqueIdentifier(
          [token],
          args,
          temp,
          mathTemp,
          tempVar,
          stepResults,
        )[0];
        if (val === null || val === undefined) return "null";
        if (typeof val === "string") return JSON.stringify(val);
        return String(val);
      });
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
    const processActionList = (
      actionList: FunctionActionInterface[],
    ): { earlyReturn: boolean; value?: any } => {
      for (const action of actionList) {
        // "when" — conditional block: run sub-actions only if condition is true
        if (action.name === "when") {
          const condExpr = Array.isArray(action.value)
            ? (action.value[0] ?? "")
            : "";
          if (condExpr && evalCondition(condExpr)) {
            const sub = processActionList(action.subActions ?? []);
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
          );
          tempVar.push(parsed[0]);
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
          );
          temp = fnRunner(
            deepClone(temp),
            parsedArgs,
            targetFunc.actions,
            allFunctions,
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

    const result = processActionList(actions);
    return result.earlyReturn ? result.value : temp;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Function execution error: ${error.message}`);
    }
    throw new Error(`Unknown error occurred during function execution`);
  }
}
