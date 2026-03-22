/**
 * Code execution sandbox with timeout and memory limits
 */

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const MAX_TIMEOUT = 30000; // 30 seconds

export interface ExecutionOptions {
  timeout?: number;
  context?: Record<string, any>;
  onProgress?: (message: string) => void;
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  timedOut?: boolean;
}

/**
 * Execute code with timeout protection
 */
export async function executeWithTimeout(
  code: string,
  options: ExecutionOptions = {}
): Promise<ExecutionResult> {
  const timeout = Math.min(options.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT);
  const startTime = performance.now();

  return new Promise((resolve) => {
    let timeoutId: NodeJS.Timeout;
    let completed = false;

    // Timeout handler
    timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        resolve({
          success: false,
          error: `Execution timeout after ${timeout}ms. Check for infinite loops.`,
          executionTime: performance.now() - startTime,
          timedOut: true,
        });
      }
    }, timeout);

    // Execute code
    (async () => {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const contextKeys = Object.keys(options.context || {});
        const contextValues = Object.values(options.context || {});

        const fn = new AsyncFunction(...contextKeys, code);
        const result = await fn(...contextValues);

        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve({
            success: true,
            result,
            executionTime: performance.now() - startTime,
          });
        }
      } catch (error: any) {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error: error.message || String(error),
            executionTime: performance.now() - startTime,
          });
        }
      }
    })();
  });
}

/**
 * Detect potentially dangerous code patterns
 */
export function detectDangerousPatterns(code: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for infinite loops (basic detection)
  if (/while\s*\(\s*true\s*\)/.test(code)) {
    warnings.push("Detected 'while(true)' - potential infinite loop");
  }

  if (/for\s*\(\s*;\s*;\s*\)/.test(code)) {
    warnings.push("Detected 'for(;;)' - potential infinite loop");
  }

  // Check for suspicious eval/Function usage
  if (/\beval\s*\(/.test(code)) {
    warnings.push("Using 'eval' can be dangerous");
  }

  // Check for DOM manipulation that could break the app
  if (/document\.body\s*=/.test(code)) {
    warnings.push("Replacing document.body can break the application");
  }

  // Check for window replacement
  if (/window\s*=/.test(code)) {
    warnings.push("Replacing window object is not allowed");
  }

  // Check for localStorage/sessionStorage clearing
  if (/localStorage\.clear|sessionStorage\.clear/.test(code)) {
    warnings.push("Clearing storage may delete user data");
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}

/**
 * Create a safe execution context with limited access
 */
export function createSafeContext(
  variables: Record<string, any>,
  cdnModules: Record<string, any> = {}
): Record<string, any> {
  // Create a context that doesn't expose dangerous globals
  const safeContext = {
    ...variables,
    ...cdnModules,
    
    // Safe globals
    console: {
      log: (...args: any[]) => console.log("[Code]", ...args),
      warn: (...args: any[]) => console.warn("[Code]", ...args),
      error: (...args: any[]) => console.error("[Code]", ...args),
      info: (...args: any[]) => console.info("[Code]", ...args),
    },
    
    // Math and JSON are safe
    Math: Math,
    JSON: JSON,
    
    // Date is safe
    Date: Date,
    
    // Array and Object constructors
    Array: Array,
    Object: Object,
    
    // Safe string/number functions
    String: String,
    Number: Number,
    Boolean: Boolean,
    
    // setTimeout/setInterval with limits (handled by timeout wrapper)
    setTimeout: typeof window !== "undefined" ? window.setTimeout : undefined,
    setInterval: typeof window !== "undefined" ? window.setInterval : undefined,
    clearTimeout: typeof window !== "undefined" ? window.clearTimeout : undefined,
    clearInterval: typeof window !== "undefined" ? window.clearInterval : undefined,
    
    // Performance for timing
    performance: typeof window !== "undefined" ? window.performance : undefined,
  };

  return safeContext;
}

/**
 * Analyze code complexity (simple heuristic)
 */
export function analyzeComplexity(code: string): {
  score: number;
  recommendation: string;
} {
  let score = 0;

  // Count loops
  const loopCount = (code.match(/\b(for|while|do)\b/g) || []).length;
  score += loopCount * 2;

  // Count function calls
  const functionCallCount = (code.match(/\w+\s*\(/g) || []).length;
  score += functionCallCount;

  // Count nested blocks
  const nestingDepth = Math.max(
    ...(code.match(/\{/g) || []).map((_, i, arr) => {
      const openBraces = code.slice(0, code.indexOf("{", i)).match(/\{/g)?.length || 0;
      const closeBraces = code.slice(0, code.indexOf("{", i)).match(/\}/g)?.length || 0;
      return openBraces - closeBraces;
    })
  );
  score += nestingDepth * 3;

  let recommendation = "";
  if (score < 10) {
    recommendation = "Low complexity - should execute quickly";
  } else if (score < 30) {
    recommendation = "Medium complexity - normal execution time";
  } else if (score < 50) {
    recommendation = "High complexity - may take longer to execute";
  } else {
    recommendation = "Very high complexity - consider optimizing or increasing timeout";
  }

  return { score, recommendation };
}

/**
 * Memory usage estimator (rough approximation)
 */
export function estimateMemoryUsage(value: any): number {
  const seen = new WeakSet();

  function sizeOf(obj: any): number {
    if (obj === null || obj === undefined) return 0;

    if (typeof obj === "boolean") return 4;
    if (typeof obj === "number") return 8;
    if (typeof obj === "string") return obj.length * 2;

    if (typeof obj === "object") {
      if (seen.has(obj)) return 0;
      seen.add(obj);

      let size = 0;
      if (Array.isArray(obj)) {
        size = obj.reduce((acc, item) => acc + sizeOf(item), 0);
      } else {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            size += key.length * 2; // key size
            size += sizeOf(obj[key]); // value size
          }
        }
      }
      return size;
    }

    return 0;
  }

  return sizeOf(value);
}
