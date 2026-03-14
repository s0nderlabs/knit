"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";

export function WalletButton() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <button
        disabled
        className="rounded-lg bg-ink/50 px-4 py-1.5 text-sm font-medium text-surface"
      >
        Connect
      </button>
    );
  }

  return <PrivyWalletInner />;
}

function PrivyWalletInner() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { login } = useLogin();

  const address = user?.wallet?.address || user?.smartWallet?.address;
  const truncated = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  if (ready && authenticated && truncated) {
    return (
      <button
        onClick={() => logout()}
        className="flex items-center gap-2 rounded-lg border border-border bg-base px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-indigo-soft hover:text-ink"
      >
        <span className="h-2 w-2 rounded-full bg-success" />
        {truncated}
      </button>
    );
  }

  return (
    <button
      onClick={() => login()}
      disabled={!ready}
      className="rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-surface transition-all hover:bg-ink/90 disabled:opacity-40"
    >
      Connect
    </button>
  );
}
