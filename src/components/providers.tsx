"use client";

import type { PropsWithChildren } from "react";
import { LangSync } from "@/i18n/use-t";
import { SolanaProvider } from "./solana-provider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <SolanaProvider>
      <LangSync />
      {children}
    </SolanaProvider>
  );
}
