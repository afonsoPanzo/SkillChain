"use client";

import type { PropsWithChildren } from "react";
import { LangSync } from "@/i18n/use-t";
import { DemoSync } from "@/lib/skillchain/use-demo";
import { SolanaProvider } from "./solana-provider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <SolanaProvider>
      <LangSync />
      <DemoSync />
      {children}
    </SolanaProvider>
  );
}
