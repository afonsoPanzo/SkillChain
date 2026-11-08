"use client";

import { useWallet } from "@solana/wallet-adapter";
import type { PublicKey } from "@solana/web3.js";
import { DEMO_OWNER } from "./demo";
import { useDemo } from "./use-demo";

/**
 * The player the app is acting for: the connected wallet, or the simulated
 * player in demo mode. A real wallet always wins over demo mode.
 */
export function useAccount(): {
  connected: boolean;
  isDemo: boolean;
  owner: string | null;
  /** Null in demo mode: there is no real account to query. */
  publicKey: PublicKey | null;
  sendTransaction: ReturnType<typeof useWallet>["sendTransaction"];
} {
  const wallet = useWallet();
  const demo = useDemo();
  const isDemo = demo && !wallet.connected;
  if (isDemo) {
    return {
      connected: true,
      isDemo: true,
      owner: DEMO_OWNER,
      publicKey: null,
      sendTransaction: wallet.sendTransaction,
    };
  }
  return {
    connected: wallet.connected,
    isDemo: false,
    owner: wallet.publicKey?.toBase58() ?? null,
    publicKey: wallet.publicKey,
    sendTransaction: wallet.sendTransaction,
  };
}
