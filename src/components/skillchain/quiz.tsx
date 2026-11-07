"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/skillchain/lessons";

const RIGHT_WORDS = ["Boa!", "Certo!", "Exactamente."];
const KEYS = "ABCD";

interface QuizProps {
  questions: QuizQuestion[];
  /** Called after each answer, so the player can show the combo. */
  onAnswer: (correct: boolean) => void;
  /** Index of the question being shown, for the progress bar. */
  onIndexChange: (index: number) => void;
  onFinish: () => void;
}

/**
 * One question at a time. A wrong answer shows the explanation and the same
 * question is tried again; there are no lives or timer (cut from the design).
 */
export function Quiz({ questions, onAnswer, onIndexChange, onFinish }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const correct = picked !== null && picked === question.answer;
  const answered = picked !== null;

  function pick(option: number) {
    if (answered) return;
    setPicked(option);
    onAnswer(option === question.answer);
  }

  function next() {
    if (!correct) {
      setPicked(null);
      return;
    }
    if (isLast) onFinish();
    else {
      setIndex(index + 1);
      onIndexChange(index + 1);
      setPicked(null);
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-[18px]">
        <div className="font-mono text-xs tracking-[0.08em] text-lime uppercase">
          Pergunta {index + 1} de {questions.length}
        </div>
        <h2 className="m-0 text-[28px] leading-[1.1] font-extrabold tracking-[-0.025em] text-balance">
          {question.question}
        </h2>
        <div className="flex flex-col gap-2.5">
          {question.options.map((text, i) => {
            const isPicked = picked === i;
            const style = !isPicked
              ? "border-line bg-surface shadow-[0_4px_0_var(--color-press)]"
              : correct
                ? "border-lime bg-lime/10 shadow-[0_4px_0_var(--color-lime-d)]"
                : "border-coral bg-coral/10 shadow-[0_4px_0_var(--color-coral-d)]";
            const keyStyle = !isPicked
              ? "bg-surface-2 text-muted"
              : correct
                ? "bg-lime text-ink"
                : "bg-coral text-ink";
            return (
              <button
                key={text}
                type="button"
                disabled={answered}
                onClick={() => pick(i)}
                className={`flex min-h-[58px] items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-semibold text-fg ${style} ${
                  answered ? "cursor-default" : "cursor-pointer active:translate-y-1 active:shadow-none"
                }`}
              >
                <span
                  className={`flex size-7 flex-none items-center justify-center rounded-lg font-mono text-[13px] font-semibold ${keyStyle}`}
                >
                  {KEYS[i]}
                </span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {answered && (
        <div
          className={`animate-rise -mx-[18px] -mb-8 flex flex-col gap-3.5 border-t-2 px-[18px] pt-5 pb-7 ${
            correct ? "border-lime bg-[#0f2a20]" : "border-coral bg-[#2a1614]"
          }`}
        >
          <div className="flex flex-col gap-1">
            <div className={`text-xl font-extrabold ${correct ? "text-lime" : "text-coral"}`}>
              {correct ? RIGHT_WORDS[index % RIGHT_WORDS.length] : "Ainda não."}
            </div>
            <div className="text-[15px] leading-snug text-fg-2">
              {correct ? question.explanation : `${question.explanation} Tenta outra vez.`}
            </div>
          </div>
          <button type="button" className={`btn ${correct ? "btn-primary" : "btn-coral"}`} onClick={next}>
            {!correct ? "Tentar de novo" : isLast ? "Desbloquear tarefa" : "Continuar"}
          </button>
        </div>
      )}
    </>
  );
}
