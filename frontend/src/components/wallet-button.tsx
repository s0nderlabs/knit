"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";

interface WalletButtonProps {
  compact?: boolean;
}

export function WalletButton({ compact }: WalletButtonProps) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return compact ? (
      <button
        disabled
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-light text-ink-tertiary"
        title="Connect wallet"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="3.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M3.5 3.5V2.5a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="9.5" cy="7.5" r="1" fill="currentColor" />
        </svg>
      </button>
    ) : (
      <button
        disabled
        className="rounded-lg bg-accent-light px-3.5 py-1.5 text-[13px] font-medium text-ink-tertiary"
      >
        Connect
      </button>
    );
  }

  return <PrivyWalletInner compact={compact} />;
}

function PrivyWalletInner({ compact }: { compact?: boolean }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login } = useLogin();

  const address = user?.wallet?.address || user?.smartWallet?.address;
  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  if (ready && authenticated && truncated) {
    return compact ? (
      <button
        onClick={() => logout()}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-accent-light"
        title={truncated}
      >
        <span className="h-2 w-2 rounded-full bg-success" />
      </button>
    ) : (
      <button
        onClick={() => logout()}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-ink/20 hover:text-ink"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {truncated}
      </button>
    );
  }

  return compact ? (
    <button
      onClick={() => login()}
      disabled={!ready}
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white transition-all hover:bg-ink/85 disabled:opacity-40"
      title="Connect wallet"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="3.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M3.5 3.5V2.5a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="9.5" cy="7.5" r="1" fill="currentColor" />
      </svg>
    </button>
  ) : (
    <button
      onClick={() => login()}
      disabled={!ready}
      className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-ink/85 disabled:opacity-40"
    >
      Connect
    </button>
  );
}
