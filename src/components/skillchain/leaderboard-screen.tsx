"use client";

import { useWallet } from "@solana/wallet-adapter";
import { getItem } from "@/lib/skillchain/constants";
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
  const hasTitle = profile.equippedTitle === TITLE_ITEM;
  return (
    <div
      className={`grid grid-cols-[28px_40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] border py-2.5 pr-3.5 pl-2.5 ${
        me ? "border-lime bg-lime/7" : "border-line bg-surface"
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
          {me ? "Tu" : hasTitle ? (getItem(TITLE_ITEM)?.name ?? "—") : "—"}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <div className="text-[15px] font-bold">Nv {profile.level}</div>
        <div className="font-mono text-xs text-muted">{profile.totalEarned} pts</div>
      </div>
    </div>
  );
}

export function LeaderboardScreen() {
  const { connected } = useWallet();
  const restoring = useWalletRestoring();
  const { owner } = useProfile();
  const { all, top, isLoading, error } = useLeaderboard();

  const myIndex = owner ? all.findIndex((p) => p.owner === owner) : -1;
  const rival = getRival(all, owner);
  const meOutsideTop = myIndex >= top.length;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Ranking</div>
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">Top jogadores</h2>
        <div className="text-[15px] text-muted">
          Lido directamente dos perfis on-chain. Nível primeiro, depois total ganho.
        </div>
      </div>

      {restoring ? (
        <p className="m-0 text-[15px] text-muted">A ligar a carteira…</p>
      ) : (
        connected && rival && <RivalCard rival={rival} />
      )}

      {!connected && !restoring && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
          <p className="m-0 text-[15px] text-fg-3">
            Liga a carteira para te veres no ranking.
          </p>
          <ConnectButton />
        </div>
      )}

      {isLoading && <p className="m-0 text-[15px] text-muted">A ler os perfis on-chain…</p>}
      {error && (
        <p className="m-0 text-[15px] text-coral-t">
          Não foi possível ler o ranking. Verifica a ligação à Devnet e tenta outra vez.
        </p>
      )}
      {!isLoading && !error && all.length === 0 && (
        <p className="m-0 text-[15px] text-muted">Ainda não há jogadores. Sê o primeiro!</p>
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
