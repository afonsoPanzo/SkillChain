"use client";

import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { useEffect, useState } from "react";
import { TOTAL_LEVELS } from "@/lib/skillchain/constants";
import { explorerAddressUrl, shortAddress } from "@/lib/skillchain/format";
import { getAccountAddress } from "@/lib/skillchain/pda";
import { useAccount } from "@/lib/skillchain/use-account";
import { DemoExplorerNote } from "./demo-explorer-note";
import { TutorCard } from "./tutor-card";

interface LevelDoneProps {
  level: number;
  title: string;
  points: number;
  owner: string;
  onReview: () => void;
}

/** Shown on entering a level that is already completed on-chain. */
export function LevelDone({ level, title, points, owner, onReview }: LevelDoneProps) {
  const { t } = useT();
  const { isDemo } = useAccount();
  const [profileAddress, setProfileAddress] = useState<string | null>(null);
  const [noteAddress, setNoteAddress] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getAccountAddress("profile", owner).then((a) => active && setProfileAddress(a));
    getAccountAddress("note", owner).then((a) => active && setNoteAddress(a));
    return () => {
      active = false;
    };
  }, [owner]);

  const isLast = level >= TOTAL_LEVELS;
  const accounts = [
    profileAddress && { label: t("level.done.profileAccount"), address: profileAddress },
    level === 3 && noteAddress && { label: t("level.done.noteAccount"), address: noteAddress },
  ].filter((a): a is { label: string; address: string } => Boolean(a));

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/learn" className="py-2 text-[15px] text-muted hover:text-fg hover:no-underline">
          {t("common.map")}
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-4 text-center">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          {t("level.done.kicker", { n: level, title })}
        </div>
        <div className="text-[34px] leading-none font-extrabold tracking-[-0.03em] text-lime">
          {t("level.done.title")}
        </div>
        <div className="text-lg">
          <b className="font-mono text-lime">+{points}</b> {t("level.done.points")}
        </div>

        <div className="mt-2 flex w-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-left">
          <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
            {t("level.done.proof")}
          </div>
          {isDemo ? (
            <DemoExplorerNote kind="accounts" />
          ) : accounts.length === 0 ? (
            <p className="m-0 text-[13px] text-coral-t">
              {t("level.done.mock")}
            </p>
          ) : (
            accounts.map(({ label, address }) => (
              <div key={label} className="flex flex-col gap-1">
                <div className="text-[13px] text-muted">{label}</div>
                <div className="font-mono text-[13px]">{shortAddress(address)}</div>
                <a
                  href={explorerAddressUrl(address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-bold"
                >
                  {t("common.viewExplorer")}
                </a>
              </div>
            ))
          )}
        </div>

        <TutorCard owner={owner} level={level} />
      </div>
      <div className="flex flex-col gap-3">
        <Link href={isLast ? "/shop" : `/learn/${level + 1}`} className="btn btn-primary">
          {isLast ? t("level.done.shop") : t("level.done.next")}
        </Link>
        <button
          type="button"
          className="btn h-[58px] rounded-2xl border border-line bg-surface text-base font-bold text-fg shadow-[0_5px_0_var(--color-press)]"
          onClick={onReview}
        >
          {t("level.done.review")}
        </button>
      </div>
    </>
  );
}
