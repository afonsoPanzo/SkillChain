"use client";

import { useWalletModal } from "@solana/wallet-adapter";
import { useT } from "@/i18n/use-t";
import { exitDemo } from "@/lib/skillchain/demo";
import { useAccount } from "@/lib/skillchain/use-account";

/** Fixed strip shown for as long as demo mode is on. */
export function DemoBanner() {
  const { isDemo } = useAccount();
  const { setVisible } = useWalletModal();
  const { t } = useT();
  if (!isDemo) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-coral px-4 py-2 text-ink"
    >
      <span className="text-[13px] leading-snug font-bold">{t("demo.banner")}</span>
      <button
        type="button"
        onClick={() => {
          exitDemo();
          setVisible(true);
        }}
        className="cursor-pointer rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-fg hover:text-lime"
      >
        {t("demo.useReal")}
      </button>
    </div>
  );
}
