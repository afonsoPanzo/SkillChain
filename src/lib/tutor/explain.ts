import type { Lang } from "../../i18n/translate";
import type { TxFacts } from "./facts";
import { explainWithTemplate } from "./template";

export const AI_TIMEOUT_MS = 10_000;
const MAX_TEXT_LENGTH = 1200;

export interface Explanation {
  text: string;
  /** "ai" when the model wrote it, "template" for the fallback. */
  source: "ai" | "template";
}

/** Calls the model. It must reject on failure and stop when `signal` aborts. */
export type AskAi = (facts: TxFacts, lang: Lang, signal: AbortSignal) => Promise<string>;

/**
 * Asks the AI for the explanation. If the call fails, returns nothing useful,
 * runs out of quota or takes more than `timeoutMs`, the template explanation
 * built from the same facts is returned instead.
 */
export async function explainTransaction(
  facts: TxFacts,
  lang: Lang,
  askAi: AskAi | null,
  timeoutMs = AI_TIMEOUT_MS,
): Promise<Explanation> {
  if (askAi) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const text = await Promise.race([
        askAi(facts, lang, controller.signal),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => reject(new Error("AI timeout")));
        }),
      ]);
      const clean = text.trim().slice(0, MAX_TEXT_LENGTH);
      if (clean) return { text: clean, source: "ai" };
    } catch (err) {
      // Never log request details: only the error message.
      console.warn("[tutor] AI unavailable, using template:", err instanceof Error ? err.message : "unknown");
    } finally {
      clearTimeout(timer);
    }
  }
  return { text: explainWithTemplate(facts, lang), source: "template" };
}
