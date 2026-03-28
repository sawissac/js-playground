"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { IconSend, IconSparkles } from "@tabler/icons-react";

interface AskAiOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const AskAiOverlay = ({ open, onClose }: AskAiOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const animationRef = useRef<number>(0);
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Staged animation states
  const [showGlow, setShowGlow] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Handle open/close with staged animation
  useEffect(() => {
    if (open) {
      setVisible(true);
      // Stage 1: wait 300ms, then show glow
      const glowTimer = setTimeout(() => setShowGlow(true), 300);
      // Stage 2: after glow appears (300ms + 400ms), show chat
      const contentTimer = setTimeout(() => {
        setShowContent(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 700);
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(contentTimer);
      };
    } else {
      // Reverse: hide content first, then glow, then unmount
      setShowContent(false);
      const glowTimer = setTimeout(() => setShowGlow(false), 200);
      const unmountTimer = setTimeout(() => setVisible(false), 500);
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [open]);

  // Canvas glow animation
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
        h / 2
      );

      // Apple-inspired palette: Pink, Purple, Blue, Teal
      gradient.addColorStop(0, "rgba(255, 100, 200, 0.8)");
      gradient.addColorStop(0.25, "rgba(150, 100, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(100, 200, 255, 0.8)");
      gradient.addColorStop(0.75, "rgba(100, 255, 200, 0.8)");
      gradient.addColorStop(1, "rgba(255, 100, 200, 0.8)");

      ctx.fillStyle = gradient;
      ctx.filter = "blur(50px)";
      ctx.fillRect(-50, -50, w + 100, h + 100);

      // Erase center — keep glow only at edges (Apple Siri style)
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

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [visible]);

  // Close on Escape
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
    if (!message.trim()) return;
    // Placeholder: handle AI message send here
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-end",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Transparent backdrop (click to close) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Canvas glow animation — fades in */}
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500",
          showGlow ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Chat box — pops up from bottom after glow */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl mx-auto mb-12 px-4",
          "transition-all duration-500 ease-out",
          showContent
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        )}
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <IconSparkles size={18} className="text-purple-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to generate actions, fix bugs, or explain code..."
              className="flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                message.trim()
                  ? "bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/25"
                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
              )}
            >
              <IconSend size={16} />
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {[
              "Generate a string formatter function",
              "Add array sorting actions",
              "Explain this function",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setMessage(suggestion)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors border border-slate-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-3">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] border border-slate-200">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
};
