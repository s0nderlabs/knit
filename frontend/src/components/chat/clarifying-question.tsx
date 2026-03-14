"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ClarifyingQuestionProps {
  question: string;
  options: string[];
  onConfirm: (selected: string) => void;
}

export function ClarifyingQuestion({
  question,
  options,
  onConfirm,
}: ClarifyingQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-indigo-soft bg-indigo-light/40 p-4"
    >
      <p className="mb-3 text-sm font-medium text-ink">{question}</p>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
              selected === option
                ? "border-indigo bg-surface text-ink shadow-sm"
                : "border-border bg-surface/60 text-ink-secondary hover:border-indigo-soft hover:bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  selected === option
                    ? "border-indigo"
                    : "border-border"
                }`}
              >
                {selected === option && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-indigo"
                  />
                )}
              </div>
              {option}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => selected && onConfirm(selected)}
        disabled={!selected}
        className="mt-3 w-full rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-hover disabled:opacity-40"
      >
        Confirm
      </button>
    </motion.div>
  );
}
