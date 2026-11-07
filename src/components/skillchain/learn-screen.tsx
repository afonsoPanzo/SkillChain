"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { TOTAL_LEVELS, TOTAL_POINTS } from "@/lib/skillchain/constants";
import { useProfile } from "@/lib/skillchain/hooks";
import { LESSONS, getLevelPoints } from "@/lib/skillchain/lessons";
import { getNextReward } from "@/lib/skillchain/rewards";
import { ConnectButton } from "./connect-button";

type Status = "done" | "available" | "locked";

const STATUS_LABEL: Record<Status, string> = {
  done: "Concluído",
  available: "Jogar",
  locked: "Bloqueado",
};

const CARD_STYLE: Record<Status, string> = {
  available: "border-lime shadow-[0_4px_0_var(--color-lime-d)]",
  done: "border-line shadow-[0_4px_0_var(--color-press)]",
  locked: "border-line shadow-[0_4px_0_var(--color-press)]",
};

const NUMBER_STYLE: Record<Status, string> = {
  available: "bg-lime text-ink",
  done: "bg-surface-2 text-lime",
  locked: "bg-ink text-dim",
};

const CHIP_STYLE: Record<Status, string> = {
  available: "bg-lime text-ink",
  done: "bg-surface-2 text-muted",
  locked: "bg-transparent text-muted",
};

export function LearnScreen() {
  const { connected } = useWallet();
  const { profile, isLoading } = useProfile();
  const restoring = useWalletRestoring();

  if (restoring) {
    return <p className="m-0 pt-6 text-[15px] text-muted">A ligar a carteira…</p>;
  }

  if (!connected) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">Aprende Solana</h2>
        <p className="m-0 text-[15px] text-muted">Liga a carteira para começar o percurso.</p>
        <ConnectButton />
      </div>
    );
  }

  const level = profile?.level ?? 0;
  const reward = profile ? getNextReward(profile) : null;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Percurso</div>
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">Aprende Solana</h2>
        <div className="text-[15px] text-muted">
          {isLoading
            ? "A ler o teu perfil…"
            : `${level} de ${TOTAL_LEVELS} níveis concluídos · ${profile?.totalEarned ?? 0} de ${TOTAL_POINTS} pontos`}
        </div>
      </div>

      <div className="flex flex-col">
        {LESSONS.map((lesson, i) => {
          const status: Status =
            level >= lesson.level ? "done" : level === lesson.level - 1 ? "available" : "locked";
          const locked = status === "locked";
          const card = (
            <div
              className={`flex w-full items-center gap-3.5 rounded-[18px] border-[1.5px] bg-surface p-4 text-left ${CARD_STYLE[status]} ${
                locked ? "cursor-not-allowed" : "cursor-pointer active:translate-y-[3px]"
              }`}
            >
              <div
                className={`flex size-[52px] flex-none items-center justify-center rounded-[14px] text-2xl font-extrabold ${NUMBER_STYLE[status]}`}
              >
                {lesson.level}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={`text-[19px] font-bold ${locked ? "text-muted" : "text-fg"}`}>
                  {lesson.title}
                </div>
                <div className="text-[13px] leading-snug text-muted">{lesson.topics}</div>
              </div>
              <div className="flex flex-none flex-col items-end gap-1.5">
                <div
                  className={`font-mono text-[13px] font-semibold ${locked ? "text-dim" : "text-lime"}`}
                >
                  +{getLevelPoints(lesson.level)}
                </div>
                <div
                  className={`rounded-full px-2 py-[3px] text-[11px] font-bold tracking-[0.04em] uppercase ${CHIP_STYLE[status]}`}
                >
                  {STATUS_LABEL[status]}
                </div>
              </div>
            </div>
          );
          return (
            <div key={lesson.level} className="flex flex-col">
              {locked ? (
                card
              ) : (
                <Link
                  href={`/learn/${lesson.level}`}
                  className="text-fg hover:text-fg hover:no-underline"
                >
                  {card}
                </Link>
              )}
              {i < LESSONS.length - 1 && (
                <div
                  className={`ml-[42px] h-5 w-0.5 ${level >= lesson.level ? "bg-lime" : "bg-line"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {reward && (
        <Link
          href="/shop"
          className="flex flex-col gap-2.5 rounded-[18px] border border-line bg-surface p-4 text-fg hover:border-lime hover:text-fg hover:no-underline"
        >
          <div className="flex items-baseline justify-between gap-2.5">
            <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
              Próxima recompensa
            </div>
            <div className="font-mono text-[13px] text-muted">{reward.count}</div>
          </div>
          <div className="text-[17px] font-bold">{reward.text}</div>
          <div className="h-2.5 overflow-hidden rounded-[5px] bg-ink">
            <div
              className="h-full rounded-[5px] bg-violet transition-[width] duration-[600ms] ease-out"
              style={{ width: `${reward.percent}%` }}
            />
          </div>
        </Link>
      )}
    </>
  );
}
