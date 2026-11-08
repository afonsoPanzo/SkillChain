"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "@/lib/skillchain/use-account";
import { itemKey } from "@/i18n/translate";
import { useT } from "@/i18n/use-t";
import {
  ITEMS,
  ITEM_CATEGORY,
  NONE,
  TOTAL_LEVELS,
  getItem,
  hasItem,
  type ItemDef,
} from "@/lib/skillchain/constants";
import { shortAddress } from "@/lib/skillchain/format";
import { useNote, useProfile, useSkillChain } from "@/lib/skillchain/hooks";
import type { Profile } from "@/lib/skillchain/types";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { ProfileAvatar } from "./avatar";
import { ConnectButton } from "./connect-button";
import { ChallengeButton } from "./challenge-button";
import { ShareProfile } from "./share-profile";
import { TxStatus } from "./tx-status";

function equippedId(profile: Profile, item: ItemDef): number {
  if (item.category === "frame") return profile.equippedFrame;
  if (item.category === "accessory") return profile.equippedAccessory;
  return profile.equippedTitle;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-3.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[26px] font-extrabold">{children}</div>
    </div>
  );
}

export function ProfileScreen() {
  const { connected, isDemo } = useAccount();
  const restoring = useWalletRestoring();
  const { t } = useT();
  const { owner, profile, isLoading } = useProfile();
  const { note } = useNote();
  const sc = useSkillChain();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (restoring) return <p className="m-0 pt-6 text-[15px] text-muted">{t("common.connecting")}</p>;

  if (!connected || !owner) {
    return (
      <div className="flex flex-col gap-4 pt-6">
        <h2 className="m-0 text-[32px] font-extrabold tracking-[-0.03em]">{t("nav.profile")}</h2>
        <p className="m-0 text-[15px] text-muted">{t("profile.connectPrompt")}</p>
        <ConnectButton />
      </div>
    );
  }

  if (isLoading) return <p className="m-0 pt-6 text-[15px] text-muted">{t("common.loadingProfile")}</p>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-2 py-12 text-center">
        <div className="text-2xl font-extrabold tracking-[-0.02em]">{t("profile.none.title")}</div>
        <div className="text-base leading-normal text-muted">
          {t("profile.none.sub")}
        </div>
        <Link href="/learn/1" className="btn btn-primary px-6">
          {t("profile.startLevel1")}
        </Link>
      </div>
    );
  }

  const inventory = ITEMS.filter((item) => hasItem(profile.items, item.id));
  const title = profile.equippedTitle !== NONE ? getItem(profile.equippedTitle) : undefined;

  async function toggle(item: ItemDef, equipped: boolean) {
    setBusyId(item.id);
    if (equipped) await sc.unequipItem(ITEM_CATEGORY[item.category]);
    else await sc.equipItem(item.id);
    setBusyId(null);
  }

  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="size-[168px]">
          <ProfileAvatar profile={profile} />
        </div>
        {title && (
          <div className="rounded-full border-[1.5px] border-violet px-3 py-1 text-sm font-bold text-violet">
            {t(itemKey(title.id))}
          </div>
        )}
        <div className="font-mono text-[13px] text-muted">{shortAddress(owner)}</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("profile.level")}>
          {profile.level}
          <span className="text-[15px] font-medium text-muted"> / {TOTAL_LEVELS}</span>
        </Stat>
        <Stat label={t("profile.points")}>
          <span className="text-lime">{profile.points}</span>
        </Stat>
        <Stat label={t("profile.totalEarned")}>{profile.totalEarned}</Stat>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
          {t("profile.inventory")}
        </div>
        {inventory.length === 0 ? (
          <div className="flex items-center justify-between gap-3 rounded-[14px] border border-dashed border-line bg-surface p-4">
            <div className="text-[15px] text-muted">{t("profile.noItems")}</div>
            <Link href="/shop" className="text-[15px] font-bold">
              {t("profile.goShop")}
            </Link>
          </div>
        ) : (
          inventory.map((item) => {
            const equipped = equippedId(profile, item) === item.id;
            const isBusy = sc.busy && busyId === item.id;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-[14px] border bg-surface py-3 pr-3 pl-4 ${
                  equipped ? "border-lime" : "border-line"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="text-base font-bold">{t(itemKey(item.id))}</div>
                  <div className="text-[13px] text-muted">
                    {t(`category.${item.category}`)}
                    {equipped ? t("profile.equippedTag") : ""}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={sc.busy}
                  onClick={() => void toggle(item, equipped)}
                  className={`h-10 rounded-[10px] border px-3.5 text-sm font-bold disabled:opacity-60 ${
                    equipped
                      ? "border-line bg-transparent text-fg"
                      : "border-lime bg-lime text-ink"
                  }`}
                >
                  {isBusy
                    ? sc.state.status === "confirming"
                      ? t("task.confirming")
                      : t("task.signing")
                    : equipped
                      ? t("profile.unequip")
                      : t("profile.equip")}
                </button>
              </div>
            );
          })
        )}
      </div>

      <TxStatus state={sc.state} />

      {/* A demo player does not exist on-chain, so there is nothing to share. */}
      {!isDemo && <ShareProfile address={owner} level={profile.level} />}
      <ChallengeButton address={owner} />

      {note && (
        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
            {t("profile.note")}
          </div>
          <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface p-4">
            <div className="text-[17px] leading-[1.45] break-words">“{note.message}”</div>
            <div className="font-mono text-xs text-muted">
              PDA [&quot;note&quot;, {shortAddress(owner)}]
            </div>
          </div>
        </div>
      )}
    </>
  );
}
