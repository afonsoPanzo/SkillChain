"use client";

import { useWallet } from "@solana/wallet-adapter";
import { useDemo } from "./use-demo";

/**
 * True while the wallet adapter is restoring a previous session after a page
 * reload (status "pending", "reconnecting" or "connecting"). Screens should wait
 * instead of showing "connect your wallet", which looks like a disconnect.
 */
export function useWalletRestoring(): boolean {
  const { connected, status } = useWallet();
  const demo = useDemo();
  return (
    !demo &&
    !connected &&
    (status === "pending" || status === "reconnecting" || status === "connecting")
  );
}
