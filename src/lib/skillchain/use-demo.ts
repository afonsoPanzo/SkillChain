"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useWallet } from "@solana/wallet-adapter";
import { exitDemo } from "./demo";
import { isDemoActive, subscribeDemo } from "./demo-flag";

/** True while demo mode is on. Always false during server rendering. */
export function useDemo(): boolean {
  return useSyncExternalStore(subscribeDemo, isDemoActive, () => false);
}

/**
 * Demo and real mode never mix: as soon as a real wallet connects, demo mode
 * ends and the simulated data is cleared. Render once, in the providers.
 */
export function DemoSync() {
  const { connected } = useWallet();
  const demo = useDemo();
  useEffect(() => {
    if (demo && connected) exitDemo();
  }, [demo, connected]);
  return null;
}
