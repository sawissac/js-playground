const STORAGE_KEY = "js-playground-ai-settings";

export type AiProvider = "ollama" | "gemini";

export interface AiSettings {
  provider: AiProvider;
  // Ollama
  ollamaUrl: string;
  ollamaModel: string;
  // Gemini
  geminiApiKey: string;
  geminiModel: string;
}

const DEFAULT_SETTINGS: AiSettings = {
  provider: "ollama",
  ollamaUrl: "",
  ollamaModel: "",
  geminiApiKey: "",
  geminiModel: "gemini-2.0-flash",
};

const GEMINI_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export function getGeminiModelList(): string[] {
  return GEMINI_MODELS;
}

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isAiConfigured(): boolean {
  const s = getAiSettings();
  if (s.provider === "ollama") return Boolean(s.ollamaUrl && s.ollamaModel);
  if (s.provider === "gemini") return Boolean(s.geminiApiKey && s.geminiModel);
  return false;
}

export function getActiveModelName(): string {
  const s = getAiSettings();
  if (s.provider === "ollama") return s.ollamaModel || "Not set";
  if (s.provider === "gemini") return s.geminiModel || "Not set";
  return "Not set";
}

export async function fetchOllamaModels(url: string): Promise<string[]> {
  try {
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}

export async function validateGeminiApiKey(
  apiKey: string,
  model: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("/api/chat/gemini-validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model }),
    });
    if (res.ok) return { valid: true };
    const data = await res.json();
    return { valid: false, error: data.error || "Validation failed" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { valid: false, error: message };
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  systemPrompt?: string,
) {
  const settings = getAiSettings();

  if (!isAiConfigured()) {
    onError(
      "AI is not configured. Please open settings and configure a provider.",
    );
    return;
  }

  const fullMessages = systemPrompt
    ? [{ role: "system" as const, content: systemPrompt }, ...messages]
    : messages;

  try {
    const endpoint =
      settings.provider === "gemini" ? "/api/chat/gemini" : "/api/chat";

    const body =
      settings.provider === "gemini"
        ? {
            apiKey: settings.geminiApiKey,
            model: settings.geminiModel,
            messages: fullMessages,
          }
        : {
            ollamaUrl: settings.ollamaUrl,
            model: settings.ollamaModel,
            messages: fullMessages,
          };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMsg = `Request failed: ${res.status}`;
      try {
        const data = JSON.parse(text);
        errorMsg = data.error ?? errorMsg;
      } catch {
        errorMsg = text || errorMsg;
      }
      onError(errorMsg);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("No response stream");
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    onError(`Connection failed: ${message}`);
  }
}
