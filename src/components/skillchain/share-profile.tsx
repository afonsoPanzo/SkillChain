"use client";

import { useState } from "react";
import { useT } from "@/i18n/use-t";

/** Public link of a profile, on the site the player is using. */
function profileUrl(address: string): string {
  return `${window.location.origin}/u/${address}`;
}

/** Copy the public profile link, or post it on X. The tweet text is in English. */
export function ShareProfile({ address, level }: { address: string; level: number }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(profileUrl(address));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the X button still works.
    }
  }

  function shareOnX() {
    const text = `I'm level ${level} on SkillChain, learning Solana by playing. Verify it on-chain:`;
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl(address))}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  const secondary =
    "h-12 flex-1 cursor-pointer rounded-xl border border-line bg-surface text-[15px] font-bold text-fg hover:border-lime";

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-2">
        <button type="button" onClick={() => void copy()} className={secondary}>
          {copied ? t("share.copied") : t("share.copy")}
        </button>
        <button type="button" onClick={shareOnX} className={secondary}>
          {t("share.x")}
        </button>
      </div>
      <div className="text-[13px] text-muted">{t("share.hint")}</div>
    </div>
  );
}
