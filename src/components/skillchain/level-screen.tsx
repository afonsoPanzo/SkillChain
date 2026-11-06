"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter";
import { backend } from "@/lib/skillchain/backend";
import { useProfile, useSkillChain } from "@/lib/skillchain/hooks";
import { getLesson, getLevelPoints } from "@/lib/skillchain/lessons";
import { ConnectButton } from "./connect-button";
import { LevelComplete } from "./level-complete";
import { TaskPanel } from "./task-panel";

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

  if (!lesson) return <Notice title="Nível não encontrado">Este nível não existe.</Notice>;

  const back = (
    <Link href="/learn" className="py-2 text-[15px] text-muted hover:text-fg hover:no-underline">
      ← Mapa
    </Link>
  );

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

  // Levels 2 and 3 arrive in phase 2.
  if (level !== 1 && currentLevel < level) {
    return (
      <>
        {back}
        <Notice title={`Nível ${level} · ${lesson.title}`}>
          Este nível fica disponível na próxima fase de desenvolvimento.
        </Notice>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {back}
        <div className="font-mono text-xs text-muted">
          Nv {level} · {lesson.title}
        </div>
      </div>
      <TaskPanel
        lesson={lesson}
        pointsLabel={`+${getLevelPoints(level)} pts`}
        alreadyDone={currentLevel >= level}
        tx={sc.state}
        onSubmit={() => void sc.initProfile()}
      />
    </>
  );
}
