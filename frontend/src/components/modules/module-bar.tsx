"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/contexts/workspace-context";
import { getModulesByCategory } from "@/lib/modules/catalog";
import { ModuleTag } from "@/components/modules/module-tag";
import { WalletButton } from "@/components/wallet-button";
import type { Module } from "@/lib/modules/catalog";

const sections = [
  { key: "oz" as const, label: "Building Blocks" },
  { key: "polkadot" as const, label: "Polkadot" },
] as const;

export function ModuleBar() {
  const [open, setOpen] = useState(false);
  const { addModule, removeModule, selectedModules } = useWorkspace();

  const selectedIds = new Set(selectedModules.map((m) => m.id));

  return (
    <div className="relative z-40 flex shrink-0">
      {/* Collapsed strip */}
      <div className="flex h-full w-11 flex-col items-center border-r border-border/40">
        {/* Logo at top */}
        <div className="flex h-11 w-11 items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-[15px] tracking-tight text-ink">
            K
          </span>
        </div>

        <div className="h-px w-6 bg-border/40" />

        {/* Module toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-accent-light hover:text-ink-secondary"
          aria-label="Toggle modules"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>

        {selectedModules.length > 0 && (
          <span className="mt-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
            {selectedModules.length}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Wallet at bottom */}
        <div className="mb-3 flex flex-col items-center">
          <WalletButton compact />
        </div>
      </div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[39]"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute left-11 top-0 z-40 h-full overflow-hidden border-r border-border/40 bg-white shadow-[4px_0_16px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-full w-[260px] flex-col">
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                  <span className="text-sm font-semibold text-ink">Modules</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-md p-1 text-ink-tertiary transition-colors hover:text-ink"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {selectedModules.length > 0 && (
                  <div className="border-b border-border/40 px-4 py-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      Selected
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {sections.map((section) => {
                    const modules = getModulesByCategory(section.key);
                    return (
                      <div key={section.key} className="mb-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                          {section.label}
                        </p>
                        <div className="space-y-0.5">
                          {modules.map((mod) => (
                            <SidebarItem
                              key={mod.id}
                              module={mod}
                              selected={selectedIds.has(mod.id)}
                              onToggle={() => {
                                if (selectedIds.has(mod.id)) removeModule(mod.id);
                                else addModule(mod);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({
  module,
  selected,
  onToggle,
}: {
  module: Module;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={module.description}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-all ${
        selected
          ? "bg-ink text-white"
          : "text-ink-secondary hover:bg-accent-light hover:text-ink"
      }`}
    >
      <span className="font-medium">{module.displayName || module.name}</span>
      <span className="text-[10px] opacity-50">
        {module.category === "polkadot" ? "Polkadot" : "OZ"}
      </span>
    </button>
  );
}
