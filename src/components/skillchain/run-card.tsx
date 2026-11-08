"use client";

import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { explorerTxUrl, shortAddress } from "@/lib/skillchain/format";
import { useAccount } from "@/lib/skillchain/use-account";
import { formatDuration, type RunResult } from "@/lib/speedrun/run";
import { ProfileAvatar } from "./avatar";
import { DemoExplorerNote } from "./demo-explorer-note";

function TxLink({ label, signature }: { label: string; signature: string | null }) {
  const { t } = useT();
  if (!signature) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs text-muted">{label}</div>
      <a
        href={explorerTxUrl(signature)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-[13px] font-bold"
      >
        {shortAddress(signature)} ↗
      </a>
      <span className="sr-only">{t("common.viewExplorer")}</span>
    </div>
  );
}

/** One player in a duel: avatar, level, time (or "in progress") and the transactions that prove it. */
export function RunCard({
  run,
  me,
  winner,
}: {
  run: RunResult;
  me: boolean;
  winner: boolean;
}) {
  const { t } = useT();
  const { isDemo } = useAccount();

  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border p-3.5 text-center ${
        winner ? "border-lime bg-lime/7" : "border-line bg-surface"
      }`}
    >
      <div className="size-[88px]">
        {run.profile ? (
          <ProfileAvatar profile={run.profile} />
        ) : (
          <div className="size-full rounded-[22px] border border-dashed border-line" />
        )}
      </div>
      <Link href={`/u/${run.owner}`} className="font-mono text-[13px] font-bold">
        {shortAddress(run.owner)}
      </Link>
      {me && <div className="text-xs font-bold text-lime">{t("duel.you")}</div>}

      {run.status === "none" && (
        <div className="text-[15px] text-muted">{t("duel.notStarted")}</div>
      )}
      {run.status === "running" && (
        <>
          <div className="text-[22px] font-extrabold text-violet">{t("duel.inProgress")}</div>
          <div className="text-[13px] text-muted">{t("duel.level", { n: run.level })}</div>
        </>
      )}
      {run.status === "finished" && (
        <div className="text-[28px] leading-tight font-extrabold text-lime">
          {run.durationSeconds !== null ? formatDuration(run.durationSeconds) : "—"}
        </div>
      )}

      {run.status !== "none" && (
        <div className="flex w-full flex-col gap-2 border-t border-line pt-2.5 text-left">
          {isDemo ? (
            <DemoExplorerNote kind="tx" />
          ) : (
            <>
              <TxLink label={t("duel.startTx")} signature={run.startSignature} />
              <TxLink label={t("duel.endTx")} signature={run.endSignature} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
