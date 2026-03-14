"use client";

import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-5 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <KnitLogo />
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          Knit
        </span>
      </div>

      {/* Wallet */}
      <WalletButton />
    </header>
  );
}

function KnitLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Thread knot — two interlocking loops */}
      <path
        d="M7 5C4.5 5 3 7 3 9.5S4.5 14 7 14c1.8 0 3.2-1 4-2.3"
        stroke="#4F46E5"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M17 10c2.5 0 4 2 4 4.5S19.5 19 17 19c-1.8 0-3.2-1-4-2.3"
        stroke="#4F46E5"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Cross thread */}
      <path
        d="M11 11.7c.5-.8 1.2-1.5 2-1.7 1.2-.3 2.2.3 2.8 1.2"
        stroke="#111111"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 12.3c-.5.8-1.2 1.5-2 1.7-1.2.3-2.2-.3-2.8-1.2"
        stroke="#111111"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
