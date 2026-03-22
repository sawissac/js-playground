/**
 * CDN Package Security and Validation
 */

// Trusted CDN domains whitelist
const TRUSTED_CDN_DOMAINS = [
  "cdn.jsdelivr.net",
  "unpkg.com",
  "cdnjs.cloudflare.com",
  "cdn.skypack.dev",
  "esm.sh",
  "cdn.esm.sh",
  "ga.jspm.io",
];

// Common malicious patterns in URLs
const MALICIOUS_PATTERNS = [
  /javascript:/i,
  /data:/i,
  /vbscript:/i,
  /<script/i,
  /eval\(/i,
  /onclick=/i,
  /onerror=/i,
];

export interface CDNValidationResult {
  valid: boolean;
  trusted: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate CDN URL for security
 */
export function validateCDNUrl(url: string): CDNValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  let valid = true;
  let trusted = false;

  // Basic validation
  if (!url || typeof url !== "string") {
    errors.push("CDN URL is required");
    return { valid: false, trusted: false, warnings, errors };
  }

  // Trim whitespace
  url = url.trim();

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      errors.push(`Potentially malicious pattern detected: ${pattern.source}`);
      valid = false;
    }
  }

  // Parse URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    errors.push("Invalid URL format");
    return { valid: false, trusted: false, warnings, errors };
  }

  // Only allow HTTPS (or HTTP for localhost dev)
  if (parsedUrl.protocol !== "https:") {
    if (parsedUrl.protocol === "http:" && parsedUrl.hostname === "localhost") {
      warnings.push("Using HTTP for localhost (dev only)");
    } else {
      errors.push("Only HTTPS URLs are allowed for security");
      valid = false;
    }
  }

  // Check if domain is in trusted list
  const hostname = parsedUrl.hostname.toLowerCase();
  trusted = TRUSTED_CDN_DOMAINS.some((domain) => {
    // Exact match or subdomain match
    return hostname === domain || hostname.endsWith(`.${domain}`);
  });

  if (!trusted) {
    warnings.push(
      `Domain "${hostname}" is not in the trusted CDN list. Use at your own risk.`
    );
  }

  // Check file extension
  const pathname = parsedUrl.pathname.toLowerCase();
  if (!pathname.endsWith(".js") && !pathname.endsWith(".mjs")) {
    warnings.push("URL does not end with .js or .mjs extension");
  }

  // Check for suspicious query parameters
  if (parsedUrl.search && parsedUrl.search.length > 200) {
    warnings.push("URL has unusually long query parameters");
  }

  return {
    valid,
    trusted,
    warnings,
    errors,
  };
}

/**
 * Generate Subresource Integrity (SRI) hash for a script
 * Note: This is a client-side implementation and should be used for verification only
 */
export async function generateSRIHash(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const content = await response.text();
    
    // Use SubtleCrypto to generate SHA-384 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-384", data);
    
    // Convert to base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    
    return `sha384-${hashBase64}`;
  } catch (error) {
    console.error("Failed to generate SRI hash:", error);
    return null;
  }
}

/**
 * Load CDN script with security checks
 */
export async function loadCDNScriptSecurely(
  url: string,
  options: {
    requireTrusted?: boolean;
    useSRI?: boolean;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  const { requireTrusted = false, useSRI = false, timeout = 10000 } = options;

  // Validate URL
  const validation = validateCDNUrl(url);
  
  if (!validation.valid) {
    return {
      success: false,
      error: `CDN validation failed: ${validation.errors.join(", ")}`,
    };
  }

  if (requireTrusted && !validation.trusted) {
    return {
      success: false,
      error: "Only trusted CDN domains are allowed in this mode",
    };
  }

  // Check if script already loaded
  const existingScript = document.querySelector(`script[src="${url}"]`);
  if (existingScript) {
    return { success: true };
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;

    // Set timeout
    const timeoutId = setTimeout(() => {
      script.remove();
      resolve({
        success: false,
        error: `Script loading timeout after ${timeout}ms`,
      });
    }, timeout);

    script.onload = () => {
      clearTimeout(timeoutId);
      resolve({ success: true });
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      script.remove();
      resolve({
        success: false,
        error: "Failed to load script",
      });
    };

    // Add SRI if requested (experimental)
    if (useSRI) {
      generateSRIHash(url).then((hash) => {
        if (hash) {
          script.integrity = hash;
          script.crossOrigin = "anonymous";
        }
        document.head.appendChild(script);
      }).catch(() => {
        // Fallback without SRI
        document.head.appendChild(script);
      });
    } else {
      document.head.appendChild(script);
    }
  });
}

/**
 * Get list of trusted CDN domains
 */
export function getTrustedCDNDomains(): string[] {
  return [...TRUSTED_CDN_DOMAINS];
}

/**
 * Check if a domain is trusted
 */
export function isTrustedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return TRUSTED_CDN_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize CDN package name for safe JavaScript usage
 */
export function sanitizeCDNName(name: string): string {
  // Remove special characters and ensure valid JS identifier
  return name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^[0-9]/, "_$&");
}

/**
 * Predefined safe CDN packages with verified URLs
 */
export const VERIFIED_CDN_PACKAGES = {
  d3: {
    name: "D3.js",
    url: "https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js",
    version: "7.x",
    trusted: true,
  },
  lodash: {
    name: "Lodash",
    url: "https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js",
    version: "4.x",
    trusted: true,
  },
  axios: {
    name: "Axios",
    url: "https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js",
    version: "1.x",
    trusted: true,
  },
  three: {
    name: "Three.js",
    url: "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
    version: "0.160.0",
    trusted: true,
  },
  chartjs: {
    name: "Chart.js",
    url: "https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js",
    version: "4.x",
    trusted: true,
  },
  moment: {
    name: "Moment.js",
    url: "https://cdn.jsdelivr.net/npm/moment@2/moment.min.js",
    version: "2.x",
    trusted: true,
  },
  gsap: {
    name: "GSAP",
    url: "https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js",
    version: "3.x",
    trusted: true,
  },
  p5: {
    name: "p5.js",
    url: "https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js",
    version: "1.x",
    trusted: true,
  },
  jquery: {
    name: "jQuery",
    url: "https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js",
    version: "3.x",
    trusted: true,
  },
  dayjs: {
    name: "Day.js",
    url: "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js",
    version: "1.x",
    trusted: true,
  },
};
