import { NextResponse } from "next/server";
import { isLang, type Lang } from "@/i18n/translate";
import { isSignature } from "@/lib/tutor/base58";
import { explainTransaction } from "@/lib/tutor/explain";
import { MAX_BODY_BYTES, clientIp } from "@/lib/tutor/limits";
import {
  TutorHttpError,
  fail,
  getAsk,
  getVerifiedFacts,
  tutorState,
} from "@/lib/tutor/server-state";

export const runtime = "nodejs";

const AI_CACHE_MS = 60 * 60_000;
// A template answer usually means the AI had a problem: let the next request try again soon.
const TEMPLATE_CACHE_MS = 60_000;

export async function POST(request: Request) {
  if (!tutorState.limiter.allow(clientIp(request.headers))) return fail(429, "rate_limited");

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
  const cached = tutorState.explanations.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  let facts;
  try {
    facts = await getVerifiedFacts(signature, level as number);
  } catch (err) {
    if (err instanceof TutorHttpError) return fail(err.status, err.code);
    throw err;
  }

  const explanation = await explainTransaction(facts, lang as Lang, getAsk());
  tutorState.explanations.set(
    cacheKey,
    explanation,
    explanation.source === "ai" ? AI_CACHE_MS : TEMPLATE_CACHE_MS,
  );
  return NextResponse.json(explanation);
}
