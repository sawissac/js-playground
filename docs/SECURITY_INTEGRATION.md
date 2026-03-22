# Security & Validation Integration - Complete

> **All security features are now integrated into the UI!**
>
> This document details the integration points and how to use the security features.

---

## ✅ Integration Summary

All 4 security modules have been successfully integrated:

1. ✅ **CDN Package Security** → Renderer Dialog
2. ✅ **Project Import/Export Validation** → Project Sidebar
3. ✅ **Rate Limiting** → useRunner Hook (automatic)
4. ✅ **Security Audit Logging** → All components (automatic)

---

## 1. CDN Package Security Integration

### Location
`src/features/renderer/index.tsx`

### What Was Integrated

**When Adding CDN Package (Custom URL):**
- ✅ Validates URL format and protocol (HTTPS required)
- ✅ Checks against trusted CDN whitelist
- ✅ Detects malicious patterns (javascript:, eval, etc.)
- ✅ Shows validation warnings in real-time
- ✅ Blocks invalid URLs
- ✅ Logs to security audit

**When Editing CDN Package:**
- ✅ Same validation as adding
- ✅ Prevents saving invalid URLs
- ✅ Shows warnings before saving

**When Using Predefined CDN Packages:**
- ✅ All predefined packages use trusted domains
- ✅ No validation needed (pre-verified)

### User Experience

**Valid Trusted CDN:**
```
User enters: https://cdn.jsdelivr.net/npm/lodash@4
Result: ✓ Added successfully, no warnings
```

**Valid Untrusted CDN:**
```
User enters: https://my-cdn.com/library.js
Warning: ⚠️ Domain "my-cdn.com" is not in the trusted CDN list
User can still proceed
```

**Invalid CDN:**
```
User enters: http://insecure-site.com/lib.js
Error: ❌ Only HTTPS URLs are allowed for security
Blocked, cannot proceed
```

**Malicious Pattern:**
```
User enters: javascript:alert('xss')
Error: ❌ Potentially malicious pattern detected
Blocked, cannot proceed
```

### UI Features

- **Real-time validation**: Warnings clear when typing
- **Visual feedback**: Yellow warning box shows security concerns
- **Log integration**: All events logged to console and audit system
- **Non-blocking warnings**: Untrusted domains warn but don't block

---

## 2. Project Import/Export Validation Integration

### Location
`src/features/project-sidebar/index.tsx`

### Export Validation

**What Happens on Export:**
1. ✅ Validates project structure before export
2. ✅ Checks for circular references
3. ✅ Detects malicious code patterns
4. ✅ Shows warnings if found
5. ✅ User confirms to proceed
6. ✅ Logs export with size and stats

**Validation Checks:**
- Project size (max 10MB)
- Required fields present
- Circular references in objects
- Malicious patterns (eval, document.cookie, etc.)
- Package/variable/function count limits

**User Experience:**

**Clean Export:**
```
Click Export → File downloads immediately
Log: "Exported project 'My Project'"
```

**Export with Warnings:**
```
Click Export → Dialog appears:
⚠️ Security warnings detected:
- Code uses eval()
- Code accesses document.cookie

Proceed with export?
[Yes] [No]
```

**Invalid Export:**
```
Click Export → Error message:
❌ Cannot export project:
- Project too large (15MB, max 10MB)
- Variable has circular references

Alert shown, export blocked
```

### Import Validation

**What Happens on Import:**
1. ✅ Validates JSON format
2. ✅ Checks file size (max 10MB)
3. ✅ Validates project structure
4. ✅ Detects malicious code
5. ✅ Sanitizes data
6. ✅ Shows warnings/errors
7. ✅ User confirms to proceed
8. ✅ Logs import with stats

**Validation Checks:**
- File size limit
- Valid JSON format
- Required fields (projectId, projectName, packages)
- Package count (max 50)
- Variables per package (max 100)
- Functions per package (max 100)
- Malicious code patterns
- Circular references

**User Experience:**

**Valid Import:**
```
Select file → Imports successfully
Log: "Imported project: 3 packages, 15 variables, 8 functions"
```

**Import with Warnings:**
```
Select file → Dialog appears:
⚠️ Security warnings detected:
- Code uses eval()
- Code makes external requests (fetch)
- Using .innerHTML (XSS risk)

Proceed with import?
[Yes] [No]
```

**Invalid Import:**
```
Select file → Error message:
❌ Cannot import project:
- Invalid JSON format
- Missing required field: packages
- Project too large (15MB, max 10MB)

Alert shown, import blocked
```

### Package Import

**What Happens:**
1. ✅ Validates package structure
2. ✅ Ensures required fields
3. ✅ Sanitizes data
4. ✅ Imports successfully

---

## 3. Rate Limiting Integration

### Location
`src/hooks/useRunner.ts` (automatic)

### What Happens

**Before Code Execution:**
1. ✅ Checks rate limit (10 runs per minute)
2. ✅ Checks cooldown status (30s after timeout)
3. ✅ Blocks if limit exceeded
4. ✅ Shows error message with retry time

**After Code Execution:**
1. ✅ Records execution (success/failure)
2. ✅ Applies cooldown if timeout occurred
3. ✅ Updates statistics

**User Experience:**

**Normal Execution:**
```
Click Run → Code executes normally
(Up to 10 times per minute)
```

**Rate Limited:**
```
Click Run → Error in logs:
❌ Rate limit exceeded. 10 executions per 60s. 
Try again in 23 seconds.

Code does not execute
```

**Cooldown Active:**
```
Click Run → Error in logs:
❌ Cooldown active. Try again in 15 seconds.

Code does not execute
(Applied after timeout error)
```

### Configuration

Users can see their execution stats:
```javascript
import { getExecutionStats } from "@/lib/rateLimiter";

const stats = getExecutionStats();
// { total: 5, successful: 4, failed: 1, timedOut: 0, inCooldown: false }
```

Developers can adjust limits in `src/lib/rateLimiter.ts`

---

## 4. Security Audit Logging Integration

### Location
Integrated throughout the application (automatic)

### What Gets Logged

**CDN Events:**
- CDN package added/updated
- Validation warnings
- Load success/failure

**Project Events:**
- Project import/export
- Validation results
- File sizes and stats

**Execution Events:**
- Code execution (success/failure)
- Execution time
- Timeout occurrences
- Dangerous pattern detections

**Rate Limit Events:**
- Rate limit exceeded
- Cooldown triggered

**Error Events:**
- Error boundary triggers
- Validation failures

### Viewing Audit Logs

**In Browser Console:**
```
All events are logged with [SECURITY AUDIT] prefix
```

**Programmatically:**
```javascript
import { getAuditStats, getRecentSecurityEvents } from "@/lib/securityAudit";

// Get statistics
const stats = getAuditStats();
console.log(stats);
// {
//   total: 127,
//   byType: { code_execution: 45, cdn_load: 12, ... },
//   bySeverity: { info: 100, warning: 20, error: 7 },
//   recentCount: 12
// }

// Get recent events (last 5 minutes)
const recent = getRecentSecurityEvents(5);
recent.forEach(event => {
  console.log(event.type, event.message, event.metadata);
});
```

**Export Logs:**
```javascript
import { exportAuditLogs } from "@/lib/securityAudit";

const json = exportAuditLogs();
// Download as file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// ... trigger download
```

---

## Testing the Integration

### Test CDN Validation

1. **Open Renderer Dialog**
2. **Click "Custom" to add CDN**
3. **Test Valid Trusted URL:**
   ```
   Name: lodash
   URL: https://cdn.jsdelivr.net/npm/lodash@4
   Result: ✓ Added successfully
   ```

4. **Test Untrusted URL:**
   ```
   Name: mylib
   URL: https://example.com/lib.js
   Result: ⚠️ Warning shown, can still add
   ```

5. **Test Invalid URL:**
   ```
   Name: bad
   URL: http://insecure.com/lib.js
   Result: ❌ Error shown, blocked
   ```

6. **Check Logs:**
   - Open browser console
   - Look for `[SECURITY AUDIT]` messages
   - Verify CDN load events logged

### Test Project Import Validation

1. **Create a test project JSON file:**
   ```json
   {
     "projectId": "test",
     "projectName": "Test Project",
     "packages": [{
       "id": "pkg1",
       "name": "Package 1",
       "variables": [],
       "functions": [],
       "runner": []
     }]
   }
   ```

2. **Test Valid Import:**
   - Click Import Project
   - Select the file
   - Verify import succeeds

3. **Test Invalid Import:**
   - Create file with missing `packages` field
   - Click Import Project
   - Verify error message shown

4. **Test Large Import:**
   - Create file > 10MB
   - Click Import Project
   - Verify "too large" error

5. **Test Malicious Code:**
   - Add `eval()` in code blocks
   - Import file
   - Verify warning dialog appears

### Test Export Validation

1. **Create project with malicious code:**
   - Add code block with `eval("test")`
   - Click Export Project
   - Verify warning dialog appears

2. **Export clean project:**
   - Remove malicious code
   - Click Export Project
   - Verify file downloads immediately

### Test Rate Limiting

1. **Rapid execution test:**
   - Create simple runner
   - Click Run button 11 times rapidly
   - Verify 11th attempt shows rate limit error

2. **Timeout cooldown test:**
   - Create infinite loop: `while(true) {}`
   - Click Run
   - Wait for timeout
   - Try to run again immediately
   - Verify cooldown message shown

3. **Check stats:**
   ```javascript
   // In browser console
   import { getExecutionStats } from "@/lib/rateLimiter";
   console.log(getExecutionStats());
   ```

---

## Configuration

### Adjust CDN Trusted Domains

Edit `src/lib/cdnSecurity.ts`:
```typescript
const TRUSTED_CDN_DOMAINS = [
  "cdn.jsdelivr.net",
  "unpkg.com",
  // Add your trusted domain:
  "my-trusted-cdn.com",
];
```

### Adjust Project Size Limits

Edit `src/lib/projectValidation.ts`:
```typescript
const MAX_PROJECT_SIZE = 10 * 1024 * 1024; // Change to 20MB
const MAX_PACKAGES = 50; // Change to 100
```

### Adjust Rate Limits

Edit `src/lib/rateLimiter.ts`:
```typescript
const DEFAULT_CONFIG = {
  maxExecutions: 10,      // Change to 20
  windowMs: 60 * 1000,    // Change window
  cooldownMs: 30 * 1000,  // Change cooldown
};
```

### Enable Audit Log Persistence

In app initialization (e.g., `src/app/layout.tsx`):
```typescript
import { getAuditLogger } from "@/lib/securityAudit";

// In component or effect
getAuditLogger({
  persistToStorage: true,
  maxEntries: 2000,
});
```

---

## Security Best Practices for Users

### When Adding CDN Packages

1. ✅ **Use predefined packages** when possible (verified and trusted)
2. ✅ **Prefer jsDelivr, unpkg, cdnjs** (trusted domains)
3. ✅ **Always use HTTPS** (not HTTP)
4. ⚠️ **Read warnings carefully** before proceeding
5. ❌ **Don't ignore error messages** (they protect you)

### When Importing Projects

1. ✅ **Only import from trusted sources**
2. ✅ **Read warning dialogs** before accepting
3. ✅ **Check file size** (large files may be suspicious)
4. ⚠️ **Be cautious with** `eval()`, `innerHTML`, external requests
5. ❌ **Don't import** from untrusted sources without review

### When Exporting Projects

1. ✅ **Review warnings** before sharing
2. ✅ **Clean up sensitive code** before export
3. ✅ **Consider recipient's security** when sharing
4. ⚠️ **Document any warnings** in project notes
5. ❌ **Don't export** with known security issues if sharing publicly

---

## Troubleshooting

### CDN won't load

**Problem:** Added CDN but library not available
**Solution:**
1. Check browser console for errors
2. Verify URL is valid and accessible
3. Check if domain is blocked by browser
4. Try using predefined package instead

### Import fails silently

**Problem:** File uploads but nothing happens
**Solution:**
1. Check browser console for errors
2. Verify JSON format is valid
3. Check file size (< 10MB)
4. Ensure required fields are present

### Rate limit too restrictive

**Problem:** Can't run code enough times
**Solution:**
1. Wait for window to reset (1 minute)
2. Contact developer to adjust limits
3. Use `clearCooldown()` if stuck in cooldown (dev only)

### Export shows warnings I don't understand

**Problem:** Security warnings on export
**Solution:**
1. Review the specific warning messages
2. Check code for patterns mentioned
3. Decide if warning is valid concern
4. Document decision if proceeding

---

## API Quick Reference

### CDN Security

```typescript
import { validateCDNUrl, isTrustedDomain } from "@/lib/cdnSecurity";

// Validate URL
const result = validateCDNUrl(url);
if (!result.valid) {
  console.error(result.errors);
}

// Check if trusted
if (isTrustedDomain(url)) {
  console.log("Trusted domain");
}
```

### Project Validation

```typescript
import { validateProjectImport, sanitizeProjectData } from "@/lib/projectValidation";

// Validate import
const result = validateProjectImport(jsonString);
if (result.valid) {
  const clean = sanitizeProjectData(JSON.parse(jsonString));
  // Use clean data
}
```

### Rate Limiting

```typescript
import { canExecuteCode, getExecutionStats } from "@/lib/rateLimiter";

// Check if allowed
const check = canExecuteCode();
if (check.allowed) {
  // Execute
}

// Get stats
const stats = getExecutionStats();
console.log(stats);
```

### Audit Logging

```typescript
import { getAuditStats, exportAuditLogs } from "@/lib/securityAudit";

// Get statistics
const stats = getAuditStats();

// Export logs
const json = exportAuditLogs();
```

---

## Summary

✅ **CDN Security:** Validates all CDN URLs, blocks malicious patterns, warns about untrusted domains

✅ **Project Validation:** Validates imports/exports, detects malicious code, enforces size limits

✅ **Rate Limiting:** Prevents resource exhaustion, 10 runs/minute, 30s cooldown after timeouts

✅ **Audit Logging:** Tracks all security events, exportable logs, comprehensive statistics

**All features are production-ready and fully integrated!** 🎉
