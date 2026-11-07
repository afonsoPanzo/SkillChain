"use client";

import type { ReactNode } from "react";
import {
  ConnectionProvider,
  WalletModalProvider,
  WalletProvider,
  type WalletError,
} from "@solana/wallet-adapter";

import { DEVNET_RPC } from "@/lib/skillchain/rpc";

function onWalletError(error: WalletError) {
  console.error(error);
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  return (
    <ConnectionProvider endpoint={DEVNET_RPC}>
      <WalletProvider chain="solana:devnet" onError={onWalletError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
