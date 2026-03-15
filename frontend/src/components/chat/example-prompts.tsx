"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

const examples = [
  {
    label: "ERC-20 Fungible Token",
    prompt:
      "Create an ERC-20 token with minting restricted to the owner, burnable by any holder, and pausable transfers for emergencies.",
  },
  {
    label: "ERC-721 NFT Collection",
    prompt:
      "Build an NFT collection with EIP-2981 royalties, a delayed reveal mechanism, and a max supply cap.",
  },
  {
    label: "DAO Governance",
    prompt:
      "Create a DAO governance system with an ERC-20 voting token, Governor contract with proposal threshold, and a timelock controller.",
  },
  {
    label: "XCM Cross-Chain Bridge",
    prompt:
      "Build a cross-chain token bridge that uses the XCM precompile to send tokens from Polkadot Hub to a parachain.",
  },
];

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
  inputBar: ReactNode;
}

export function ExamplePrompts({ onSelect, inputBar }: ExamplePromptsProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center"
      >
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(32px,5vw,52px)] leading-[1.1] tracking-tight text-ink">
          The better way to
          <br />
          build smart contracts
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-secondary font-[family-name:var(--font-body)]">
          Describe what you need in plain English. Knit assembles audited
          modules into deployable Solidity.
        </p>
      </motion.div>

      {/* Centered input bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.1,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="mt-8 w-full max-w-2xl"
      >
        {inputBar}
      </motion.div>

      {/* Template chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="mt-4 flex flex-wrap items-center justify-center gap-2"
      >
        {examples.map((ex) => (
          <button
            key={ex.label}
            onClick={() => onSelect(ex.prompt)}
            className="rounded-full border border-border/70 px-3 py-1.5 text-[12px] font-medium text-ink-tertiary transition-all hover:border-ink/20 hover:text-ink-secondary"
          >
            {ex.label}
          </button>
        ))}
      </motion.div>

      {/* Trust line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-8 text-[11px] text-ink-tertiary font-[family-name:var(--font-body)]"
      >
        Powered by OpenZeppelin &middot; Deploys to Polkadot Hub &middot;
        Audited modules only
      </motion.p>
    </div>
  );
}
