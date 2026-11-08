import { NextResponse } from "next/server";
import type { AskAi, Explanation } from "./explain";
import { NotSkillChainTransactionError, extractFacts, type TxFacts } from "./facts";
import { fetchTransaction } from "./fetch-transaction";
import { DEFAULT_MODEL, createGeminiAsk, createGeminiChat, type AskChat } from "./gemini";
import { RateLimiter, TtlCache } from "./limits";

/**
 * State shared by the tutor routes. It hangs off globalThis so that both
 * routes use the same cache and the same per-IP limit even when the bundler
 * gives each route its own copy of this module.
 */
interface TutorState {
  limiter: RateLimiter;
  facts: TtlCache<TxFacts>;
  explanations: TtlCache<Explanation>;
  questionCounts: TtlCache<number>;
  ask?: AskAi | null;
  chat?: AskChat | null;
}

const holder = globalThis as typeof globalThis & { __skillchainTutor?: TutorState };

export const tutorState: TutorState = (holder.__skillchainTutor ??= {
  limiter: new RateLimiter(),
  facts: new TtlCache<TxFacts>(),
  explanations: new TtlCache<Explanation>(),
  questionCounts: new TtlCache<number>(),
});

export const FACTS_CACHE_MS = 60 * 60_000;

/** An error that maps to an HTTP status and a short machine-readable code. */
export class TutorHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function geminiConfig(): { key: string; model: string } | null {
  // The key is read from the server environment only and is never logged or returned.
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  return { key, model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL };
}

export function getAsk(): AskAi | null {
  if (tutorState.ask === undefined) {
    const config = geminiConfig();
    tutorState.ask = config ? createGeminiAsk(config.key, config.model) : null;
  }
  return tutorState.ask;
}

export function getChat(): AskChat | null {
  if (tutorState.chat === undefined) {
    const config = geminiConfig();
    tutorState.chat = config ? createGeminiChat(config.key, config.model) : null;
  }
  return tutorState.chat;
}

/**
 * Facts of a transaction that really calls the SkillChain program for the
 * requested level. Cached by signature, so repeated questions do not hit the RPC.
 */
export async function getVerifiedFacts(signature: string, level: number): Promise<TxFacts> {
  let facts = tutorState.facts.get(signature);
  if (!facts) {
    const programId = (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim();
    if (!programId) throw new TutorHttpError(503, "not_configured");

    let tx;
    try {
      tx = await fetchTransaction(signature);
    } catch (err) {
      console.warn("[tutor] RPC failed:", err instanceof Error ? err.message : "unknown");
      throw new TutorHttpError(502, "rpc_failed");
    }
    if (!tx) throw new TutorHttpError(404, "transaction_not_found");

    try {
      facts = extractFacts(signature, tx, programId);
    } catch (err) {
      if (err instanceof NotSkillChainTransactionError) throw new TutorHttpError(422, "not_skillchain");
      throw err;
    }
    tutorState.facts.set(signature, facts, FACTS_CACHE_MS);
  }
  if (facts.level !== level) throw new TutorHttpError(422, "level_mismatch");
  return facts;
}
