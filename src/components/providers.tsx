"use client";

import type { PropsWithChildren } from "react";
import { SolanaProvider } from "./solana-provider";

export function Providers({ children }: PropsWithChildren) {
  return <SolanaProvider>{children}</SolanaProvider>;
}
