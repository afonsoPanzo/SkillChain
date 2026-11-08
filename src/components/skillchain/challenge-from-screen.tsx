"use client";

import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { challengerLabel } from "@/lib/blink/challenge";
import { isProfileAddress } from "@/lib/skillchain/address";
import { enterDemo } from "@/lib/skillchain/demo";
import { useProfile, useRun } from "@/lib/skillchain/hooks";
import { invalidateData } from "@/lib/skillchain/store";
import { useAccount } from "@/lib/skillchain/use-account";
import { useDemo } from "@/lib/skillchain/use-demo";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { formatDuration, type RunResult } from "@/lib/speedrun/run";
import { ChallengeButton } from "./challenge-button";
import { ConnectButton } from "./connect-button";
import { DuelScreen } from "./duel-screen";

/** The sentence of the challenge, also used by the Blink card. */
function useChallengeText(run: RunResult, who: string): string {
  const { t } = useT();
  if (run.status === "finished" && run.durationSeconds !== null) {
    return t("challenge.run.finished", { who, time: formatDuration(run.durationSeconds) });
  }
  if (run.status === "running") return t("challenge.run.running", { who, level: run.level });
  return t("challenge.run.none", { who });
}

function Headline({ run, who }: { run: RunResult; who: string }) {
  const text = useChallengeText(run, who);
  return (
    <h1 className="m-0 text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance">
      {text}
    </h1>
  );
}

/** /challenge/[from]: the challenger's time and a way to accept. */
export function ChallengeFromScreen({ from, name }: { from: string; name: string | null }) {
  const { t } = useT();
  const demo = useDemo();
  const valid = isProfileAddress(from, demo);
  const { run, error } = useRun(valid ? from : null);
  const { connected, owner } = useAccount();
  const restoring = useWalletRestoring();
  const mine = useProfile();

  if (!valid) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-2 py-12 text-center">
        <div className="text-2xl font-extrabold">{t("challenge.invalid")}</div>
        <Link href="/" className="btn btn-primary px-6">
          {t("challenge.cta")}
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-2 py-12 text-center">
        <p className="m-0 text-[15px] text-coral-t">{t("challenge.run.error")}</p>
        <button type="button" onClick={invalidateData} className="btn btn-primary px-6">
          {t("pub.retry")}
        </button>
      </div>
    );
  }
  if (!run) return <p className="m-0 pt-6 text-[15px] text-muted">{t("challenge.run.loading")}</p>;

  const who = challengerLabel(from, name) ?? from;
  const isOwnChallenge = connected && owner === from;

  let action: React.ReactNode;
  if (restoring) {
    action = <p className="m-0 text-[15px] text-muted">{t("challenge.connecting")}</p>;
  } else if (!connected) {
    action = (
      <div className="flex flex-col gap-3">
        <ConnectButton />
        <button
          type="button"
          onClick={enterDemo}
          className="btn h-[54px] rounded-2xl border border-line bg-surface text-base font-bold text-fg hover:border-lime"
        >
          {t("demo.try")}
        </button>
      </div>
    );
  } else if (isOwnChallenge) {
    action = (
      <div className="flex flex-col gap-3">
        <p className="m-0 text-[15px] text-fg-3">{t("challenge.own")}</p>
        <ChallengeButton address={from} />
      </div>
    );
  } else if (mine.isLoading) {
    action = <p className="m-0 text-[15px] text-muted">{t("common.loadingProfile")}</p>;
  } else if (!mine.profile) {
    action = (
      <Link href="/learn/1" className="btn btn-primary">
        {t("challenge.start")}
      </Link>
    );
  } else {
    action = null; // the duel below
  }

  return (
    <div className="flex flex-col gap-5 pt-3">
      <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
        {t("challenge.kicker")}
      </div>
      <Headline run={run} who={who} />
      {action}
      {connected && !isOwnChallenge && mine.profile && owner && !restoring && (
        <DuelScreen from={from} to={owner} embedded />
      )}
    </div>
  );
}
