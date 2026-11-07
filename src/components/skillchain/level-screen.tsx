"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { backend } from "@/lib/skillchain/backend";
import { useProfile, useSkillChain } from "@/lib/skillchain/hooks";
import { getLesson, getLevelPoints } from "@/lib/skillchain/lessons";
import { ConnectButton } from "./connect-button";
import { LevelComplete } from "./level-complete";
import { LessonPlayer } from "./lesson-player";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
      <div className="text-[17px] font-bold">{title}</div>
      <div className="text-[15px] leading-snug text-fg-3">{children}</div>
    </div>
  );
}

export function LevelScreen({ level }: { level: number }) {
  const { connected } = useWallet();
  const { profile, isLoading } = useProfile();
  const sc = useSkillChain();
  const lesson = getLesson(level);
  const restoring = useWalletRestoring();

  if (!lesson) return <Notice title="Nível não encontrado">Este nível não existe.</Notice>;

  const back = (
    <Link href="/learn" className="py-2 text-[15px] text-muted hover:text-fg hover:no-underline">
      ← Mapa
    </Link>
  );

  if (restoring) {
    return (
      <>
        {back}
        <p className="m-0 text-[15px] text-muted">A ligar a carteira…</p>
      </>
    );
  }

  if (!connected) {
    return (
      <>
        {back}
        <Notice title="Liga a tua carteira">
          Precisas da Phantom em Devnet para assinar a tarefa deste nível.
        </Notice>
        <ConnectButton />
      </>
    );
  }

  // A level completed in this session: show the result, whatever the refreshed profile says.
  if (sc.state.status === "confirmed") {
    return (
      <LevelComplete
        level={level}
        gain={getLevelPoints(level)}
        signature={sc.state.signature}
        isMock={backend.isMock}
      />
    );
  }

  if (isLoading) {
    return (
      <>
        {back}
        <p className="text-[15px] text-muted">A ler o teu perfil…</p>
      </>
    );
  }

  const currentLevel = profile?.level ?? 0;

  if (level > currentLevel + 1) {
    return (
      <>
        {back}
        <Notice title={`Nível ${level} bloqueado`}>
          Conclui primeiro o nível {currentLevel + 1}.
        </Notice>
      </>
    );
  }

  function submitTask(input: string) {
    if (lesson?.task.type === "complete_level_2") void sc.completeLevel2(input);
    else if (lesson?.task.type === "complete_level_3") void sc.completeLevel3(input);
    else void sc.initProfile();
  }

  return (
    <LessonPlayer
      lesson={lesson}
      pointsLabel={`+${getLevelPoints(level)} pts`}
      alreadyDone={currentLevel >= level}
      tx={sc.state}
      onSubmitTask={submitTask}
    />
  );
}
