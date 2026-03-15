"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/contexts/workspace-context";
import { polkadotHubTestnet, polkadotHubMainnet } from "@/lib/chains";

const chains = [
  { id: polkadotHubTestnet.id, name: "Testnet", dot: "bg-warning" },
  { id: polkadotHubMainnet.id, name: "Mainnet", dot: "bg-success" },
];

export function ChainSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selectedChainId, setSelectedChainId, compileTarget, setCompileTarget } =
    useWorkspace();

  const current = chains.find((c) => c.id === selectedChainId) || chains[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Chain dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-md border border-border bg-base px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:border-accent-soft hover:text-ink"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
          {current.name}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 4l2 2 2-2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 z-20 mt-1 min-w-[140px] rounded-xl border border-border bg-surface py-1 shadow-lg"
            >
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    setSelectedChainId(chain.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                    chain.id === selectedChainId
                      ? "bg-accent-light text-ink font-medium"
                      : "text-ink-secondary hover:bg-base hover:text-ink"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${chain.dot}`} />
                  {chain.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* EVM / PVM toggle */}
      <div className="flex rounded-md border border-border bg-base">
        {(["evm", "pvm"] as const).map((target) => (
          <button
            key={target}
            onClick={() => setCompileTarget(target)}
            className={`px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              compileTarget === target
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-tertiary hover:text-ink-secondary"
            } ${target === "evm" ? "rounded-l-[5px]" : "rounded-r-[5px]"}`}
          >
            {target}
          </button>
        ))}
      </div>
    </div>
  );
}
