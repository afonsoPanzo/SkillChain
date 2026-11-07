"use client";

import { useWalletModal } from "@solana/wallet-adapter";
import { useT } from "@/i18n/use-t";

export function ConnectButton({ className = "" }: { className?: string }) {
  const { setVisible } = useWalletModal();
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className={`btn btn-primary ${className}`}
    >
      {t("common.connect")}
    </button>
  );
}
