"use client";

import { motion } from "framer-motion";

interface PlanModule {
  name: string;
  description: string;
  type?: string;
}

export interface PlanDisplayProps {
  contractName: string;
  modules: PlanModule[];
  description?: string;
  onBuild?: () => void;
  onEdit?: () => void;
  onStartOver?: () => void;
}

export function PlanDisplay({
  contractName,
  modules,
  description,
  onBuild,
  onEdit,
  onStartOver,
}: PlanDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-surface p-5"
    >
      {/* Contract name */}
      <div className="mb-1 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo" />
        <h3 className="text-sm font-semibold text-ink">{contractName}</h3>
      </div>
      {description && (
        <p className="mb-4 ml-4 text-xs text-ink-secondary">{description}</p>
      )}

      {/* Module tree with thread lines */}
      <div className="relative ml-1 border-l border-dashed border-indigo-soft pl-5 mt-3">
        {modules.map((mod, i) => (
          <motion.div
            key={mod.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`relative ${i < modules.length - 1 ? "pb-3" : ""}`}
          >
            {/* Horizontal connector */}
            <div className="absolute -left-5 top-[9px] h-[1px] w-4 border-t border-dashed border-indigo-soft" />
            {/* Node dot */}
            <div className="absolute -left-[22.5px] top-[5px] h-2 w-2 rounded-full border-2 border-indigo-soft bg-surface" />

            <p className="text-sm font-medium text-ink">{mod.name}</p>
            <p className="text-xs text-ink-tertiary">{mod.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onBuild}
          className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-hover"
        >
          Build
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-base hover:text-ink"
        >
          Edit
        </button>
        <button
          onClick={onStartOver}
          className="rounded-lg px-4 py-2 text-sm font-medium text-error/80 transition-colors hover:bg-error-light hover:text-error"
        >
          Start over
        </button>
      </div>
    </motion.div>
  );
}
