"use client";

import { motion } from "framer-motion";

const examples = [
  {
    title: "Fungible Token",
    description: "ERC-20 with minting, burning, and pausable transfers",
    prompt:
      "Create an ERC-20 token with minting restricted to the owner, burnable by any holder, and pausable transfers for emergencies.",
  },
  {
    title: "NFT Collection",
    description: "ERC-721 with royalties and reveal mechanics",
    prompt:
      "Build an NFT collection with EIP-2981 royalties, a delayed reveal mechanism, and a max supply cap.",
  },
  {
    title: "DAO Governance",
    description: "Governor with timelock and voting token",
    prompt:
      "Create a DAO governance system with an ERC-20 voting token, Governor contract with proposal threshold, and a timelock controller.",
  },
  {
    title: "Cross-Chain Bridge",
    description: "XCM-powered token bridge to parachains",
    prompt:
      "Build a cross-chain token bridge that uses the XCM precompile to send tokens from Polkadot Hub to a parachain.",
  },
];

interface ExamplePromptsProps {
  onSelect: (prompt: string) => void;
}

export function ExamplePrompts({ onSelect }: ExamplePromptsProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-8 text-center"
      >
        <h2 className="mb-1.5 text-xl font-semibold tracking-tight text-ink">
          What do you want to build?
        </h2>
        <p className="text-sm text-ink-secondary">
          Describe your contract or pick a starting point
        </p>
      </motion.div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {examples.map((ex, i) => (
          <motion.button
            key={ex.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.1 + i * 0.06,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={() => onSelect(ex.prompt)}
            className="group relative rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-indigo-soft hover:shadow-sm"
          >
            {/* Thread accent line */}
            <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-border transition-colors group-hover:bg-indigo" />

            <p className="pl-3 text-sm font-medium text-ink">{ex.title}</p>
            <p className="mt-1 pl-3 text-xs leading-relaxed text-ink-secondary">
              {ex.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
