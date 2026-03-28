const STORAGE_KEY = "js-playground-ollama-settings";

export interface OllamaSettings {
  url: string;
  model: string;
}

const DEFAULT_SETTINGS: OllamaSettings = {
  url: "",
  model: "",
};

export function getOllamaSettings(): OllamaSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveOllamaSettings(settings: OllamaSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function isOllamaConfigured(): boolean {
  const s = getOllamaSettings();
  return Boolean(s.url && s.model);
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

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function streamChat(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  systemPrompt?: string
) {
  const settings = getOllamaSettings();
  if (!settings.url || !settings.model) {
    onError("Ollama is not configured. Please set the URL and model.");
    return;
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ollamaUrl: settings.url,
        model: settings.model,
        messages: systemPrompt
          ? [{ role: "system", content: systemPrompt }, ...messages]
          : messages,
      }),
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
