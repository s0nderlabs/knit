"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useWorkspace } from "@/contexts/workspace-context";

export function DeployReceipt() {
  const { deployResult } = useWorkspace();
  const [copied, setCopied] = useState<string | null>(null);

  if (!deployResult) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-success/20 bg-success-light p-5"
    >
      {/* Success header */}
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-success"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 8l3 3 5-6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-ink">Deployed successfully</p>
          <p className="text-xs text-ink-secondary">
            {deployResult.target.toUpperCase()} on{" "}
            {deployResult.chainId === 420420417
              ? "Polkadot Hub Testnet"
              : "Polkadot Hub"}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2.5">
        <ReceiptRow
          label="Contract"
          value={deployResult.contractAddress}
          onCopy={() =>
            copyToClipboard(deployResult.contractAddress, "address")
          }
          copied={copied === "address"}
          mono
        />
        <ReceiptRow
          label="Tx Hash"
          value={deployResult.txHash}
          onCopy={() => copyToClipboard(deployResult.txHash, "tx")}
          copied={copied === "tx"}
          mono
        />
        {deployResult.registryTxHash && (
          <ReceiptRow
            label="Registry"
            value={deployResult.registryTxHash}
            onCopy={() =>
              copyToClipboard(deployResult.registryTxHash!, "registry")
            }
            copied={copied === "registry"}
            mono
          />
        )}
      </div>

      {/* Explorer link */}
      <a
        href={deployResult.explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-indigo transition-colors hover:text-indigo-hover"
      >
        View on Blockscout
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M4 8l4-4M4 4h4v4"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>

      {/* Modules used */}
      {deployResult.modules.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {deployResult.modules.map((mod) => (
            <span
              key={mod}
              className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-secondary"
            >
              {mod}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReceiptRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  const truncated = value.length > 20
    ? `${value.slice(0, 10)}...${value.slice(-8)}`
    : value;

  return (
    <div className="flex items-center justify-between rounded-md bg-surface/80 px-3 py-2">
      <span className="text-xs text-ink-tertiary">{label}</span>
      <button
        onClick={onCopy}
        className={`flex items-center gap-1.5 text-xs transition-colors hover:text-ink ${
          mono ? "font-mono" : ""
        } ${copied ? "text-success" : "text-ink-secondary"}`}
      >
        {copied ? "Copied!" : truncated}
        {!copied && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="4"
              y="4"
              width="6"
              height="6"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.1"
            />
            <path
              d="M8 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v4a1 1 0 001 1h1"
              stroke="currentColor"
              strokeWidth="1.1"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
