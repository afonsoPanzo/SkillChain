"use client";

import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter";
import {
  CATEGORY_LABEL,
  ITEMS,
  ITEMS_TOTAL_PRICE,
  NONE,
  TOTAL_POINTS,
  hasItem,
  type ItemDef,
} from "@/lib/skillchain/constants";
import { useProfile, useSkillChain } from "@/lib/skillchain/hooks";
import type { Profile } from "@/lib/skillchain/types";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { Avatar } from "./avatar";
import { ConnectButton } from "./connect-button";
import { TxStatus } from "./tx-status";

type ItemStatus = "noprofile" | "owned" | "level" | "points" | "available";

function statusOf(item: ItemDef, profile: Profile | null): ItemStatus {
  if (!profile) return "noprofile";
  if (hasItem(profile.items, item.id)) return "owned";
  if (profile.level < item.minLevel) return "level";
  if (profile.points < item.price) return "points";
  return "available";
}

function labelOf(item: ItemDef, status: ItemStatus, profile: Profile | null): string {
  switch (status) {
    case "noprofile":
      return "Conclui o nível 1";
    case "owned":
      return "Comprado";
    case "level":
      return `Requer nível ${item.minLevel}`;
    case "points":
      return `Faltam ${item.price - (profile?.points ?? 0)} pts`;
    default:
      return `Comprar · ${item.price}`;
  }
}

export function ShopScreen() {
  const { connected } = useWallet();
  const restoring = useWalletRestoring();
  const { owner, profile, isLoading } = useProfile();
  const sc = useSkillChain();
  const [buyingId, setBuyingId] = useState<number | null>(null);

  if (restoring) return <p className="m-0 pt-6 text-[15px] text-muted">A ligar a carteira…</p>;

  if (!connected || !owner) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">Loja</h2>
        <p className="m-0 text-[15px] text-muted">Liga a carteira para ver a loja.</p>
        <ConnectButton />
      </div>
    );
  }

  async function buy(item: ItemDef) {
    setBuyingId(item.id);
    await sc.buyItem(item.id);
    setBuyingId(null);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">Loja</div>
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">
          Tens <span className="text-lime">{profile?.points ?? 0}</span> pontos
        </h2>
        <div className="text-[15px] leading-snug text-muted">
          Podes ganhar {TOTAL_POINTS} no total. Os itens custam {ITEMS_TOTAL_PRICE}. Escolhe bem.
        </div>
      </div>

      {isLoading && <p className="m-0 text-[15px] text-muted">A ler o teu perfil…</p>}

      <div className="grid grid-cols-2 gap-3">
        {ITEMS.map((item) => {
          const status = statusOf(item, profile);
          const owned = status === "owned";
          const available = status === "available";
          const isBusy = sc.busy && buyingId === item.id;
          const pct = owned ? 100 : profile ? Math.min(100, (profile.points / item.price) * 100) : 0;
          return (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-[18px] border-[1.5px] bg-surface p-3 ${
                owned ? "border-lime" : available ? "border-violet" : "border-line"
              }`}
            >
              <div className="flex aspect-square items-center justify-center rounded-xl bg-ink p-3.5">
                {item.category === "title" ? (
                  <div className="rounded-full border-[1.5px] border-violet px-3 py-1.5 text-center text-[15px] font-bold text-violet">
                    {item.name}
                  </div>
                ) : (
                  <div className="size-full">
                    <Avatar
                      address={owner}
                      frame={item.category === "frame" ? item.id : NONE}
                      goggles={item.id === 2}
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-[3px] px-0.5">
                <div className="text-base leading-[1.2] font-bold">{item.name}</div>
                <div className="text-[13px] text-muted">
                  {CATEGORY_LABEL[item.category]} · Nv {item.minLevel}
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-ink">
                <div
                  className={`h-full rounded-[3px] ${owned || available ? "bg-lime" : "bg-violet"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <button
                type="button"
                disabled={!available || sc.busy}
                onClick={() => void buy(item)}
                className={`h-11 rounded-xl text-sm font-extrabold ${
                  available
                    ? "bg-lime text-ink shadow-[0_4px_0_var(--color-lime-d)] active:translate-y-1 active:shadow-none disabled:opacity-60"
                    : `bg-surface-2 shadow-[0_4px_0_var(--color-press)] ${owned ? "text-lime" : "text-muted"}`
                }`}
              >
                {isBusy
                  ? sc.state.status === "confirming"
                    ? "A confirmar…"
                    : "A assinar…"
                  : labelOf(item, status, profile)}
              </button>
            </div>
          );
        })}
      </div>

      {!profile && !isLoading && (
        <Link href="/learn/1" className="btn btn-primary">
          Começar o nível 1
        </Link>
      )}

      <TxStatus state={sc.state} />
    </>
  );
}
