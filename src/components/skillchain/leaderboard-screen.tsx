"use client";

import { useAccount } from "@/lib/skillchain/use-account";
import Link from "next/link";
import { itemKey } from "@/i18n/translate";
import { useT } from "@/i18n/use-t";
import { shortAddress } from "@/lib/skillchain/format";
import { useLeaderboard, useProfile } from "@/lib/skillchain/hooks";
import { getRival } from "@/lib/skillchain/rival";
import type { Profile } from "@/lib/skillchain/types";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { ProfileAvatar } from "./avatar";
import { ConnectButton } from "./connect-button";
import { RivalCard } from "./rival-card";

const TITLE_ITEM = 3;

function Row({ profile, position, me }: { profile: Profile; position: number; me: boolean }) {
  const { t } = useT();
  const hasTitle = profile.equippedTitle === TITLE_ITEM;
  return (
    <Link
      href={`/u/${profile.owner}`}
      className={`grid grid-cols-[28px_40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border py-2.5 pr-3.5 pl-2.5 text-fg hover:no-underline ${
        me ? "border-lime bg-lime/7" : "border-line bg-surface hover:border-lime"
      }`}
    >
      <div
        className={`text-center font-mono text-sm font-semibold ${
          position <= 3 ? "text-lime" : "text-muted"
        }`}
      >
        {position}
      </div>
      <div className="size-10">
        <ProfileAvatar profile={profile} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="font-mono text-[13px]">{shortAddress(profile.owner)}</div>
        <div className="text-xs text-muted">
          {me ? t("board.you") : hasTitle ? t(itemKey(TITLE_ITEM)) : "—"}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="text-[15px] font-bold">{t("board.level", { n: profile.level })}</div>
        <div className="font-mono text-xs text-muted">{t("board.pts", { n: profile.totalEarned })}</div>
      </div>
    </Link>
  );
}

export function LeaderboardScreen() {
  const { connected } = useAccount();
  const restoring = useWalletRestoring();
  const { t } = useT();
  const { owner } = useProfile();
  const { all, top, isLoading, error } = useLeaderboard();

  const myIndex = owner ? all.findIndex((p) => p.owner === owner) : -1;
  const rival = getRival(all, owner, t);
  const meOutsideTop = myIndex >= top.length;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">{t("board.kicker")}</div>
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">{t("board.title")}</h2>
        <div className="text-[15px] text-muted">
          {t("board.sub")}
        </div>
      </div>

      {restoring ? (
        <p className="m-0 text-[15px] text-muted">{t("common.connecting")}</p>
      ) : (
        connected && rival && <RivalCard rival={rival} />
      )}

      {!connected && !restoring && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <p className="m-0 text-[15px] text-fg-3">
            {t("board.connectPrompt")}
          </p>
          <ConnectButton />
        </div>
      )}

      {isLoading && <p className="m-0 text-[15px] text-muted">{t("board.loading")}</p>}
      {error && (
        <p className="m-0 text-[15px] text-coral-t">
          {t("board.error")}
        </p>
      )}
      {!isLoading && !error && all.length === 0 && (
        <p className="m-0 text-[15px] text-muted">{t("board.empty")}</p>
      )}

      <div className="flex flex-col gap-1.5">
        {top.map((profile, i) => (
          <Row key={profile.owner} profile={profile} position={i + 1} me={profile.owner === owner} />
        ))}
        {meOutsideTop && (
          <>
            <div className="py-1 text-center text-muted">⋮</div>
            <Row profile={all[myIndex]} position={myIndex + 1} me />
          </>
        )}
      </div>
    </>
  );
}
