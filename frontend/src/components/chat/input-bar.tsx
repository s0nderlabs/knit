"use client";

import { useRef, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/workspace-context";
import { ModuleTag } from "@/components/modules/module-tag";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

export function InputBar({ value, onChange, onSend, isStreaming }: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedModules, removeModule } = useWorkspace();

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-border bg-surface px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">
      {/* Selected module tags */}
      {selectedModules.length > 0 && (
        <div className="hide-scrollbar mb-2 flex items-center gap-1.5 overflow-x-auto">
          {selectedModules.map((mod) => (
            <ModuleTag
              key={mod.id}
              name={mod.name}
              category={mod.category}
              onRemove={() => removeModule(mod.id)}
              compact
            />
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your smart contract..."
          rows={1}
          disabled={isStreaming}
          className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-tertiary disabled:opacity-50"
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isStreaming}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo text-white transition-all hover:bg-indigo-hover disabled:opacity-30"
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
  );
}
