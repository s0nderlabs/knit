"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/contexts/workspace-context";
import { getModulesByCategory } from "@/lib/modules/catalog";
import type { Module } from "@/lib/modules/catalog";

const sections = [
  { key: "oz" as const, label: "OpenZeppelin" },
  { key: "polkadot" as const, label: "Polkadot" },
] as const;

export function ModuleBar() {
  const [expanded, setExpanded] = useState(false);
  const { addModule, selectedModules } = useWorkspace();

  const selectedIds = new Set(selectedModules.map((m) => m.id));

  return (
    <div className="border-b border-border bg-surface">
      {/* Collapsed: single row */}
      <div className="flex items-center gap-3 px-5 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary transition-colors hover:text-ink"
        >
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <path
              d="M4.5 2.5l3.5 3.5-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
          Modules
        </button>

        {/* Quick pills when collapsed */}
        {!expanded && (
          <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto">
            {sections.map((section) => {
              const modules = getModulesByCategory(section.key);
              return modules.slice(0, 3).map((mod) => (
                <ModulePill
                  key={mod.id}
                  module={mod}
                  selected={selectedIds.has(mod.id)}
                  onAdd={() => addModule(mod)}
                />
              ));
            })}
            <span className="ml-1 text-[10px] text-ink-tertiary">
              +{" "}
              {getModulesByCategory("oz").length +
                getModulesByCategory("polkadot").length -
                6}{" "}
              more
            </span>
          </div>
        )}
      </div>

      {/* Expanded: full catalog */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-5 pb-3">
              {sections.map((section) => {
                const modules = getModulesByCategory(section.key);
                return (
                  <div key={section.key}>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      {section.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((mod) => (
                        <ModulePill
                          key={mod.id}
                          module={mod}
                          selected={selectedIds.has(mod.id)}
                          onAdd={() => addModule(mod)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModulePill({
  module,
  selected,
  onAdd,
}: {
  module: Module;
  selected: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      onClick={onAdd}
      disabled={selected}
      title={module.description}
      className={`rounded-md border px-2 py-1 text-xs font-medium transition-all ${
        selected
          ? "border-indigo-soft bg-indigo-light text-indigo cursor-default"
          : "border-border-light bg-base text-ink-secondary hover:border-indigo-soft hover:bg-indigo-light hover:text-indigo"
      }`}
    >
      {module.name}
    </button>
  );
}
