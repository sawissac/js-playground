/**
 * Security Audit Logging System
 */

export type AuditEventType =
  | "code_execution"
  | "code_timeout"
  | "dangerous_pattern"
  | "validation_error"
  | "cdn_load"
  | "cdn_security_warning"
  | "project_import"
  | "project_export"
  | "rate_limit_exceeded"
  | "error_boundary_triggered";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: number;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

interface AuditLogOptions {
  maxEntries?: number;
  persistToStorage?: boolean;
  onCritical?: (event: AuditEvent) => void;
}

class SecurityAuditLogger {
  private logs: AuditEvent[] = [];
  private options: AuditLogOptions;
  private storageKey = "js-playground-security-audit";

  constructor(options: AuditLogOptions = {}) {
    this.options = {
      maxEntries: options.maxEntries || 1000,
      persistToStorage: options.persistToStorage ?? false,
      onCritical: options.onCritical,
    };

    // Load from storage if enabled
    if (this.options.persistToStorage) {
      this.loadFromStorage();
    }
  }

  /**
   * Log a security event
   */
  log(
    type: AuditEventType,
    severity: "info" | "warning" | "error" | "critical",
    message: string,
    metadata?: Record<string, any>
  ): AuditEvent {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      severity,
      message,
      metadata,
      stackTrace: severity === "error" || severity === "critical" ? new Error().stack : undefined,
    };

    this.logs.push(event);

    // Trim if exceeds max entries
    if (this.logs.length > (this.options.maxEntries || 1000)) {
      this.logs = this.logs.slice(-this.options.maxEntries!);
    }

    // Persist if enabled
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }

    // Trigger critical callback
    if (severity === "critical" && this.options.onCritical) {
      this.options.onCritical(event);
    }

    // Console logging
    const consoleMethod = severity === "error" || severity === "critical" ? "error" : severity === "warning" ? "warn" : "log";
    console[consoleMethod](`[SECURITY AUDIT] [${type}] ${message}`, metadata);

    return event;
  }

  /**
   * Get all logs
   */
  getLogs(): AuditEvent[] {
    return [...this.logs];
  }

  /**
   * Get logs by type
   */
  getLogsByType(type: AuditEventType): AuditEvent[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get logs by severity
   */
  getLogsBySeverity(severity: "info" | "warning" | "error" | "critical"): AuditEvent[] {
    return this.logs.filter((log) => log.severity === severity);
  }

  /**
   * Get logs in time range
   */
  getLogsInRange(startTime: number, endTime: number): AuditEvent[] {
    return this.logs.filter((log) => log.timestamp >= startTime && log.timestamp <= endTime);
  }

  /**
   * Get recent logs (last N minutes)
   */
  getRecentLogs(minutes: number = 5): AuditEvent[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return this.logs.filter((log) => log.timestamp >= cutoff);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    byType: Record<AuditEventType, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
  } {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.logs.forEach((log) => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    return {
      total: this.logs.length,
      byType: byType as Record<AuditEventType, number>,
      bySeverity,
      recentCount: this.getRecentLogs(5).length,
    };
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    if (this.options.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalEvents: this.logs.length,
        events: this.logs,
      },
      null,
      2
    );
  }

  /**
   * Import logs from JSON
   */
  importLogs(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      if (data.events && Array.isArray(data.events)) {
        this.logs = data.events;
        if (this.options.persistToStorage) {
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.error("Failed to import logs:", error);
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error("Failed to save audit logs to storage:", error);
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load audit logs from storage:", error);
    }
  }
}

// Global audit logger instance
let globalAuditLogger: SecurityAuditLogger | null = null;

/**
 * Get or create global audit logger
 */
export function getAuditLogger(options?: AuditLogOptions): SecurityAuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new SecurityAuditLogger(options);
  }
  return globalAuditLogger;
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: AuditEventType,
  severity: "info" | "warning" | "error" | "critical",
  message: string,
  metadata?: Record<string, any>
): AuditEvent {
  return getAuditLogger().log(type, severity, message, metadata);
}

/**
 * Convenience methods for common events
 */
export const auditLog = {
  codeExecution: (success: boolean, executionTime: number, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "code_execution",
      "info",
      `Code executed ${success ? "successfully" : "with error"} in ${executionTime.toFixed(2)}ms`,
      { success, executionTime, ...metadata }
    );
  },

  codeTimeout: (timeout: number, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "code_timeout",
      "warning",
      `Code execution timeout after ${timeout}ms`,
      { timeout, ...metadata }
    );
  },

  dangerousPattern: (pattern: string, code: string, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "dangerous_pattern",
      "warning",
      `Dangerous pattern detected: ${pattern}`,
      { pattern, codeSnippet: code.slice(0, 100), ...metadata }
    );
  },

  validationError: (field: string, error: string, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "validation_error",
      "error",
      `Validation failed for ${field}: ${error}`,
      { field, error, ...metadata }
    );
  },

  cdnLoad: (url: string, success: boolean, trusted: boolean, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "cdn_load",
      success ? "info" : "warning",
      `CDN script ${success ? "loaded" : "failed"}: ${url}`,
      { url, success, trusted, ...metadata }
    );
  },

  cdnSecurityWarning: (url: string, warnings: string[], metadata?: Record<string, any>) => {
    logSecurityEvent(
      "cdn_security_warning",
      "warning",
      `CDN security warnings for ${url}: ${warnings.join(", ")}`,
      { url, warnings, ...metadata }
    );
  },

  projectImport: (success: boolean, stats?: any, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "project_import",
      success ? "info" : "error",
      `Project import ${success ? "successful" : "failed"}`,
      { success, stats, ...metadata }
    );
  },

  projectExport: (projectName: string, size: number, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "project_export",
      "info",
      `Project exported: ${projectName} (${(size / 1024).toFixed(2)}KB)`,
      { projectName, size, ...metadata }
    );
  },

  rateLimitExceeded: (retryAfter: number, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "rate_limit_exceeded",
      "warning",
      `Rate limit exceeded. Retry after ${retryAfter}s`,
      { retryAfter, ...metadata }
    );
  },

  errorBoundary: (component: string, error: string, metadata?: Record<string, any>) => {
    logSecurityEvent(
      "error_boundary_triggered",
      "error",
      `Error boundary caught error in ${component}: ${error}`,
      { component, error, ...metadata }
    );
  },
};

/**
 * Get audit statistics
 */
export function getAuditStats() {
  return getAuditLogger().getStats();
}

/**
 * Export audit logs
 */
export function exportAuditLogs(): string {
  return getAuditLogger().exportLogs();
}

/**
 * Clear audit logs
 */
export function clearAuditLogs() {
  getAuditLogger().clear();
}

/**
 * Get recent security events
 */
export function getRecentSecurityEvents(minutes: number = 5): AuditEvent[] {
  return getAuditLogger().getRecentLogs(minutes);
}
