/**
 * Project Import/Export Validation
 */

import {
  EditorState,
  Package,
  VariableInterface,
  FunctionInterface,
  Runner,
} from "@/state/types";
import {
  validateName,
  validateCodeLength,
  hasCircularReference,
} from "./validation";

const MAX_PROJECT_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_PACKAGES = 50;
const MAX_VARIABLES_PER_PACKAGE = 100;
const MAX_FUNCTIONS_PER_PACKAGE = 100;
const MAX_RUNNERS_PER_PACKAGE = 100;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    size: number;
    packages: number;
    variables: number;
    functions: number;
  };
}

/**
 * Validate imported project JSON
 */
export function validateProjectImport(jsonString: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check size
  const size = new Blob([jsonString]).size;
  if (size > MAX_PROJECT_SIZE) {
    errors.push(
      `Project too large: ${(size / 1024 / 1024).toFixed(2)}MB (max 10MB)`,
    );
    return { valid: false, errors, warnings };
  }

  // Parse JSON
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch (error: any) {
    errors.push(`Invalid JSON: ${error.message}`);
    return { valid: false, errors, warnings };
  }

  // Validate structure
  if (!data || typeof data !== "object") {
    errors.push("Project data must be an object");
    return { valid: false, errors, warnings };
  }

  // Check required fields
  const requiredFields = ["projectId", "projectName", "packages"];
  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Validate packages
  if (!Array.isArray(data.packages)) {
    errors.push("packages must be an array");
    return { valid: false, errors, warnings };
  }

  if (data.packages.length > MAX_PACKAGES) {
    errors.push(
      `Too many packages: ${data.packages.length} (max ${MAX_PACKAGES})`,
    );
    return { valid: false, errors, warnings };
  }

  // Validate each package
  let totalVariables = 0;
  let totalFunctions = 0;

  for (let i = 0; i < data.packages.length; i++) {
    const pkg = data.packages[i];
    const pkgErrors = validatePackage(pkg, i);
    errors.push(...pkgErrors.errors);
    warnings.push(...pkgErrors.warnings);

    if (pkg.variables) totalVariables += pkg.variables.length;
    if (pkg.functions) totalFunctions += pkg.functions.length;
  }

  // Check for malicious code patterns
  const codeWarnings = detectMaliciousCode(data);
  warnings.push(...codeWarnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      size,
      packages: data.packages.length,
      variables: totalVariables,
      functions: totalFunctions,
    },
  };
}

/**
 * Validate a single package
 */
function validatePackage(pkg: any, index: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pkg || typeof pkg !== "object") {
    errors.push(`Package ${index} is not an object`);
    return { valid: false, errors, warnings };
  }

  // Required fields
  if (!pkg.id) errors.push(`Package ${index} missing id`);
  if (!pkg.name) errors.push(`Package ${index} missing name`);

  // Validate arrays
  if (pkg.variables) {
    if (!Array.isArray(pkg.variables)) {
      errors.push(`Package ${index} variables must be an array`);
    } else {
      if (pkg.variables.length > MAX_VARIABLES_PER_PACKAGE) {
        errors.push(
          `Package ${index} has too many variables: ${pkg.variables.length} (max ${MAX_VARIABLES_PER_PACKAGE})`,
        );
      }
      pkg.variables.forEach((v: any, i: number) => {
        const varErrors = validateVariable(v, index, i);
        errors.push(...varErrors.errors);
        warnings.push(...varErrors.warnings);
      });
    }
  }

  if (pkg.functions) {
    if (!Array.isArray(pkg.functions)) {
      errors.push(`Package ${index} functions must be an array`);
    } else {
      if (pkg.functions.length > MAX_FUNCTIONS_PER_PACKAGE) {
        errors.push(
          `Package ${index} has too many functions: ${pkg.functions.length} (max ${MAX_FUNCTIONS_PER_PACKAGE})`,
        );
      }
      pkg.functions.forEach((f: any, i: number) => {
        const funcErrors = validateFunction(f, index, i);
        errors.push(...funcErrors.errors);
        warnings.push(...funcErrors.warnings);
      });
    }
  }

  if (pkg.runner) {
    if (!Array.isArray(pkg.runner)) {
      errors.push(`Package ${index} runner must be an array`);
    } else {
      if (pkg.runner.length > MAX_RUNNERS_PER_PACKAGE) {
        errors.push(
          `Package ${index} has too many runners: ${pkg.runner.length} (max ${MAX_RUNNERS_PER_PACKAGE})`,
        );
      }
      pkg.runner.forEach((r: any, i: number) => {
        const runnerErrors = validateRunner(r, index, i);
        errors.push(...runnerErrors.errors);
        warnings.push(...runnerErrors.warnings);
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a variable
 */
function validateVariable(
  variable: any,
  pkgIndex: number,
  varIndex: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!variable.id) {
    errors.push(`Package ${pkgIndex} variable ${varIndex} missing id`);
  }

  if (!variable.name) {
    errors.push(`Package ${pkgIndex} variable ${varIndex} missing name`);
  } else {
    const nameValidation = validateName(variable.name);
    if (!nameValidation.valid) {
      // Variable names are for display, so invalid identifiers are warnings, not errors
      warnings.push(
        `Package ${pkgIndex} variable ${varIndex}: ${nameValidation.error}`,
      );
    }
  }

  // Check for circular references in objects
  if (variable.type === "object" && variable.value) {
    if (hasCircularReference(variable.value)) {
      errors.push(
        `Package ${pkgIndex} variable ${varIndex} has circular references`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a function
 */
function validateFunction(
  func: any,
  pkgIndex: number,
  funcIndex: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!func.id) {
    errors.push(`Package ${pkgIndex} function ${funcIndex} missing id`);
  }

  if (!func.name) {
    errors.push(`Package ${pkgIndex} function ${funcIndex} missing name`);
  } else {
    const nameValidation = validateName(func.name);
    if (!nameValidation.valid) {
      // Function names are for display, so invalid identifiers are warnings, not errors
      warnings.push(
        `Package ${pkgIndex} function ${funcIndex}: ${nameValidation.error}`,
      );
    }
  }

  if (func.actions && Array.isArray(func.actions)) {
    func.actions.forEach((action: any, i: number) => {
      if (action.name === "code" && action.value) {
        const codeValidation = validateCodeLength(action.value);
        if (!codeValidation.valid) {
          warnings.push(
            `Package ${pkgIndex} function ${funcIndex} action ${i}: ${codeValidation.error}`,
          );
        }
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate a runner
 */
function validateRunner(
  runner: any,
  pkgIndex: number,
  runnerIndex: number,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!runner.id) {
    errors.push(`Package ${pkgIndex} runner ${runnerIndex} missing id`);
  }

  if (!runner.type) {
    errors.push(`Package ${pkgIndex} runner ${runnerIndex} missing type`);
  } else if (!["set", "call", "code"].includes(runner.type)) {
    errors.push(
      `Package ${pkgIndex} runner ${runnerIndex} invalid type: ${runner.type}`,
    );
  }

  if (runner.type === "code" && runner.code) {
    const codeValidation = validateCodeLength(runner.code);
    if (!codeValidation.valid) {
      warnings.push(
        `Package ${pkgIndex} runner ${runnerIndex}: ${codeValidation.error}`,
      );
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Detect potentially malicious code in project
 */
function detectMaliciousCode(data: any): string[] {
  const warnings: string[] = [];
  const jsonString = JSON.stringify(data);

  // Dangerous patterns
  const dangerousPatterns = [
    { pattern: /document\.cookie/gi, message: "Code accesses document.cookie" },
    { pattern: /localStorage\.clear/gi, message: "Code clears localStorage" },
    {
      pattern: /sessionStorage\.clear/gi,
      message: "Code clears sessionStorage",
    },
    {
      pattern: /window\.location\s*=/gi,
      message: "Code changes window.location",
    },
    { pattern: /\.innerHTML\s*=/gi, message: "Code uses innerHTML (XSS risk)" },
    { pattern: /eval\s*\(/gi, message: "Code uses eval()" },
    { pattern: /Function\s*\(/gi, message: "Code uses Function constructor" },
    { pattern: /fetch\s*\(/gi, message: "Code makes external requests" },
    {
      pattern: /XMLHttpRequest/gi,
      message: "Code makes external requests (XHR)",
    },
  ];

  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(jsonString)) {
      warnings.push(message);
    }
  }

  return warnings;
}

/**
 * Sanitize imported project data
 */
export function sanitizeProjectData(data: EditorState): EditorState {
  // Deep clone to avoid mutations
  const sanitized = JSON.parse(JSON.stringify(data));

  // Ensure all required fields exist
  if (!sanitized.projectId) sanitized.projectId = `project_${Date.now()}`;
  if (!sanitized.projectName) sanitized.projectName = "Untitled Project";
  if (!sanitized.activePackageId) sanitized.activePackageId = "";
  if (!Array.isArray(sanitized.packages)) sanitized.packages = [];
  if (!Array.isArray(sanitized.dataTypes))
    sanitized.dataTypes = ["string", "number", "boolean", "array"];

  // Sanitize each package
  sanitized.packages = sanitized.packages.map((pkg: Package) => ({
    ...pkg,
    id: pkg.id || `pkg_${Date.now()}`,
    name: pkg.name || "Untitled Package",
    enabled: typeof pkg.enabled === "boolean" ? pkg.enabled : true,
    variables: Array.isArray(pkg.variables) ? pkg.variables : [],
    functions: Array.isArray(pkg.functions) ? pkg.functions : [],
    runner: Array.isArray(pkg.runner) ? pkg.runner : [],
    codeSnippets: Array.isArray(pkg.codeSnippets) ? pkg.codeSnippets : [],
    cdnPackages: Array.isArray(pkg.cdnPackages) ? pkg.cdnPackages : [],
  }));

  return sanitized;
}

/**
 * Validate project export before saving
 */
export function validateProjectExport(data: EditorState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Convert to JSON string
  let jsonString: string;
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch (error: any) {
    errors.push(`Failed to serialize project: ${error.message}`);
    return { valid: false, errors, warnings };
  }

  // Validate as import
  return validateProjectImport(jsonString);
}

/**
 * Check if project version is compatible
 */
export function isVersionCompatible(version: string): boolean {
  // For now, accept any version (future: implement version checking)
  return true;
}
