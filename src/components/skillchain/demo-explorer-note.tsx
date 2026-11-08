"use client";

import { useT } from "@/i18n/use-t";

/** Replaces the Explorer link in demo mode, where nothing exists on-chain. */
export function DemoExplorerNote({ kind }: { kind: "tx" | "accounts" }) {
  const { t } = useT();
  return (
    <p className="m-0 text-[13px] leading-snug text-coral-t">
      {kind === "tx" ? t("demo.noteTx") : t("demo.noteAccounts")}
    </p>
  );
}
