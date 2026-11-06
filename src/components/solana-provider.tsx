"use client";

import type { ReactNode } from "react";
import {
  ConnectionProvider,
  WalletModalProvider,
  WalletProvider,
  type WalletError,
} from "@solana/wallet-adapter";

/** SkillChain runs on Devnet only. */
const DEVNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

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
