/**
 * Input validation and sanitization utilities
 */

const MAX_NAME_LENGTH = 100;
const MAX_STRING_LENGTH = 10000;
const MAX_CODE_LENGTH = 100000;

// JavaScript reserved words that cannot be used as identifiers
const RESERVED_WORDS = new Set([
  "abstract", "arguments", "await", "boolean", "break", "byte", "case", "catch",
  "char", "class", "const", "continue", "debugger", "default", "delete", "do",
  "double", "else", "enum", "eval", "export", "extends", "false", "final",
  "finally", "float", "for", "function", "goto", "if", "implements", "import",
  "in", "instanceof", "int", "interface", "let", "long", "native", "new",
  "null", "package", "private", "protected", "public", "return", "short",
  "static", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "true", "try", "typeof", "var", "void", "volatile", "while",
  "with", "yield",
]);

/**
 * Validate variable/function name
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name is required" };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be ${MAX_NAME_LENGTH} characters or less` };
  }

  // Must be a valid JavaScript identifier
  const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  if (!validIdentifier.test(name)) {
    return {
      valid: false,
      error: "Name must start with a letter, $, or _ and contain only letters, numbers, $, or _",
    };
  }

  // Check reserved words
  if (RESERVED_WORDS.has(name.toLowerCase())) {
    return { valid: false, error: `"${name}" is a reserved JavaScript keyword` };
  }

  return { valid: true };
}

/**
 * Sanitize variable/function name
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== "string") return "";

  // Remove invalid characters
  let sanitized = name.replace(/[^a-zA-Z0-9_$]/g, "_");

  // Ensure it starts with valid character
  if (!/^[a-zA-Z_$]/.test(sanitized)) {
    sanitized = "_" + sanitized;
  }

  // Truncate if too long
  if (sanitized.length > MAX_NAME_LENGTH) {
    sanitized = sanitized.slice(0, MAX_NAME_LENGTH);
  }

  // Replace reserved words
  if (RESERVED_WORDS.has(sanitized.toLowerCase())) {
    sanitized = "_" + sanitized;
  }

  return sanitized;
}

/**
 * Validate string value length
 */
export function validateStringLength(value: string): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: true }; // Not a string, skip validation
  }

  if (value.length > MAX_STRING_LENGTH) {
    return {
      valid: false,
      error: `String is too long (max ${MAX_STRING_LENGTH} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Validate code length
 */
export function validateCodeLength(code: string): { valid: boolean; error?: string } {
  if (typeof code !== "string") {
    return { valid: false, error: "Code must be a string" };
  }

  if (code.length > MAX_CODE_LENGTH) {
    return {
      valid: false,
      error: `Code is too long (max ${MAX_CODE_LENGTH} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Validate JSON string
 */
export function validateJSON(value: string): { valid: boolean; error?: string; parsed?: any } {
  try {
    const parsed = JSON.parse(value);
    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: "Invalid JSON format" };
  }
}

/**
 * Detect circular references in objects
 */
export function hasCircularReference(obj: any): boolean {
  const seen = new WeakSet();

  function detect(obj: any): boolean {
    if (obj && typeof obj === "object") {
      if (seen.has(obj)) {
        return true;
      }
      seen.add(obj);

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (detect(obj[key])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  return detect(obj);
}

/**
 * Validate variable value based on type
 */
export function validateVariableValue(
  value: any,
  type: string
): { valid: boolean; error?: string } {
  switch (type) {
    case "string":
      if (typeof value !== "string") {
        return { valid: false, error: "Value must be a string" };
      }
      return validateStringLength(value);

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        return { valid: false, error: "Value must be a valid number" };
      }
      if (!isFinite(value)) {
        return { valid: false, error: "Value must be a finite number" };
      }
      return { valid: true };

    case "boolean":
      if (typeof value !== "boolean") {
        return { valid: false, error: "Value must be a boolean" };
      }
      return { valid: true };

    case "array":
      if (!Array.isArray(value)) {
        return { valid: false, error: "Value must be an array" };
      }
      if (value.length > 10000) {
        return { valid: false, error: "Array is too large (max 10000 items)" };
      }
      return { valid: true };

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return { valid: false, error: "Value must be an object" };
      }
      if (hasCircularReference(value)) {
        return { valid: false, error: "Object has circular references" };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Sanitize dangerous characters from user input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  // Remove null bytes
  let sanitized = input.replace(/\0/g, "");

  // Limit length
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.slice(0, MAX_STRING_LENGTH);
  }

  return sanitized;
}

/**
 * Validate package name
 */
export function validatePackageName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Package name is required" };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: "Package name cannot be empty" };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Package name must be ${MAX_NAME_LENGTH} characters or less` };
  }

  return { valid: true };
}

/**
 * Validate CDN URL
 */
export function validateCDNUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "CDN URL is required" };
  }

  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS for security
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return { valid: false, error: "CDN URL must use HTTP or HTTPS protocol" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Project name is required" };
  }

  if (name.trim().length === 0) {
    return { valid: false, error: "Project name cannot be empty" };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Project name must be ${MAX_NAME_LENGTH} characters or less` };
  }

  return { valid: true };
}
