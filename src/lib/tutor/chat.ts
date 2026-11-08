import enLessons from "../../content/lessons.en.json";
import ptLessons from "../../content/lessons.pt.json";
import type { Lang } from "../../i18n/translate";
import { withTimeout, AI_TIMEOUT_MS } from "./explain";
import type { TxFacts } from "./facts";
import type { AskChat } from "./gemini";

import { MAX_ANSWER_CHARS, MAX_HISTORY, MAX_QUESTION_CHARS, MAX_QUESTIONS } from "./limits-shared";

export { MAX_ANSWER_CHARS, MAX_HISTORY, MAX_QUESTION_CHARS, MAX_QUESTIONS };
/** Largest body of /api/tutor/ask: a question plus two earlier question and answer pairs. */
export const MAX_ASK_BODY_BYTES = 4096;

export interface ChatTurn {
  question: string;
  answer: string;
}

export interface ChatInput {
  facts: TxFacts;
  lang: Lang;
  question: string;
  history: ChatTurn[];
}

export type AskValidation =
  | { ok: true; question: string; history: ChatTurn[] }
  | { ok: false; error: "question_empty" | "question_too_long" | "invalid_history" };

const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Checks the question and history sent by the client. */
export function validateAsk(question: unknown, history: unknown): AskValidation {
  if (typeof question !== "string") return { ok: false, error: "question_empty" };
  const clean = question.replace(CONTROL, "").trim();
  if (clean.length === 0) return { ok: false, error: "question_empty" };
  if (clean.length > MAX_QUESTION_CHARS) return { ok: false, error: "question_too_long" };

  const turns: ChatTurn[] = [];
  if (history !== undefined) {
    if (!Array.isArray(history) || history.length > MAX_HISTORY) {
      return { ok: false, error: "invalid_history" };
    }
    for (const item of history) {
      const turn = item as Partial<ChatTurn> | null;
      if (
        !turn ||
        typeof turn.question !== "string" ||
        typeof turn.answer !== "string" ||
        turn.question.length > MAX_QUESTION_CHARS ||
        turn.answer.length > MAX_ANSWER_CHARS
      ) {
        return { ok: false, error: "invalid_history" };
      }
      turns.push({
        question: turn.question.replace(CONTROL, "").trim(),
        answer: turn.answer.replace(CONTROL, "").trim(),
      });
    }
  }
  return { ok: true, question: clean, history: turns };
}

/** The lesson of the level, as context for the model. */
export function lessonContext(level: number, lang: Lang) {
  const lesson = (lang === "pt" ? ptLessons : enLessons).find((l) => l.level === level);
  if (!lesson) return null;
  return {
    title: lesson.title,
    topics: lesson.topics,
    steps: lesson.steps.map((s) => ({ title: s.title, body: s.body })),
  };
}

/**
 * Asks the model a follow-up question. Rejects if the model fails, times out
 * or answers with nothing, so the caller can show the "unavailable" message.
 */
export async function answerQuestion(
  input: ChatInput,
  askChat: AskChat,
  timeoutMs = AI_TIMEOUT_MS,
): Promise<string> {
  const text = await withTimeout((signal) => askChat(input, signal), timeoutMs);
  const clean = text.trim().slice(0, MAX_ANSWER_CHARS);
  if (!clean) throw new Error("Empty answer");
  return clean;
}
