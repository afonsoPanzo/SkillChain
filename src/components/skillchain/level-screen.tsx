"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/i18n/use-t";
import { useWallet } from "@solana/wallet-adapter";
import { useWalletRestoring } from "@/lib/skillchain/use-wallet-restoring";
import { backend } from "@/lib/skillchain/backend";
import { useProfile, useSkillChain } from "@/lib/skillchain/hooks";
import { getLesson, getLevelPoints } from "@/lib/skillchain/lessons";
import { ConnectButton } from "./connect-button";
import { LevelComplete } from "./level-complete";
import { LessonPlayer } from "./lesson-player";
import { LevelDone } from "./level-done";

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
  const { owner, profile, isLoading } = useProfile();
  const [reviewing, setReviewing] = useState(false);
  const sc = useSkillChain();
  const { t, lang } = useT();
  const lesson = getLesson(level, lang);
  const restoring = useWalletRestoring();

  if (!lesson) return <Notice title={t("level.notFound.title")}>{t("level.notFound.body")}</Notice>;

  const back = (
    <Link href="/learn" className="py-2 text-[15px] text-muted hover:text-fg hover:no-underline">
      {t("common.map")}
    </Link>
  );

  if (restoring) {
    return (
      <>
        {back}
        <p className="m-0 text-[15px] text-muted">{t("common.connecting")}</p>
      </>
    );
  }

  if (!connected) {
    return (
      <>
        {back}
        <Notice title={t("level.connect.title")}>{t("level.connect.body")}</Notice>
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
        <p className="text-[15px] text-muted">{t("common.loadingProfile")}</p>
      </>
    );
  }

  const currentLevel = profile?.level ?? 0;

  if (level > currentLevel + 1) {
    return (
      <>
        {back}
        <Notice title={t("level.locked.title", { n: level })}>
          {t("level.locked.body", { prev: currentLevel + 1 })}
        </Notice>
      </>
    );
  }

  // Already completed on-chain: show the result first, the lesson only as a review.
  if (currentLevel >= level && !reviewing && owner) {
    return (
      <LevelDone
        level={level}
        title={lesson.title}
        points={getLevelPoints(level)}
        owner={owner}
        onReview={() => setReviewing(true)}
      />
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
      pointsLabel={t("task.points", { n: getLevelPoints(level) })}
      tx={sc.state}
      onSubmitTask={submitTask}
      review={currentLevel >= level}
      onExitReview={() => setReviewing(false)}
    />
  );
}
