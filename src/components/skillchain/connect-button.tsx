"use client";

import { useWalletModal } from "@solana/wallet-adapter";

export function ConnectButton({ className = "" }: { className?: string }) {
  const { setVisible } = useWalletModal();
  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className={`btn btn-primary ${className}`}
    >
      Ligar carteira
    </button>
  );
}
