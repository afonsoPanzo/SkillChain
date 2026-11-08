"use client";

import { useState } from "react";
import type { TKey } from "@/i18n/translate";
import { useT } from "@/i18n/use-t";
import { MAX_HISTORY, MAX_QUESTIONS, MAX_QUESTION_CHARS } from "@/lib/tutor/limits-shared";

interface Turn {
  question: string;
  answer: string;
  /** "fixed" answers are pre-written and never leave the browser. */
  source: "ai" | "fixed";
}

type Problem = "unavailable" | "rate" | "limit" | "generic" | null;

const SUGGESTIONS = [1, 2, 3] as const;

/** Follow-up questions for the tutor, with suggested questions and hard limits. */
export function TutorChat({
  signature,
  level,
  demo,
}: {
  signature: string;
  level: number;
  demo: boolean;
}) {
  const { t, lang } = useT();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiAsked, setAiAsked] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);

  const limitReached = aiAsked >= MAX_QUESTIONS;
  const freeDisabled = demo || unavailable || limitReached || busy;
  const suggestedKey = (n: number, kind: "q" | "a") => `tutor.${kind}.${level}.${n}` as TKey;

  function answerFixed(n: number) {
    setProblem(null);
    setTurns((prev) => [
      ...prev,
      { question: t(suggestedKey(n, "q")), answer: t(suggestedKey(n, "a")), source: "fixed" },
    ]);
  }

  async function ask(question: string, suggestion?: number) {
    const clean = question.trim();
    if (!clean || busy) return;
    // Suggested questions have fixed answers in demo mode and when the AI is down.
    if (suggestion !== undefined && (demo || unavailable)) {
      answerFixed(suggestion);
      return;
    }
    if (demo || limitReached) return;

    setBusy(true);
    setProblem(null);
    try {
      const history = turns
        .filter((turn) => turn.source === "ai")
        .slice(-MAX_HISTORY)
        .map(({ question: q, answer }) => ({ question: q, answer }));
      const response = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature, level, lang, question: clean, history }),
      });
      const data = (await response.json()) as { text?: string; remaining?: number; error?: string };
      if (response.ok && data.text) {
        setTurns((prev) => [...prev, { question: clean, answer: data.text!, source: "ai" }]);
        setAiAsked(
          typeof data.remaining === "number" ? MAX_QUESTIONS - data.remaining : aiAsked + 1,
        );
        setText("");
      } else if (data.error === "question_limit") {
        setAiAsked(MAX_QUESTIONS);
        setProblem("limit");
      } else if (data.error === "rate_limited") {
        setProblem("rate");
      } else if (data.error === "tutor_unavailable") {
        setUnavailable(true);
        setProblem("unavailable");
        if (suggestion !== undefined) answerFixed(suggestion);
      } else {
        setProblem("generic");
      }
    } catch {
      setUnavailable(true);
      setProblem("unavailable");
      if (suggestion !== undefined) answerFixed(suggestion);
    } finally {
      setBusy(false);
    }
  }

  const asked = new Set(turns.map((turn) => turn.question));
  const chipsDisabled = busy || (!demo && !unavailable && limitReached);

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-left">
      <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
        {t("tutor.chat.title")}
      </div>

      {turns.map((turn, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="self-end rounded-xl bg-surface-2 px-3 py-2 text-[14px] text-fg">
            {turn.question}
          </div>
          <p className="m-0 text-[15px] leading-normal text-fg-3">{turn.answer}</p>
        </div>
      ))}
      {busy && <p className="m-0 text-[14px] text-muted">{t("tutor.chat.thinking")}</p>}

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((n) => {
          const label = t(suggestedKey(n, "q"));
          return (
            <button
              key={n}
              type="button"
              disabled={chipsDisabled || asked.has(label)}
              onClick={() => void ask(label, n)}
              className="cursor-pointer rounded-full border border-line bg-ink px-3 py-1.5 text-left text-[13px] text-fg hover:border-lime disabled:cursor-not-allowed disabled:opacity-50"
            >
              {label}
            </button>
          );
        })}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_QUESTION_CHARS}
          disabled={freeDisabled}
          placeholder={t("tutor.chat.placeholder")}
          aria-label={t("tutor.chat.title")}
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-line bg-ink px-3 text-[14px] text-fg outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={freeDisabled || text.trim().length === 0}
          className="h-11 cursor-pointer rounded-xl border border-lime bg-lime px-4 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("tutor.chat.send")}
        </button>
      </form>

      <div role="status" className="flex flex-col gap-1 text-[13px] leading-snug">
        {demo ? (
          <span className="text-coral-t">{t("tutor.chat.demo")}</span>
        ) : problem === "unavailable" || unavailable ? (
          <>
            <span className="text-coral-t">{t("tutor.chat.unavailable")}</span>
            <span className="text-muted">{t("tutor.chat.unavailableHint")}</span>
          </>
        ) : problem === "rate" ? (
          <span className="text-coral-t">{t("tutor.error.rate")}</span>
        ) : problem === "generic" ? (
          <span className="text-coral-t">{t("tutor.error.generic")}</span>
        ) : limitReached ? (
          <span className="text-muted">{t("tutor.chat.limit", { max: MAX_QUESTIONS })}</span>
        ) : (
          <span className="text-muted">
            {t("tutor.chat.left", { n: MAX_QUESTIONS - aiAsked, max: MAX_QUESTIONS })}
          </span>
        )}
        {!demo && text.length > 0 && (
          <span className="font-mono text-xs text-muted">
            {text.length} / {MAX_QUESTION_CHARS}
          </span>
        )}
      </div>
    </div>
  );
}
