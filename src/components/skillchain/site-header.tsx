"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter";
import { useAccount } from "@/lib/skillchain/use-account";
import { setLang } from "@/i18n/lang";
import { useT } from "@/i18n/use-t";
import { USE_MOCK } from "@/lib/skillchain/backend";
import { useProfile } from "@/lib/skillchain/hooks";
import { ProfileAvatar } from "./avatar";

/** Language switch: shows the language you will get, like the original design. */
function LanguageToggle() {
  const { t, lang } = useT();
  const next = lang === "en" ? "pt" : "en";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t("lang.switchAria")}
      lang={next}
      className="h-[34px] min-w-[38px] cursor-pointer rounded-[10px] border border-line bg-surface px-2 font-mono text-xs font-semibold text-fg uppercase hover:border-lime"
    >
      {next}
    </button>
  );
}

export function SiteHeader() {
  const { connected, isDemo } = useAccount();
  const { profile } = useProfile();
  const { t } = useT();

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-2 border-b border-divider bg-ink/90 px-4 py-3 backdrop-blur-[10px]">
      <Link
        href="/"
        className="flex items-center gap-2 text-fg hover:no-underline"
        aria-label={t("header.homeAria")}
      >
        <span className="text-[19px] font-extrabold tracking-[-0.02em]">
          Skill
          <span className="bg-linear-to-r from-sol-purple to-lime bg-clip-text text-transparent">
            Chain
          </span>
        </span>
        <span className="rounded-full border border-violet-b px-[7px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.06em] text-violet uppercase">
          Devnet
        </span>
        {USE_MOCK && (
          <span
            className="rounded-full border border-coral-d px-[7px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.06em] text-coral-t uppercase"
            title={t("header.mockTitle")}
          >
            Mock
          </span>
        )}
      </Link>
      <div className="flex items-center gap-2">
        {connected && profile && (
          <span className="font-mono text-[13px] font-semibold text-lime">
            {t("header.points", { n: profile.points })}
          </span>
        )}
        {connected && profile && (
          <Link href="/profile" className="block size-[34px]" aria-label={t("header.profileAria")}>
            <ProfileAvatar profile={profile} />
          </Link>
        )}
        <LanguageToggle />
        {connected && !isDemo && <WalletMultiButton />}
      </div>
    </header>
  );
}
