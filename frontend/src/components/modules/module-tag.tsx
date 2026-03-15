"use client";

import type { ModuleCategory } from "@/lib/modules/catalog";

const categoryStyles: Record<
  ModuleCategory,
  { bg: string; text: string; border: string; dot: string }
> = {
  oz: {
    bg: "bg-accent-light",
    text: "text-ink",
    border: "border-border",
    dot: "bg-ink",
  },
  polkadot: {
    bg: "bg-[#FDF2F8]",
    text: "text-[#BE185D]",
    border: "border-[#F9A8D4]/60",
    dot: "bg-pink-500",
  },
  imported: {
    bg: "bg-success-light",
    text: "text-emerald-700",
    border: "border-emerald-200/60",
    dot: "bg-success",
  },
};

interface ModuleTagProps {
  name: string;
  displayName?: string;
  category: ModuleCategory;
  onRemove?: () => void;
  compact?: boolean;
}

export function ModuleTag({ name, displayName, category, onRemove, compact }: ModuleTagProps) {
  const label = displayName || name;
  const style = categoryStyles[category];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${style.border} ${style.bg} ${compact ? "px-1.5 py-0.5" : "px-2 py-0.5"} text-xs font-medium ${style.text} transition-colors`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label={`Remove ${label}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 3l4 4M7 3l-4 4"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
