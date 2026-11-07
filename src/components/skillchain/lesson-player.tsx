"use client";

import Link from "next/link";
import { useState } from "react";
import type { Lesson } from "@/lib/skillchain/lessons";
import type { TxState } from "@/lib/skillchain/types";
import { Quiz } from "./quiz";
import { TaskPanel } from "./task-panel";

type Stage = "steps" | "quiz" | "task";

interface LessonPlayerProps {
  lesson: Lesson;
  pointsLabel: string;
  tx: TxState;
  /** Runs the on-chain instruction. `input` is the recipient (level 2) or the note (level 3). */
  onSubmitTask: (input: string) => void;
  /** Review mode: steps and quiz only, no task and no points promised. */
  review?: boolean;
  /** Leaves review mode (back to the completed-level screen). */
  onExitReview?: () => void;
}

/** Steps, then quiz, then the on-chain task. The combo is only a visual reward. */
export function LessonPlayer({
  lesson,
  pointsLabel,
  tx,
  onSubmitTask,
  review = false,
  onExitReview,
}: LessonPlayerProps) {
  const [stage, setStage] = useState<Stage>("steps");
  const [step, setStep] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboTick, setComboTick] = useState(0);

  const nSteps = lesson.steps.length;
  const nQuiz = lesson.quiz.length;
  const segments = nSteps + nQuiz;
  const current =
    stage === "steps" ? step : stage === "quiz" ? nSteps + quizIndex : segments;

  function onAnswer(correct: boolean) {
    setCombo((c) => (correct ? c + 1 : 0));
    setComboTick((t) => t + 1);
  }

  const header = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Link
          href="/learn"
          className="py-2 text-[15px] text-muted hover:text-fg hover:no-underline"
        >
          ← Mapa
        </Link>
        {review && (
          <div className="rounded-full border border-line px-[9px] py-[3px] font-mono text-xs text-muted">
            Revisão
          </div>
        )}
        {combo >= 2 && (
          <div
            key={comboTick}
            className="animate-burst rounded-full bg-lime px-[9px] py-[3px] font-mono text-[13px] font-semibold text-ink"
          >
            combo {combo}x
          </div>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-[3px] transition-colors ${
              i < current ? "bg-lime" : i === current ? "bg-violet" : "bg-surface-2"
            }`}
          />
        ))}
      </div>
      <div className="font-mono text-xs text-muted">
        Nv {lesson.level} · {lesson.title}
      </div>
    </div>
  );

  if (stage === "steps") {
    const s = lesson.steps[step];
    const last = step === nSteps - 1;
    return (
      <>
        {header}
        <div className="flex flex-1 flex-col gap-5">
          <div className="font-mono text-xs tracking-[0.08em] text-lime uppercase">
            Passo {step + 1} de {nSteps}
          </div>
          <h2 className="m-0 text-[34px] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance">
            {s.title}
          </h2>
          <p className="m-0 text-lg leading-[1.55] text-fg-2 text-pretty">{s.body}</p>
          {s.term && (
            <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface px-4 py-3.5">
              <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
                Na prática
              </div>
              <div className="font-mono text-[13px] leading-[1.6] break-all whitespace-pre-line">
                {s.term}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          {step > 0 && (
            <button
              type="button"
              className="btn h-[58px] rounded-2xl border border-line bg-surface px-5 text-base font-bold text-fg shadow-[0_5px_0_var(--color-press)]"
              onClick={() => setStep(step - 1)}
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => {
              if (last) {
                setQuizIndex(0);
                setStage("quiz");
              } else setStep(step + 1);
            }}
          >
            {last ? "Começar o quiz" : "Seguinte"}
          </button>
        </div>
      </>
    );
  }

  if (stage === "quiz") {
    return (
      <>
        {header}
        <Quiz
          questions={lesson.quiz}
          onAnswer={onAnswer}
          onIndexChange={setQuizIndex}
          onFinish={() => (review ? onExitReview?.() : setStage("task"))}
          finishLabel={review ? "Concluir revisão" : "Desbloquear tarefa"}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <TaskPanel
        lesson={lesson}
        pointsLabel={pointsLabel}
        tx={tx}
        onSubmit={onSubmitTask}
      />
    </>
  );
}
