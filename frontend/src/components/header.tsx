"use client";

import { WalletButton } from "./wallet-button";

export function Header() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <nav className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/40 bg-white/70 px-5 py-2 shadow-[0_1px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <span className="font-[family-name:var(--font-display)] text-[17px] tracking-tight text-ink">
          Knit
        </span>
        <div className="h-4 w-px bg-border" />
        <WalletButton />
      </nav>
    </div>
  );
}
