"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";

export function WalletButton() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return (
      <button
        disabled
        className="rounded-lg bg-accent-light px-3.5 py-1.5 text-[13px] font-medium text-ink-tertiary"
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
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-ink-secondary transition-colors hover:border-ink/20 hover:text-ink"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        {truncated}
      </button>
    );
  }

  return (
    <button
      onClick={() => login()}
      disabled={!ready}
      className="rounded-lg bg-ink px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-ink/85 disabled:opacity-40"
    >
      Connect
    </button>
  );
}
