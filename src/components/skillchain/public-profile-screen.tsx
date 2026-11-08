"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { itemKey } from "@/i18n/translate";
import { useT } from "@/i18n/use-t";
import { isProfileAddress } from "@/lib/skillchain/address";
import { ITEMS, NONE, TOTAL_LEVELS, getItem, hasItem } from "@/lib/skillchain/constants";
import { explorerAddressUrl, shortAddress } from "@/lib/skillchain/format";
import { useLeaderboard, useNoteOf, useProfileOf } from "@/lib/skillchain/hooks";
import { getAccountAddress, getProgramId } from "@/lib/skillchain/pda";
import { invalidateData } from "@/lib/skillchain/store";
import { useDemo } from "@/lib/skillchain/use-demo";
import { ProfileAvatar } from "./avatar";

function Notice({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-2 py-12 text-center">
      <div className="text-2xl font-extrabold tracking-[-0.02em]">{title}</div>
      {sub && <div className="text-base leading-normal text-muted">{sub}</div>}
      {children}
    </div>
  );
}

function CopyAddress({ address }: { address: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the full address is still selectable in the title.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px] text-muted" title={address}>
        {shortAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => void copy()}
        className="h-7 cursor-pointer rounded-lg border border-line bg-surface px-2.5 text-xs font-bold text-fg hover:border-lime"
      >
        {copied ? t("pub.copied") : t("pub.copy")}
      </button>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface p-3.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-[22px] leading-tight font-extrabold">{children}</div>
    </div>
  );
}

function ExplorerRow({ label, address }: { label: string; address: string }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-1">
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
  );
}

/** Links to the on-chain accounts that back this page. */
function Verified({ address, hasNote }: { address: string; hasNote: boolean }) {
  const { t } = useT();
  const demo = useDemo();
  const [profileAccount, setProfileAccount] = useState<string | null>(null);
  const [noteAccount, setNoteAccount] = useState<string | null>(null);
  const programId = getProgramId();

  useEffect(() => {
    if (demo) return;
    let active = true;
    getAccountAddress("profile", address).then((a) => active && setProfileAccount(a));
    getAccountAddress("note", address).then((a) => active && setNoteAccount(a));
    return () => {
      active = false;
    };
  }, [address, demo]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4">
      <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
        {t("pub.verified")}
      </div>
      <p className="m-0 text-[14px] leading-snug text-fg-3">{t("pub.verified.body")}</p>
      {demo ? (
        <p className="m-0 text-[13px] leading-snug text-coral-t">{t("pub.verified.demo")}</p>
      ) : !programId ? (
        <p className="m-0 text-[13px] leading-snug text-coral-t">{t("pub.verified.noProgram")}</p>
      ) : (
        <>
          {profileAccount && <ExplorerRow label={t("pub.verified.profile")} address={profileAccount} />}
          {hasNote && noteAccount && (
            <ExplorerRow label={t("pub.verified.note")} address={noteAccount} />
          )}
          <ExplorerRow label={t("pub.verified.program")} address={programId} />
        </>
      )}
    </div>
  );
}

/** Public profile of any wallet, read from the blockchain without a connected wallet. */
export function PublicProfileScreen({ address }: { address: string }) {
  const { t, formatNumber } = useT();
  const demo = useDemo();
  const valid = isProfileAddress(address, demo);
  const target = valid ? address : null;
  const { profile, isLoading, error } = useProfileOf(target);
  const { note } = useNoteOf(target);
  const { all } = useLeaderboard();

  if (!valid) {
    return (
      <Notice title={t("pub.invalid")} sub={t("pub.invalidSub")}>
        <Link href="/leaderboard" className="btn btn-primary px-6">
          {t("pub.toBoard")}
        </Link>
      </Notice>
    );
  }

  if (error) {
    return (
      <Notice title={t("pub.error")}>
        <button type="button" onClick={invalidateData} className="btn btn-primary px-6">
          {t("pub.retry")}
        </button>
      </Notice>
    );
  }

  if (isLoading) return <p className="m-0 pt-6 text-[15px] text-muted">{t("pub.loading")}</p>;

  if (!profile) {
    return (
      <Notice title={t("pub.none.title")} sub={t("pub.none.sub")}>
        <Link href="/" className="btn btn-primary px-6">
          {t("pub.none.cta")}
        </Link>
      </Notice>
    );
  }

  const position = all.findIndex((p) => p.owner === address) + 1;
  const items = ITEMS.filter((item) => hasItem(profile.items, item.id));
  const title = profile.equippedTitle !== NONE ? getItem(profile.equippedTitle) : undefined;

  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-2">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          {t("pub.title")}
        </div>
        <div className="size-[168px]">
          <ProfileAvatar profile={profile} />
        </div>
        {title && (
          <div className="rounded-full border-[1.5px] border-violet px-3 py-1 text-sm font-bold text-violet">
            {t(itemKey(title.id))}
          </div>
        )}
        <CopyAddress address={address} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t("profile.level")}>
          {profile.level}
          <span className="text-[14px] font-medium text-muted"> / {TOTAL_LEVELS}</span>
        </Stat>
        <Stat label={t("profile.totalEarned")}>
          <span className="text-lime">{formatNumber(profile.totalEarned)}</span>
        </Stat>
        <Stat label={t("pub.rank")}>
          {position > 0 ? t("pub.rankValue", { n: position, total: all.length }) : "—"}
        </Stat>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
          {t("pub.items")}
        </div>
        {items.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-line bg-surface p-4 text-[15px] text-muted">
            {t("pub.noItems")}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-0.5 rounded-[14px] border border-line bg-surface px-4 py-3"
            >
              <div className="text-base font-bold">{t(itemKey(item.id))}</div>
              <div className="text-[13px] text-muted">{t(`category.${item.category}`)}</div>
            </div>
          ))
        )}
      </div>

      {note && (
        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-bold tracking-[0.06em] text-muted uppercase">
            {t("profile.note")}
          </div>
          <div className="rounded-[14px] border border-line bg-surface p-4 text-[17px] leading-[1.45] break-words">
            “{note.message}”
          </div>
        </div>
      )}

      <Verified address={address} hasNote={Boolean(note)} />
    </>
  );
}
