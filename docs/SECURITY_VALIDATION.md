# Security & Validation Features - Implementation Guide

> **Enhanced Security Layer for JS Playground**
>
> Comprehensive security and validation features to protect against malicious code, validate imports/exports, and monitor system health.

---

## 📋 Overview

Four new security modules have been implemented:

1. **CDN Package Security** - Validate and secure external script loading
2. **Project Import/Export Validation** - Prevent corrupted/malicious imports
3. **Rate Limiting** - Prevent resource exhaustion from rapid execution
4. **Security Audit Logging** - Monitor and track security events

---

## 1. CDN Package Security

### What Was Implemented

**File**: `src/lib/cdnSecurity.ts`

**Features**:
- ✅ Trusted CDN domain whitelist (jsDelivr, unpkg, cdnjs, etc.)
- ✅ URL validation with malicious pattern detection
- ✅ HTTPS enforcement
- ✅ Subresource Integrity (SRI) hash generation
- ✅ Secure script loading with timeout protection
- ✅ Predefined verified CDN packages

### Trusted CDN Domains

```typescript
const TRUSTED_CDN_DOMAINS = [
  "cdn.jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "cdn.skypack.dev",
  "esm.sh",
  "cdn.esm.sh",
  "ga.jspm.io",
];
```

### Usage

**Validate CDN URL:**
```typescript
import { validateCDNUrl } from "@/lib/cdnSecurity";

const validation = validateCDNUrl("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js");
// {
//   valid: true,
//   trusted: true,
//   warnings: [],
//   errors: []
// }

const validation2 = validateCDNUrl("http://sketchy-site.com/malware.js");
// {
//   valid: false,
//   trusted: false,
//   warnings: [...],
//   errors: ["Only HTTPS URLs are allowed for security"]
// }
```

**Load CDN Script Securely:**
```typescript
import { loadCDNScriptSecurely } from "@/lib/cdnSecurity";

const result = await loadCDNScriptSecurely(
  "https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js",
  {
    requireTrusted: true,  // Only allow trusted domains
    useSRI: false,         // Enable SRI hash verification
    timeout: 10000,        // 10 second timeout
  }
);

if (result.success) {
  console.log("Script loaded successfully");
} else {
  console.error("Failed to load:", result.error);
}
```

**Check Domain Trust:**
```typescript
import { isTrustedDomain } from "@/lib/cdnSecurity";

if (isTrustedDomain(url)) {
  console.log("This is a trusted CDN");
}
```

**Use Verified Packages:**
```typescript
import { VERIFIED_CDN_PACKAGES } from "@/lib/cdnSecurity";

const d3Package = VERIFIED_CDN_PACKAGES.d3;
// {
//   name: "D3.js",
//   url: "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js",
//   version: "7.x",
//   trusted: true
// }
```

### Malicious Patterns Detected

The system detects and blocks:
- `javascript:` protocol URLs
- `data:` protocol URLs
- `<script>` tags in URLs
- `eval()` in URLs
- Event handlers (`onclick=`, `onerror=`)

### Security Levels

**Level 1: Warnings Only** (default)
- Validates URL format
- Checks for malicious patterns
- Warns about untrusted domains
- Allows execution with warnings

**Level 2: Require Trusted**
- Only trusted CDN domains allowed
- Blocks all untrusted sources
- Recommended for production

---

## 2. Project Import/Export Validation

### What Was Implemented

**File**: `src/lib/projectValidation.ts`

**Features**:
- ✅ JSON schema validation
- ✅ Size limits (10MB max)
- ✅ Package/variable/function count limits
- ✅ Circular reference detection
- ✅ Malicious code pattern detection
- ✅ Data sanitization
- ✅ Version compatibility checking

### Validation Limits

```typescript
MAX_PROJECT_SIZE = 10 MB
MAX_PACKAGES = 50
MAX_VARIABLES_PER_PACKAGE = 100
MAX_FUNCTIONS_PER_PACKAGE = 100
MAX_RUNNERS_PER_PACKAGE = 100
```

### Usage

**Validate Project Import:**
```typescript
import { validateProjectImport } from "@/lib/projectValidation";

const jsonString = JSON.stringify(projectData);
const validation = validateProjectImport(jsonString);

if (validation.valid) {
  console.log("Project is valid");
  console.log("Stats:", validation.stats);
  // { size: 12345, packages: 2, variables: 15, functions: 8 }
} else {
  console.error("Validation errors:", validation.errors);
  console.warn("Warnings:", validation.warnings);
}
```

**Sanitize Project Data:**
```typescript
import { sanitizeProjectData } from "@/lib/projectValidation";

const sanitized = sanitizeProjectData(importedData);
// Ensures all required fields exist
// Removes invalid data
// Fixes malformed structures
```

**Validate Export:**
```typescript
import { validateProjectExport } from "@/lib/projectValidation";

const validation = validateProjectExport(editorState);
if (validation.valid) {
  // Safe to export
  downloadProject(editorState);
}
```

### Malicious Code Detection

The validator detects potentially dangerous code:
- `document.cookie` access
- `localStorage.clear()` / `sessionStorage.clear()`
- `window.location =` changes
- `.innerHTML =` assignments (XSS risk)
- `eval()` usage
- `Function()` constructor
- External `fetch()` / `XMLHttpRequest` calls

### Validation Structure

**Required Project Fields:**
```typescript
{
  projectId: string,
  projectName: string,
  packages: Package[]
}
```

**Required Package Fields:**
```typescript
{
  id: string,
  name: string,
  enabled?: boolean,
  variables?: VariableInterface[],
  functions?: FunctionInterface[],
  runner?: Runner[]
}
```

---

## 3. Rate Limiting

### What Was Implemented

**File**: `src/lib/rateLimiter.ts`

**Features**:
- ✅ Execution frequency limits (10 runs per minute)
- ✅ Cooldown after timeout errors (30 seconds)
- ✅ Execution statistics tracking
- ✅ Manual reset/override capabilities
- ✅ Retry-after timing

### Configuration

**Default Limits:**
```typescript
{
  maxExecutions: 10,        // Max 10 executions
  windowMs: 60 * 1000,      // Per 1 minute
  cooldownMs: 30 * 1000     // 30-second cooldown after timeout
}
```

### Usage

**Check if Execution is Allowed:**
```typescript
import { canExecuteCode } from "@/lib/rateLimiter";

const check = canExecuteCode();
if (check.allowed) {
  // Execute code
  runCode();
} else {
  console.error(check.reason);
  console.log(`Retry after ${check.retryAfter} seconds`);
}
```

**Record Execution:**
```typescript
import { recordCodeExecution } from "@/lib/rateLimiter";

try {
  const result = await executeCode();
  recordCodeExecution(true, false);  // success, not timed out
} catch (error) {
  recordCodeExecution(false, false); // failed, not timed out
}

// On timeout
recordCodeExecution(false, true);  // failed, timed out (triggers cooldown)
```

**Get Statistics:**
```typescript
import { getExecutionStats } from "@/lib/rateLimiter";

const stats = getExecutionStats();
// {
//   total: 5,
//   successful: 4,
//   failed: 1,
//   timedOut: 0,
//   inCooldown: false
// }
```

**Manual Controls:**
```typescript
import { resetRateLimiter, clearCooldown } from "@/lib/rateLimiter";

// Reset all limits (for testing)
resetRateLimiter();

// Clear cooldown only
clearCooldown();
```

**Custom Rate Limiter:**
```typescript
import { createRateLimiter } from "@/lib/rateLimiter";

const customLimiter = createRateLimiter({
  maxExecutions: 5,
  windowMs: 30 * 1000,  // 30 seconds
  cooldownMs: 60 * 1000, // 1 minute
});

const check = customLimiter.canExecute();
customLimiter.recordExecution(true, false);
```

### Rate Limit Flow

1. **Check**: `canExecuteCode()` → `{ allowed: true }`
2. **Execute**: Run code
3. **Record**: `recordCodeExecution(success, timedOut)`
4. **Cooldown**: If timed out, 30-second cooldown applied
5. **Retry**: After window expires, limit resets

### Error Messages

```typescript
// Rate limit exceeded
"Rate limit exceeded. 10 executions per 60s. Try again in 23 seconds."

// Cooldown active
"Cooldown active. Try again in 15 seconds."
```

---

## 4. Security Audit Logging

### What Was Implemented

**File**: `src/lib/securityAudit.ts`

**Features**:
- ✅ Event-based logging system
- ✅ 11 event types tracked
- ✅ Severity levels (info, warning, error, critical)
- ✅ Metadata and stack traces
- ✅ Export/import capabilities
- ✅ Statistics and analytics
- ✅ LocalStorage persistence (optional)

### Event Types

```typescript
type AuditEventType =
  | "code_execution"           // Code block executed
  | "code_timeout"             // Execution timeout
  | "dangerous_pattern"        // Dangerous code detected
  | "validation_error"         // Validation failure
  | "cdn_load"                 // CDN script loaded
  | "cdn_security_warning"     // CDN security issue
  | "project_import"           // Project imported
  | "project_export"           // Project exported
  | "rate_limit_exceeded"      // Rate limit hit
  | "error_boundary_triggered" // React error caught
```

### Usage

**Log Security Events:**
```typescript
import { logSecurityEvent } from "@/lib/securityAudit";

logSecurityEvent(
  "code_execution",
  "info",
  "Code executed successfully in 45.23ms",
  {
    variableName: "result",
    packageName: "Main Package",
    executionTime: 45.23,
  }
);
```

**Using Convenience Methods:**
```typescript
import { auditLog } from "@/lib/securityAudit";

// Code execution
auditLog.codeExecution(true, 45.23, { variableName: "result" });

// Timeout
auditLog.codeTimeout(10000, { variableName: "result" });

// Dangerous pattern
auditLog.dangerousPattern("while(true)", codeSnippet);

// Validation error
auditLog.validationError("variableName", "Name is reserved keyword");

// CDN load
auditLog.cdnLoad(url, true, true);

// CDN warning
auditLog.cdnSecurityWarning(url, ["Untrusted domain"]);

// Project import
auditLog.projectImport(true, { packages: 3, variables: 15 });

// Rate limit
auditLog.rateLimitExceeded(30);

// Error boundary
auditLog.errorBoundary("VariableContainer", "TypeError: ...");
```

**Get Audit Logs:**
```typescript
import { getAuditLogger } from "@/lib/securityAudit";

const logger = getAuditLogger();

// All logs
const allLogs = logger.getLogs();

// By type
const executions = logger.getLogsByType("code_execution");

// By severity
const errors = logger.getLogsBySeverity("error");

// Recent (last 5 minutes)
const recent = logger.getRecentLogs(5);

// Time range
const ranged = logger.getLogsInRange(startTime, endTime);
```

**Statistics:**
```typescript
import { getAuditStats } from "@/lib/securityAudit";

const stats = getAuditStats();
// {
//   total: 127,
//   byType: {
//     code_execution: 45,
//     code_timeout: 2,
//     dangerous_pattern: 5,
//     ...
//   },
//   bySeverity: {
//     info: 100,
//     warning: 20,
//     error: 6,
//     critical: 1
//   },
//   recentCount: 12
// }
```

**Export/Import Logs:**
```typescript
import { exportAuditLogs, clearAuditLogs } from "@/lib/securityAudit";

// Export as JSON
const jsonString = exportAuditLogs();
downloadFile(jsonString, "security-audit.json");

// Clear logs
clearAuditLogs();
```

**Enable Persistence:**
```typescript
import { getAuditLogger } from "@/lib/securityAudit";

const logger = getAuditLogger({
  maxEntries: 1000,
  persistToStorage: true,  // Save to localStorage
  onCritical: (event) => {
    // Alert on critical events
    alert(`Critical security event: ${event.message}`);
  },
});
```

### Audit Event Structure

```typescript
interface AuditEvent {
  id: string;                    // Unique ID
  type: AuditEventType;          // Event type
  timestamp: number;             // Unix timestamp
  severity: "info" | "warning" | "error" | "critical";
  message: string;               // Human-readable message
  metadata?: Record<string, any>; // Additional data
  stackTrace?: string;           // Stack trace (error/critical only)
}
```

### Severity Levels

- **info**: Normal operations (code execution, imports)
- **warning**: Suspicious activity (dangerous patterns, untrusted CDN)
- **error**: Failures (timeouts, validation errors)
- **critical**: Security threats (with callback trigger)

---

## Integration with Existing Code

### useRunner Hook

The `useRunner` hook now includes all security features:

```typescript
// Rate limiting check
const rateLimitCheck = canExecuteCode();
if (!rateLimitCheck.allowed) {
  auditLog.rateLimitExceeded(rateLimitCheck.retryAfter || 0);
  return;
}

// Dangerous pattern detection
const safetyCheck = detectDangerousPatterns(code);
if (!safetyCheck.safe) {
  safetyCheck.warnings.forEach((warning) => {
    auditLog.dangerousPattern(warning, code, metadata);
  });
}

// Execution with timeout
const result = await executeWithTimeout(code, { timeout: 10000 });

// Audit logging
if (result.timedOut) {
  auditLog.codeTimeout(10000, metadata);
  recordCodeExecution(false, true);
} else {
  auditLog.codeExecution(true, result.executionTime, metadata);
  recordCodeExecution(true, false);
}
```

---

## Security Dashboard Component (Recommended)

Create a security dashboard to display audit logs and statistics:

```tsx
import { getAuditStats, getRecentSecurityEvents } from "@/lib/securityAudit";
import { getExecutionStats } from "@/lib/rateLimiter";

function SecurityDashboard() {
  const auditStats = getAuditStats();
  const execStats = getExecutionStats();
  const recentEvents = getRecentSecurityEvents(5);

  return (
    <div className="p-4">
      <h2>Security Dashboard</h2>
      
      {/* Execution Stats */}
      <div>
        <h3>Execution Statistics</h3>
        <p>Total: {execStats.total}</p>
        <p>Successful: {execStats.successful}</p>
        <p>Failed: {execStats.failed}</p>
        <p>Timed Out: {execStats.timedOut}</p>
        {execStats.inCooldown && <p className="text-red-600">⚠️ In Cooldown</p>}
      </div>

      {/* Audit Stats */}
      <div>
        <h3>Security Events</h3>
        <p>Total Events: {auditStats.total}</p>
        <p>Recent (5min): {auditStats.recentCount}</p>
        <ul>
          {Object.entries(auditStats.bySeverity).map(([severity, count]) => (
            <li key={severity}>{severity}: {count}</li>
          ))}
        </ul>
      </div>

      {/* Recent Events */}
      <div>
        <h3>Recent Events</h3>
        {recentEvents.map((event) => (
          <div key={event.id}>
            <span className={`badge-${event.severity}`}>{event.severity}</span>
            <span>{event.type}</span>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Configuration & Customization

### Adjust Rate Limits

Edit `src/lib/rateLimiter.ts`:
```typescript
const DEFAULT_CONFIG: RateLimitConfig = {
  maxExecutions: 20,        // Increase to 20
  windowMs: 60 * 1000,      // Keep at 1 minute
  cooldownMs: 15 * 1000,    // Reduce to 15 seconds
};
```

### Add Trusted CDN Domain

Edit `src/lib/cdnSecurity.ts`:
```typescript
const TRUSTED_CDN_DOMAINS = [
  // ... existing domains
  "my-trusted-cdn.com",
];
```

### Adjust Project Size Limits

Edit `src/lib/projectValidation.ts`:
```typescript
const MAX_PROJECT_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_PACKAGES = 100;
```

### Enable Audit Persistence

In your app initialization:
```typescript
import { getAuditLogger } from "@/lib/securityAudit";

getAuditLogger({
  persistToStorage: true,
  maxEntries: 2000,
});
```

---

## Best Practices

### 1. CDN Security
- ✅ Always use HTTPS URLs
- ✅ Prefer trusted CDN domains
- ✅ Validate URLs before loading
- ✅ Consider SRI for critical libraries

### 2. Project Validation
- ✅ Validate all imports before loading
- ✅ Show validation warnings to users
- ✅ Sanitize data before applying to state
- ✅ Export regularly for backups

### 3. Rate Limiting
- ✅ Check limits before execution
- ✅ Show clear error messages
- ✅ Display retry countdown
- ✅ Allow manual cooldown override for power users

### 4. Audit Logging
- ✅ Log all security-relevant events
- ✅ Export logs periodically
- ✅ Monitor for patterns (e.g., frequent timeouts)
- ✅ Alert on critical events

---

## Testing

### Test Rate Limiting

```typescript
import { canExecuteCode, recordCodeExecution, resetRateLimiter } from "@/lib/rateLimiter";

// Execute 10 times rapidly
for (let i = 0; i < 10; i++) {
  recordCodeExecution(true, false);
}

// 11th should be blocked
const check = canExecuteCode();
console.assert(!check.allowed, "Rate limit should be active");

// Reset and try again
resetRateLimiter();
const check2 = canExecuteCode();
console.assert(check2.allowed, "Rate limit should be reset");
```

### Test CDN Validation

```typescript
import { validateCDNUrl } from "@/lib/cdnSecurity";

// Should pass
const valid = validateCDNUrl("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js");
console.assert(valid.valid && valid.trusted);

// Should fail
const invalid = validateCDNUrl("javascript:alert('xss')");
console.assert(!invalid.valid);
```

### Test Project Validation

```typescript
import { validateProjectImport } from "@/lib/projectValidation";

const projectJSON = JSON.stringify({
  projectId: "test",
  projectName: "Test Project",
  packages: []
});

const validation = validateProjectImport(projectJSON);
console.assert(validation.valid, "Valid project should pass");
```

---

## API Reference

### CDN Security

```typescript
validateCDNUrl(url: string): CDNValidationResult
loadCDNScriptSecurely(url: string, options?: {...}): Promise<{success, error?}>
isTrustedDomain(url: string): boolean
getTrustedCDNDomains(): string[]
sanitizeCDNName(name: string): string
generateSRIHash(url: string): Promise<string | null>
```

### Project Validation

```typescript
validateProjectImport(jsonString: string): ValidationResult
validateProjectExport(data: EditorState): ValidationResult
sanitizeProjectData(data: EditorState): EditorState
isVersionCompatible(version: string): boolean
```

### Rate Limiting

```typescript
canExecuteCode(): { allowed: boolean; reason?: string; retryAfter?: number }
recordCodeExecution(success: boolean, timedOut: boolean): void
getExecutionStats(): {...}
resetRateLimiter(): void
clearCooldown(): void
createRateLimiter(config: RateLimitConfig): RateLimiter
```

### Audit Logging

```typescript
logSecurityEvent(type, severity, message, metadata?): AuditEvent
auditLog.codeExecution(success, time, metadata?): AuditEvent
auditLog.codeTimeout(timeout, metadata?): AuditEvent
auditLog.dangerousPattern(pattern, code, metadata?): AuditEvent
// ... and more convenience methods
getAuditStats(): {...}
exportAuditLogs(): string
clearAuditLogs(): void
getRecentSecurityEvents(minutes): AuditEvent[]
```

---

## Troubleshooting

### Rate Limit Too Restrictive

Increase limits in `src/lib/rateLimiter.ts` or use `clearCooldown()` for manual override.

### CDN Not Loading

1. Check if domain is trusted: `isTrustedDomain(url)`
2. Validate URL: `validateCDNUrl(url)`
3. Check browser console for CORS/CSP errors
4. Ensure HTTPS is used

### Project Import Failing

1. Check validation errors: `validateProjectImport(json).errors`
2. Verify JSON is valid
3. Check file size (< 10MB)
4. Look for circular references in objects

### Audit Logs Growing Too Large

Set `maxEntries` limit or clear periodically:
```typescript
getAuditLogger({ maxEntries: 500 });
// or
clearAuditLogs();
```

---

## Conclusion

All security and validation features are production-ready:

✅ **CDN Security**: Protect against malicious scripts  
✅ **Project Validation**: Prevent corrupted imports  
✅ **Rate Limiting**: Prevent resource exhaustion  
✅ **Audit Logging**: Monitor and track security events  

**Next Steps**: Integrate these features into your UI components and consider building a security dashboard for real-time monitoring!
