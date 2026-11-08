"use client";

import { useT } from "@/i18n/use-t";
import { isProfileAddress } from "@/lib/skillchain/address";
import { shortAddress } from "@/lib/skillchain/format";
import { useRun } from "@/lib/skillchain/hooks";
import { invalidateData } from "@/lib/skillchain/store";
import { useAccount } from "@/lib/skillchain/use-account";
import { useDemo } from "@/lib/skillchain/use-demo";
import { duelWinner } from "@/lib/speedrun/run";
import { RunCard } from "./run-card";

/** Two players side by side: who finishes the 3 levels faster, with proof on Solana Explorer. */
export function DuelScreen({ from, to, embedded = false }: { from: string; to: string; embedded?: boolean }) {
  const { t } = useT();
  const demo = useDemo();
  const { owner } = useAccount();
  const valid = isProfileAddress(from, demo) && isProfileAddress(to, demo) && from !== to;
  const first = useRun(valid ? from : null);
  const second = useRun(valid ? to : null);

  if (!valid) {
    return <p className="m-0 pt-6 text-[15px] text-muted">{t("duel.same")}</p>;
  }
  if (first.error || second.error) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-2 py-8 text-center">
        <p className="m-0 text-[15px] text-coral-t">{t("challenge.run.error")}</p>
        <button type="button" onClick={invalidateData} className="btn btn-primary px-6">
          {t("pub.retry")}
        </button>
      </div>
    );
  }
  if (!first.run || !second.run) {
    return <p className="m-0 pt-6 text-[15px] text-muted">{t("challenge.run.loading")}</p>;
  }

  const winner = duelWinner(first.run, second.run);
  const winnerAddress = winner === "first" ? from : winner === "second" ? to : null;

  return (
    <>
      {!embedded && (
        <div className="flex flex-col gap-1.5">
          <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
            {t("duel.kicker")}
          </div>
          <h1 className="m-0 text-[30px] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance">
            {t("duel.title")}
          </h1>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <RunCard run={first.run} me={from === owner} winner={winner === "first"} />
        <RunCard run={second.run} me={to === owner} winner={winner === "second"} />
      </div>

      <div role="status" className="rounded-2xl border border-line bg-surface p-4 text-center">
        {winner === "tie" ? (
          <div className="text-xl font-extrabold text-lime">{t("duel.tie")}</div>
        ) : winnerAddress ? (
          <div className="text-xl font-extrabold text-lime">
            {t("duel.wins", {
              who: `${shortAddress(winnerAddress)}${winnerAddress === owner ? ` ${t("duel.you")}` : ""}`,
            })}
          </div>
        ) : (
          <div className="text-[15px] text-muted">{t("duel.pending")}</div>
        )}
      </div>

      <p className="m-0 text-[13px] leading-snug text-muted">{t("duel.method")}</p>
    </>
  );
}
