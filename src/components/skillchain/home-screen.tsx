"use client";

import Link from "next/link";
import { useAccount } from "@/lib/skillchain/use-account";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { FAUCET_URL, TOTAL_LEVELS, TOTAL_POINTS } from "@/lib/skillchain/constants";
import { useT } from "@/i18n/use-t";
import { enterDemo } from "@/lib/skillchain/demo";
import { ConnectButton } from "./connect-button";

const LOOP = [
  { n: "01", title: "home.loop.1.title", sub: "home.loop.1.sub" },
  { n: "02", title: "home.loop.2.title", sub: "home.loop.2.sub" },
  { n: "03", title: "home.loop.3.title", sub: "home.loop.3.sub" },
] as const;

export function HomeScreen() {
  const { connected } = useAccount();
  const restoring = useWalletRestoring();
  const { t } = useT();

  return (
    <div className="flex flex-col gap-7 pt-5">
      <div className="flex flex-col gap-4">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          {t("home.kicker", { levels: TOTAL_LEVELS, points: TOTAL_POINTS })}
        </div>
        <h1 className="m-0 text-[46px] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance">
          {t("home.heroA")} <span className="text-lime">{t("home.heroB")}</span>
        </h1>
        <p className="m-0 text-[17px] leading-normal text-fg-3 text-pretty">
          {t("home.sub")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LOOP.map((step) => (
          <div
            key={step.n}
            className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-3.5"
          >
            <div className="font-mono text-xs text-lime">{step.n}</div>
            <div className="text-[15px] font-bold">{t(step.title)}</div>
            <div className="text-[13px] leading-snug text-muted">{t(step.sub)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        {restoring ? (
          <div className="btn btn-primary opacity-60">{t("common.connecting")}</div>
        ) : connected ? (
          <Link href="/learn" className="btn btn-primary">
            {t("home.start")}
          </Link>
        ) : (
          <>
            <ConnectButton />
            <button
              type="button"
              onClick={enterDemo}
              className="btn h-[54px] rounded-2xl border border-line bg-surface text-base font-bold text-fg hover:border-lime"
            >
              {t("demo.try")}
            </button>
          </>
        )}
        <div className="text-center text-sm text-muted">
          {t("home.faucetPre")}{" "}
          <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
            {t("home.faucetLink")}
          </a>
        </div>
      </div>
    </div>
  );
}
