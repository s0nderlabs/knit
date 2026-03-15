"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { ModuleTag } from "@/components/modules/module-tag";
import { AnimatePresence, motion } from "framer-motion";

const placeholders = [
  "I want a token that...",
  "Build me an NFT with...",
  "Create a governance contract...",
  "Make a cross-chain bridge...",
];

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

export function InputBar({ value, onChange, onSend, isStreaming }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModules, removeModule } = useWorkspace();
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  // Rotate placeholder only when visible
  const showAnimatedPlaceholder = !isFocused && !value;
  useEffect(() => {
    if (!showAnimatedPlaceholder) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [showAnimatedPlaceholder]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {/* Selected module tags */}
        {selectedModules.length > 0 && (
          <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto border-b border-border-light px-3 pt-2 pb-1">
            {selectedModules.map((mod) => (
              <ModuleTag
                key={mod.id}
                name={mod.name}
                displayName={mod.displayName}
                category={mod.category}
                onRemove={() => removeModule(mod.id)}
                compact
              />
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder=""
              rows={1}
              disabled={isStreaming}
              className="max-h-40 min-h-[36px] w-full resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-tertiary disabled:opacity-50"
            />
            <AnimatePresence mode="wait">
              {showAnimatedPlaceholder && (
                <motion.span
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="pointer-events-none absolute left-0 top-0 flex h-[36px] items-center text-sm text-ink-tertiary font-[family-name:var(--font-body)]"
                >
                  {placeholders[placeholderIndex]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onSend}
            disabled={!value.trim() || isStreaming}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all hover:bg-ink/85 disabled:opacity-30"
            aria-label="Send message"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
