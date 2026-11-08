import { NextResponse } from "next/server";
import { isLang, type Lang } from "@/i18n/translate";
import { isSignature } from "@/lib/tutor/base58";
import { explainTransaction, type AskAi, type Explanation } from "@/lib/tutor/explain";
import { NotSkillChainTransactionError, extractFacts } from "@/lib/tutor/facts";
import { fetchTransaction } from "@/lib/tutor/fetch-transaction";
import { DEFAULT_MODEL, createGeminiAsk } from "@/lib/tutor/gemini";
import { MAX_BODY_BYTES, RateLimiter, TtlCache, clientIp } from "@/lib/tutor/limits";

export const runtime = "nodejs";

const AI_CACHE_MS = 60 * 60_000;
// A template answer usually means the AI had a problem: let the next request try again soon.
const TEMPLATE_CACHE_MS = 60_000;

const cache = new TtlCache<Explanation>();
const limiter = new RateLimiter();
let ask: AskAi | null | undefined;

/** The key is read from the server environment only and is never logged or returned. */
function getAsk(): AskAi | null {
  if (ask === undefined) {
    const key = process.env.GEMINI_API_KEY?.trim();
    ask = key ? createGeminiAsk(key, process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL) : null;
  }
  return ask;
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  if (!limiter.allow(clientIp(request.headers))) return fail(429, "rate_limited");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return fail(413, "too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return fail(413, "too_large");

  let body: { signature?: unknown; level?: unknown; lang?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_request");
  }
  const { signature, level, lang } = body;
  if (!isSignature(signature) || !isLang(lang) || !Number.isInteger(level) || (level as number) < 1 || (level as number) > 3) {
    return fail(400, "invalid_request");
  }

  const cacheKey = `${signature}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const programId = (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim();
  if (!programId) return fail(503, "not_configured");

  let tx;
  try {
    tx = await fetchTransaction(signature);
  } catch (err) {
    console.warn("[tutor] RPC failed:", err instanceof Error ? err.message : "unknown");
    return fail(502, "rpc_failed");
  }
  if (!tx) return fail(404, "transaction_not_found");

  let facts;
  try {
    facts = extractFacts(signature, tx, programId);
  } catch (err) {
    if (err instanceof NotSkillChainTransactionError) return fail(422, "not_skillchain");
    throw err;
  }
  if (facts.level !== level) return fail(422, "level_mismatch");

  const explanation = await explainTransaction(facts, lang as Lang, getAsk());
  cache.set(cacheKey, explanation, explanation.source === "ai" ? AI_CACHE_MS : TEMPLATE_CACHE_MS);
  return NextResponse.json(explanation);
}
