"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ClarifyingQuestionProps {
  question: string;
  options: string[];
  onConfirm: (selected: string) => void;
  disabled?: boolean;
}

export function ClarifyingQuestion({
  question,
  options,
  onConfirm,
  disabled,
}: ClarifyingQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  // Already answered — show compact state
  if (disabled || answered) {
    return (
      <div className="rounded-xl border border-border/50 bg-accent-light/50 px-4 py-3">
        <p className="text-xs text-ink-tertiary">{question}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-border bg-surface p-4"
    >
      <p className="mb-3 text-sm font-medium text-ink font-[family-name:var(--font-display)]">{question}</p>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`w-full rounded-xl p-3 text-left text-sm transition-all ${
              selected === option
                ? "bg-ink text-white"
                : "border border-border hover:border-ink/20 hover:bg-accent-light"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{option}</span>
              {selected === option && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          if (selected) {
            setAnswered(true);
            onConfirm(selected);
          }
        }}
        disabled={!selected}
        className="mt-3 w-full rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-40"
      >
        Continue
      </button>
    </motion.div>
  );
}
