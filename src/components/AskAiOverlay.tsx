"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { cn } from "@/lib/utils";
import {
  IconSend,
  IconSparkles,
  IconSettings,
  IconCheck,
  IconLoader2,
  IconAlertCircle,
  IconArrowLeft,
  IconTrash,
  IconCopy,
  IconMessageCircle,
  IconCode,
  IconCodePlus,
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconCircleCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  getAiSettings,
  saveAiSettings,
  fetchOllamaModels,
  validateGeminiApiKey,
  getGeminiModelList,
  isAiConfigured,
  getActiveModelName,
  streamChat,
  type ChatMessage,
  type AiSettings,
  type AiProvider,
} from "@/lib/ai-provider";
import { buildAskPrompt, buildCodePrompt } from "@/lib/prompts";
import { useAppSelector, useAppDispatch } from "@/state/hooks";
import {
  addFunctionAction,
  updateFunctionAction,
} from "@/state/slices/editorSlice";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MDEditor from "@uiw/react-md-editor";

type AiMode = "ask" | "code";

interface AskAiOverlayProps {
  open: boolean;
  onClose: () => void;
}

// ─── Copy button for code blocks ────────────────────────────────────────────

const CopyCodeButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "p-1 rounded transition-colors",
        copied
          ? "text-green-500"
          : "text-slate-400 hover:text-slate-700 hover:bg-slate-100",
      )}
      title={copied ? "Copied!" : "Copy code"}
    >
      {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
    </button>
  );
};

// ─── Add to Code button for code blocks ─────────────────────────────────────

const AddToCodeButton = ({
  code,
  onAddToCode,
}: {
  code: string;
  onAddToCode: (code: string) => void;
}) => {
  const [added, setAdded] = useState(false);
  return (
    <button
      onClick={() => {
        onAddToCode(code);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      className={cn(
        "p-1 rounded transition-colors",
        added
          ? "text-green-500"
          : "text-teal-500 hover:text-teal-700 hover:bg-teal-50",
      )}
      title={added ? "Added!" : "Use in code action"}
    >
      {added ? <IconCheck size={13} /> : <IconCodePlus size={13} />}
    </button>
  );
};

// ─── Streaming code loader (stable named component — never remounts on chunk updates) ──

const StreamingCodeLoader = () => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 not-prose my-1">
    <IconLoader2 size={11} className="animate-spin text-purple-500 shrink-0" />
    <span className="text-[11px] text-slate-500">Building...</span>
  </div>
);

// ─── Collapsible code block (white theme) ────────────────────────────────────

const CodeBlock = ({
  children,
  codeText,
  lang,
  onAddToCode,
}: {
  children: React.ReactNode;
  codeText: string;
  lang: string;
  onAddToCode?: (code: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded border border-slate-200 not-prose overflow-hidden my-1.5">
      <div className="flex items-center justify-between pl-2 pr-1 py-1 bg-white">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 min-w-0 text-left"
        >
          <IconCircleCheck size={11} className="text-green-500 shrink-0" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
            {lang || "code"}
          </span>
          <IconChevronDown
            size={10}
            className={cn(
              "text-slate-400 shrink-0 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
        {codeText && (
          <div className="flex items-center gap-0.5">
            {onAddToCode && (
              <AddToCodeButton code={codeText} onAddToCode={onAddToCode} />
            )}
            <CopyCodeButton code={codeText} />
          </div>
        )}
      </div>
      {open && (
        <pre className="bg-slate-900 text-slate-100 text-xs p-3 overflow-x-auto m-0 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </pre>
      )}
    </div>
  );
};

// ─── Markdown with copy-able code blocks ────────────────────────────────────

const MarkdownWithCopy = ({
  content,
  onAddToCode,
  isUser,
  isStreaming,
}: {
  content: string;
  onAddToCode?: (code: string) => void;
  isUser?: boolean;
  isStreaming?: boolean;
}) => {
  const proseClass = cn(
    "prose prose-sm max-w-none [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_li]:m-0 [&_:not(pre)>code]:text-xs [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded",
    isUser
      ? "prose-invert [&_:not(pre)>code]:text-purple-100 [&_:not(pre)>code]:bg-purple-400/30 [&_a]:text-purple-200 [&_strong]:text-white"
      : "prose-slate [&_:not(pre)>code]:text-purple-600 [&_:not(pre)>code]:bg-purple-50",
  );

  // When streaming and a code fence appears, render the loader outside react-markdown
  // so the component is never remounted on each chunk (fixes spinner glitch)
  if (isStreaming && content.includes("```")) {
    const fenceIndex = content.indexOf("```");
    const textBefore = content.slice(0, fenceIndex).trim();
    return (
      <div className={proseClass}>
        {textBefore && (
          <Markdown remarkPlugins={[remarkGfm]}>{textBefore}</Markdown>
        )}
        <StreamingCodeLoader />
      </div>
    );
  }

  return (
    <div className={proseClass}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }: React.HTMLAttributes<HTMLPreElement>) {
            let codeText = "";
            let lang = "";
            const codeChild = React.Children.toArray(children).find(
              (child): child is React.ReactElement =>
                React.isValidElement(child) && child.type === "code",
            );
            if (codeChild) {
              const codeProps = codeChild.props as {
                children?: React.ReactNode;
                className?: string;
              };
              if (codeProps.children) {
                codeText = String(codeProps.children).replace(/\n$/, "");
              }
              if (codeProps.className) {
                const match = codeProps.className.match(/language-(\w+)/);
                if (match) lang = match[1];
              }
            }

            return (
              <CodeBlock
                codeText={codeText}
                lang={lang}
                onAddToCode={onAddToCode}
              >
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

// ─── Settings Panel ─────────────────────────────────────────────────────────

const SettingsPanel = ({
  onConfigured,
  initialSettings,
}: {
  onConfigured: () => void;
  initialSettings: AiSettings;
}) => {
  const [provider, setProvider] = useState<AiProvider>(
    initialSettings.provider || "ollama",
  );
  // Ollama state
  const [ollamaUrl, setOllamaUrl] = useState(
    initialSettings.ollamaUrl || "http://localhost:11434",
  );
  const [ollamaModel, setOllamaModel] = useState(initialSettings.ollamaModel);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  // Gemini state
  const [geminiApiKey, setGeminiApiKey] = useState(
    initialSettings.geminiApiKey || "",
  );
  const [geminiModel, setGeminiModel] = useState(
    initialSettings.geminiModel || "gemini-2.0-flash",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFetchOllamaModels = async () => {
    setLoading(true);
    setError("");
    const fetched = await fetchOllamaModels(ollamaUrl);
    setLoading(false);
    if (fetched.length === 0) {
      setError(
        "Could not connect to Ollama or no models found. Make sure Ollama is running.",
      );
    } else {
      setOllamaModels(fetched);
      if (!ollamaModel && fetched.length > 0) setOllamaModel(fetched[0]);
    }
  };

  const handleValidateGemini = async () => {
    if (!geminiApiKey) {
      setError("Please enter your Gemini API key.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await validateGeminiApiKey(geminiApiKey, geminiModel);
    setLoading(false);
    if (!result.valid) {
      setError(result.error || "Invalid API key or model.");
    } else {
      handleSave();
    }
  };

  const handleSave = () => {
    if (provider === "ollama" && (!ollamaUrl || !ollamaModel)) {
      setError("Please set both Ollama URL and model.");
      return;
    }
    if (provider === "gemini" && (!geminiApiKey || !geminiModel)) {
      setError("Please set both API key and model.");
      return;
    }
    saveAiSettings({
      provider,
      ollamaUrl,
      ollamaModel,
      geminiApiKey,
      geminiModel,
    });
    setSuccess(true);
    setTimeout(() => onConfigured(), 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <IconSettings size={16} className="text-purple-500" />
        <span className="text-sm font-semibold text-slate-700">
          AI Provider Settings
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Choose a provider to power Ask AI.
      </p>

      {/* Provider tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => {
            setProvider("ollama");
            setError("");
            setSuccess(false);
          }}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
            provider === "ollama"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Ollama (Local)
        </button>
        <button
          onClick={() => {
            setProvider("gemini");
            setError("");
            setSuccess(false);
          }}
          className={cn(
            "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
            provider === "gemini"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          Google Gemini
        </button>
      </div>

      {/* Ollama settings */}
      {provider === "ollama" && (
        <>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Ollama URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => {
                  setOllamaUrl(e.target.value);
                  setError("");
                  setOllamaModels([]);
                }}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
              />
              <button
                onClick={handleFetchOllamaModels}
                disabled={!ollamaUrl || loading}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  loading
                    ? "bg-slate-100 text-slate-400"
                    : "bg-purple-500 hover:bg-purple-600 text-white",
                )}
              >
                {loading ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  "Connect"
                )}
              </button>
            </div>
          </div>

          {ollamaModels.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                Model
              </label>
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
              >
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {ollamaModels.length > 0 && (
            <button
              onClick={handleSave}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
                success
                  ? "bg-green-500 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white",
              )}
            >
              {success ? (
                <span className="flex items-center justify-center gap-1.5">
                  <IconCheck size={16} /> Saved
                </span>
              ) : (
                "Save & Start Chatting"
              )}
            </button>
          )}
        </>
      )}

      {/* Gemini settings */}
      {provider === "gemini" && (
        <>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              API Key
            </label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => {
                setGeminiApiKey(e.target.value);
                setError("");
              }}
              placeholder="Enter your Gemini API key"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
            <p className="text-[10px] text-slate-400">
              Get your API key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-600 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Model
            </label>
            <input
              list="gemini-model-list"
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              placeholder="e.g. gemini-2.0-flash"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300"
            />
            <datalist id="gemini-model-list">
              {getGeminiModelList().map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <button
            onClick={handleValidateGemini}
            disabled={!geminiApiKey || loading}
            className={cn(
              "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
              loading
                ? "bg-slate-100 text-slate-400"
                : success
                  ? "bg-green-500 text-white"
                  : "bg-purple-500 hover:bg-purple-600 text-white",
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <IconLoader2 size={14} className="animate-spin" /> Validating...
              </span>
            ) : success ? (
              <span className="flex items-center justify-center gap-1.5">
                <IconCheck size={16} /> Saved
              </span>
            ) : (
              "Validate & Save"
            )}
          </button>
        </>
      )}

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
          <IconAlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Overlay ───────────────────────────────────────────────────────────

export const AskAiOverlay = ({ open, onClose }: AskAiOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>(0);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Staged animation
  const [showGlow, setShowGlow] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Chat & settings state
  const [configured, setConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState<AiSettings>({
    provider: "ollama",
    ollamaUrl: "",
    ollamaModel: "",
    geminiApiKey: "",
    geminiModel: "gemini-2.0-flash",
  });

  // Mode: ask or code
  const [mode, setMode] = useState<AiMode>("ask");

  // Add to code: function picker
  const dispatch = useAppDispatch();
  const [functionPicker, setFunctionPicker] = useState<{
    code: string;
    visible: boolean;
  } | null>(null);

  // Build system prompts from project context
  const editorState = useAppSelector((s) => s.editor);
  const activePackage = useAppSelector(
    (s) => s.editor.packages.find((p) => p.id === s.editor.activePackageId)!,
  );

  const projectContext = useMemo(
    () => ({
      projectName: editorState.projectName,
      packageName: activePackage.name,
      variables: activePackage.variables,
      functions: activePackage.functions,
      runner: activePackage.runner,
      cdnPackages: activePackage.cdnPackages || [],
    }),
    [editorState.projectName, activePackage],
  );

  const systemPrompt = useMemo(() => {
    return mode === "ask"
      ? buildAskPrompt(projectContext)
      : buildCodePrompt(projectContext);
  }, [mode, projectContext]);

  // Check config on mount
  useEffect(() => {
    const s = getAiSettings();
    setSettings(s);
    setConfigured(isAiConfigured());
  }, []);

  // Scroll to bottom only if user hasn't scrolled up
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  const handleChatScroll = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    isUserScrolling.current = !atBottom;
  }, []);

  useEffect(() => {
    if (!isUserScrolling.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Animation
  useEffect(() => {
    if (open) {
      setVisible(true);
      const s = getAiSettings();
      setSettings(s);
      setConfigured(isAiConfigured());
      setShowSettings(!isAiConfigured());
      setStreamError("");
      const glowTimer = setTimeout(() => setShowGlow(true), 300);
      const contentTimer = setTimeout(() => {
        setShowContent(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 700);
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(contentTimer);
      };
    } else {
      setShowContent(false);
      const glowTimer = setTimeout(() => setShowGlow(false), 200);
      const unmountTimer = setTimeout(() => setVisible(false), 500);
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [open]);

  // Canvas glow
  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = (canvas.width = canvas.offsetWidth);
      const h = (canvas.height = canvas.offsetHeight);
      ctx.clearRect(0, 0, w, h);
      frameRef.current += 0.02;
      const frame = frameRef.current;

      const gradient = ctx.createConicGradient(
        frame % (Math.PI * 2),
        w / 2,
        h / 2,
      );
      gradient.addColorStop(0, "rgba(255, 100, 200, 0.8)");
      gradient.addColorStop(0.25, "rgba(150, 100, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(100, 200, 255, 0.8)");
      gradient.addColorStop(0.75, "rgba(100, 255, 200, 0.8)");
      gradient.addColorStop(1, "rgba(255, 100, 200, 0.8)");

      ctx.fillStyle = gradient;
      ctx.filter = "blur(50px)";
      ctx.fillRect(-50, -50, w + 100, h + 100);

      ctx.globalCompositeOperation = "destination-out";
      ctx.filter = "blur(16px)";
      ctx.fillStyle = "black";
      const m = 14;
      ctx.beginPath();
      ctx.roundRect(m, m, w - m * 2, h - m * 2, 20);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = "none";

      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [visible]);

  // Escape
  const onCloseStable = useCallback(() => onClose(), [onClose]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseStable();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCloseStable]);

  const handleSend = () => {
    if (!message.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: message.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setMessage("");
    setStreamError("");
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setChatMessages([...updatedMessages, assistantMsg]);

    // Filter out system messages for the API (system prompt is sent separately)
    const apiMessages = updatedMessages.filter((m) => m.role !== "system");

    streamChat(
      apiMessages,
      (chunk) => {
        setChatMessages((prev) => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last.role === "assistant") {
            msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          }
          return msgs;
        });
      },
      () => setStreaming(false),
      (error) => {
        setStreamError(error);
        setStreaming(false);
        setChatMessages((prev) => {
          const msgs = [...prev];
          if (
            msgs.length > 0 &&
            msgs[msgs.length - 1].role === "assistant" &&
            !msgs[msgs.length - 1].content
          ) {
            msgs.pop();
          }
          return msgs;
        });
      },
      systemPrompt,
    );
  };

  const handleEditorKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [message, streaming, chatMessages],
  );

  const handleConfigured = () => {
    const s = getAiSettings();
    setSettings(s);
    setConfigured(true);
    setShowSettings(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleModeSwitch = (newMode: AiMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setChatMessages([]);
      setStreamError("");
    }
  };

  // Add to code: replace the latest code action, or add one if none exists
  const dispatchAddCode = useCallback(
    (functionId: string, code: string) => {
      const func = activePackage.functions.find((f) => f.id === functionId);
      if (!func) return;
      // Find the last "code" action in the function
      const lastCodeAction = [...func.actions]
        .reverse()
        .find((a) => a.name === "code");
      if (lastCodeAction) {
        dispatch(
          updateFunctionAction({
            functionId,
            actionId: lastCodeAction.id,
            action: {
              id: lastCodeAction.id,
              name: "code",
              dataType: lastCodeAction.dataType || "string",
              codeName: lastCodeAction.codeName,
              value: [code],
            },
          }),
        );
      } else {
        dispatch(
          addFunctionAction({
            functionId,
            action: { id: "", name: "code", dataType: "string", value: [code] },
          }),
        );
      }
      setFunctionPicker(null);
    },
    [dispatch, activePackage.functions],
  );

  const handleAddToCode = useCallback(
    (code: string) => {
      const functions = activePackage.functions;
      if (functions.length === 0) return;
      if (functions.length === 1) {
        dispatchAddCode(functions[0].id, code);
      } else {
        setFunctionPicker({ code, visible: true });
      }
    },
    [activePackage.functions, dispatchAddCode],
  );

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-end",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500",
          showGlow ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Chat box */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl mx-auto mb-12 px-4",
          "transition-all duration-500 ease-out",
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        )}
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          {showSettings ? (
            <div className="p-4">
              {configured && (
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3 transition-colors"
                >
                  <IconArrowLeft size={12} />
                  Back to chat
                </button>
              )}
              <SettingsPanel
                onConfigured={handleConfigured}
                initialSettings={settings}
              />
            </div>
          ) : (
            <>
              {/* Mode tabs + expand toggle */}
              <div className="flex items-center gap-1 px-4 pt-3">
                <button
                  onClick={() => handleModeSwitch("ask")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mode === "ask"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <IconMessageCircle size={14} />
                  Ask
                </button>
                <button
                  onClick={() => handleModeSwitch("code")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    mode === "code"
                      ? "bg-teal-100 text-teal-700 border border-teal-200"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <IconCode size={14} />
                  Code
                </button>
                <div className="ml-auto">
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title={expanded ? "Collapse" : "Expand"}
                  >
                    {expanded ? (
                      <IconArrowsMinimize size={14} />
                    ) : (
                      <IconArrowsMaximize size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* Function picker for Add to Code */}
              {functionPicker?.visible && (
                <div className="mx-3 mt-2 p-2.5 rounded-lg bg-teal-50 border border-teal-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-teal-700">
                      Choose a function to add the code to:
                    </span>
                    <button
                      onClick={() => setFunctionPicker(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePackage.functions.map((fn) => (
                      <button
                        key={fn.id}
                        onClick={() =>
                          dispatchAddCode(fn.id, functionPicker.code)
                        }
                        className="px-3 py-1.5 rounded-md bg-white border border-teal-200 text-xs font-mono text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors"
                      >
                        {fn.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {chatMessages.length > 0 && (
                <div
                  ref={chatScrollRef}
                  onScroll={handleChatScroll}
                  className={cn(
                    "overflow-y-auto p-3 space-y-3 transition-all duration-300",
                    expanded ? "h-[70vh]" : "max-h-64",
                  )}
                >
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex",
                        msg.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm",
                          msg.role === "user"
                            ? "max-w-[80%] rounded-xl px-3 py-2 bg-purple-500 text-white"
                            : "w-full text-slate-800",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          msg.content ? (
                            <MarkdownWithCopy
                              content={msg.content}
                              onAddToCode={
                                mode === "code" ? handleAddToCode : undefined
                              }
                              isStreaming={
                                streaming && i === chatMessages.length - 1
                              }
                            />
                          ) : (
                            <IconLoader2
                              size={14}
                              className="animate-spin text-slate-400"
                            />
                          )
                        ) : (
                          <MarkdownWithCopy
                            content={msg.content.replace(/\n/g, "  \n")}
                            isUser
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Error */}
              {streamError && (
                <div className="mx-3 mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                  <IconAlertCircle
                    size={14}
                    className="text-red-500 shrink-0 mt-0.5"
                  />
                  <p className="text-xs text-red-600">{streamError}</p>
                </div>
              )}

              {/* Input */}
              <div className="flex items-start gap-3 p-4">
                <IconSparkles
                  size={18}
                  className="text-purple-500 shrink-0 mt-1.5"
                />
                <div
                  ref={inputRef}
                  className="flex-1 min-w-0"
                  data-color-mode="light"
                  onKeyDown={handleEditorKeyDown}
                >
                  <MDEditor
                    value={message}
                    onChange={(val) => setMessage(val || "")}
                    preview="edit"
                    hideToolbar
                    height={Math.max(
                      60,
                      Math.min(100, message.split("\n").length * 24 + 36),
                    )}
                    textareaProps={{
                      placeholder:
                        mode === "ask"
                          ? "Ask about the playground system..."
                          : "Describe the code you want to generate...",
                      disabled: streaming,
                    }}
                    className="!border-none !shadow-none [&_.w-md-editor-text-pre>code]:!text-sm [&_.w-md-editor-text-input]:!text-sm [&_.w-md-editor-text]:!min-h-[40px] transform -translate-y-[5px]"
                  />
                </div>
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => {
                      setChatMessages([]);
                      setStreamError("");
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Clear chat"
                  >
                    <IconTrash size={16} />
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Settings"
                >
                  <IconSettings size={16} />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || streaming}
                  className={cn(
                    "p-2 rounded-xl transition-all duration-200",
                    message.trim() && !streaming
                      ? "bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed",
                  )}
                >
                  {streaming ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconSend size={16} />
                  )}
                </button>
              </div>

              {/* Model indicator */}
              {configured && (
                <div className="px-4 pb-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {getActiveModelName()} ·{" "}
                    {settings.provider === "gemini" ? "Gemini" : "Ollama"} ·{" "}
                    {mode === "ask" ? "Ask mode" : "Code mode"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-3">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] border border-slate-200">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>
    </div>
  );
};
