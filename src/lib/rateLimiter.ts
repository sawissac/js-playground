/**
 * Rate Limiting for Code Execution
 */

interface RateLimitConfig {
  maxExecutions: number;
  windowMs: number;
  cooldownMs?: number;
}

interface ExecutionRecord {
  timestamp: number;
  success: boolean;
  timedOut: boolean;
}

class RateLimiter {
  private executions: ExecutionRecord[] = [];
  private config: RateLimitConfig;
  private cooldownUntil: number = 0;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if execution is allowed
   */
  canExecute(): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();

    // Check cooldown
    if (this.cooldownUntil > now) {
      const retryAfter = Math.ceil((this.cooldownUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Cooldown active. Try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Clean old executions outside the window
    this.executions = this.executions.filter(
      (exec) => now - exec.timestamp < this.config.windowMs
    );

    // Check rate limit
    if (this.executions.length >= this.config.maxExecutions) {
      const oldestExec = this.executions[0];
      const retryAfter = Math.ceil(
        (oldestExec.timestamp + this.config.windowMs - now) / 1000
      );
      return {
        allowed: false,
        reason: `Rate limit exceeded. ${this.config.maxExecutions} executions per ${this.config.windowMs / 1000}s. Try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    return { allowed: true };
  }

  /**
   * Record an execution
   */
  recordExecution(success: boolean, timedOut: boolean = false) {
    this.executions.push({
      timestamp: Date.now(),
      success,
      timedOut,
    });

    // Apply cooldown after timeout
    if (timedOut && this.config.cooldownMs) {
      this.cooldownUntil = Date.now() + this.config.cooldownMs;
    }
  }

  /**
   * Get current execution count in window
   */
  getCurrentCount(): number {
    const now = Date.now();
    this.executions = this.executions.filter(
      (exec) => now - exec.timestamp < this.config.windowMs
    );
    return this.executions.length;
  }

  /**
   * Get execution statistics
   */
  getStats(): {
    total: number;
    successful: number;
    failed: number;
    timedOut: number;
    inCooldown: boolean;
  } {
    const now = Date.now();
    const recentExecutions = this.executions.filter(
      (exec) => now - exec.timestamp < this.config.windowMs
    );

    return {
      total: recentExecutions.length,
      successful: recentExecutions.filter((e) => e.success).length,
      failed: recentExecutions.filter((e) => !e.success).length,
      timedOut: recentExecutions.filter((e) => e.timedOut).length,
      inCooldown: this.cooldownUntil > now,
    };
  }

  /**
   * Reset rate limiter
   */
  reset() {
    this.executions = [];
    this.cooldownUntil = 0;
  }

  /**
   * Clear cooldown
   */
  clearCooldown() {
    this.cooldownUntil = 0;
  }
}

// Default configuration: 10 executions per minute, 30-second cooldown after timeout
const DEFAULT_CONFIG: RateLimitConfig = {
  maxExecutions: 10,
  windowMs: 60 * 1000, // 1 minute
  cooldownMs: 30 * 1000, // 30 seconds
};

// Global rate limiter instance
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create global rate limiter
 */
export function getRateLimiter(config?: RateLimitConfig): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter(config || DEFAULT_CONFIG);
  }
  return globalRateLimiter;
}

/**
 * Check if execution is allowed
 */
export function canExecuteCode(): { allowed: boolean; reason?: string; retryAfter?: number } {
  return getRateLimiter().canExecute();
}

/**
 * Record a code execution
 */
export function recordCodeExecution(success: boolean, timedOut: boolean = false) {
  getRateLimiter().recordExecution(success, timedOut);
}

/**
 * Get execution statistics
 */
export function getExecutionStats() {
  return getRateLimiter().getStats();
}

/**
 * Reset rate limiter (for testing or manual reset)
 */
export function resetRateLimiter() {
  getRateLimiter().reset();
}

/**
 * Clear cooldown (for manual override)
 */
export function clearCooldown() {
  getRateLimiter().clearCooldown();
}

/**
 * Create a custom rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}
