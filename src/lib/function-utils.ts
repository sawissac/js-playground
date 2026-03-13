import { FunctionActionInterface } from "@/state/types";
import { evaluate } from "mathjs";

type IdentifierContext = {
  args: any[];
  temp: any;
  mathTemp: any[];
  tempVar: any[];
  stepResults: any[];
};

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
  // Create a context object to avoid passing multiple parameters in recursive calls
  const context: IdentifierContext = {
    args,
    temp,
    mathTemp,
    tempVar,
    stepResults,
  };

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
 * Action handler type to improve code organization and readability
 */
type ActionHandler = {
  condition: (action: FunctionActionInterface, temp: any) => boolean;
  process: (
    action: FunctionActionInterface,
    context: {
      temp: any;
      args: any[];
      mathTemp: any[];
      tempVar: any[];
      stepResults: any[];
    },
  ) => any;
};

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

    // Define action handlers to make the code more maintainable
    const actionHandlers: ActionHandler[] = [
      // Cross-function call handler
      {
        condition: ({ name }) => name.startsWith(CALL_PREFIX),
        process: ({ name, value }, { temp, args, mathTemp, tempVar, stepResults }) => {
          const targetName = name.slice(CALL_PREFIX.length);
          const targetFunc = allFunctions?.find((f) => f.name === targetName);
          if (!targetFunc)
            throw new Error(`Function "${targetName}" not found`);
          const parsedArgs = uniqueIdentifier(value, args, temp, mathTemp, tempVar, stepResults);
          return fnRunner(deepClone(temp), parsedArgs, targetFunc.actions, allFunctions);
        },
      },
      // Function call handler
      {
        condition: (action, temp) => {
          if (["math", "temp", "return", "use"].includes(action.name))
            return false;
          if (action.name.startsWith(CALL_PREFIX)) return false;
          if (temp == null) return false;

          const wrapped = wrapPrimitive(temp);
          return typeof wrapped[action.name] === "function";
        },
        process: (
          { name, value },
          { temp, args, mathTemp, tempVar, stepResults },
        ) => {
          const parsedValue = uniqueIdentifier(
            value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
          );

          const wrapped = wrapPrimitive(temp);
          const result = wrapped[name](...parsedValue);
          const unwrapped = unwrapPrimitive(result);
          return unwrapped;
        },
      },
      // Math calculation handler
      {
        condition: ({ name }) => name === "math",
        process: (
          { value },
          { temp, args, mathTemp, tempVar, stepResults },
        ) => {
          const parsedValue = uniqueIdentifier(
            value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
          );
          const expression = parsedValue.join(" ");
          const calculatedValue = evaluate(expression);
          mathTemp.push(calculatedValue);
          return temp;
        },
      },
      // Temp variable handler
      {
        condition: ({ name }) => name === "temp",
        process: (
          { value },
          { temp, args, mathTemp, tempVar, stepResults },
        ) => {
          const parsedValue = uniqueIdentifier(
            value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
          );
          tempVar.push(parsedValue[0]);
          return temp;
        },
      },
      // Return handler
      {
        condition: ({ name }) => name === "return",
        process: (
          { value },
          { temp, args, mathTemp, tempVar, stepResults },
        ) => {
          const parsedValue = uniqueIdentifier(
            value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
          );
          return parsedValue[0];
        },
      },
      {
        condition: ({ name }) => name === "use",
        process: (
          { value },
          { temp, args, mathTemp, tempVar, stepResults },
        ) => {
          const parsedValue = uniqueIdentifier(
            value,
            args,
            temp,
            mathTemp,
            tempVar,
            stepResults,
          );
          return parsedValue[0];
        },
      },
      // Property access handler (default)
      {
        condition: ({ name }) => !name.startsWith(CALL_PREFIX),
        process: ({ name }, { temp }) => {
          if (temp == null) return undefined;

          const wrapped = wrapPrimitive(temp);
          const result = wrapped[name];
          return unwrapPrimitive(result);
        },
      },
    ];

    // Process each action with the appropriate handler
    for (const action of actions) {
      const context = { temp, args, mathTemp, tempVar, stepResults };
      const handler = actionHandlers.find((h) => h.condition(action, temp));

      if (handler) {
        temp = handler.process(action, context);
        stepResults.push(temp);
      }
    }

    return temp;
  } catch (error: unknown) {
    // Improved error handling with proper type checking
    if (error instanceof Error) {
      throw new Error(`Function execution error: ${error.message}`);
    }
    throw new Error(`Unknown error occurred during function execution`);
  }
}
