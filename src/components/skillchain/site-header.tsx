"use client";

import Link from "next/link";
import { WalletMultiButton, useWallet } from "@solana/wallet-adapter";
import { backend } from "@/lib/skillchain/backend";
import { useProfile } from "@/lib/skillchain/hooks";
import { ProfileAvatar } from "./avatar";

export function SiteHeader() {
  const { connected } = useWallet();
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-2.5 border-b border-divider bg-ink/90 px-4 py-3 backdrop-blur-[10px]">
      <Link
        href="/"
        className="flex items-center gap-2 text-fg hover:no-underline"
        aria-label="SkillChain, página inicial"
      >
        <span className="text-[19px] font-extrabold tracking-[-0.02em]">
          Skill
          <span className="bg-linear-to-r from-sol-purple to-lime bg-clip-text text-transparent">
            Chain
          </span>
        </span>
        <span className="rounded-full border border-violet-b px-[7px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.06em] text-violet uppercase">
          Devnet
        </span>
        {backend.isMock && (
          <span
            className="rounded-full border border-coral-d px-[7px] py-[3px] font-mono text-[10px] font-semibold tracking-[0.06em] text-coral-t uppercase"
            title="Dados simulados em memória: ainda não está ligado ao programa"
          >
            Mock
          </span>
        )}
      </Link>
      {connected && (
        <div className="flex items-center gap-2">
          {profile && (
            <span className="font-mono text-[13px] font-semibold text-lime">
              {profile.points} pts
            </span>
          )}
          {profile && (
            <Link href="/profile" className="block size-[34px]" aria-label="O teu perfil">
              <ProfileAvatar profile={profile} />
            </Link>
          )}
          <WalletMultiButton />
        </div>
      )}
    </header>
  );
}
