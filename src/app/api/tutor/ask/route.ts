import { NextResponse } from "next/server";
import { isLang, type Lang } from "@/i18n/translate";
import { isSignature } from "@/lib/tutor/base58";
import { MAX_ASK_BODY_BYTES, MAX_QUESTIONS, answerQuestion, validateAsk } from "@/lib/tutor/chat";
import { clientIp } from "@/lib/tutor/limits";
import {
  FACTS_CACHE_MS,
  TutorHttpError,
  fail,
  getChat,
  getVerifiedFacts,
  tutorState,
} from "@/lib/tutor/server-state";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Same per-IP limit as /api/tutor.
  if (!tutorState.limiter.allow(clientIp(request.headers))) return fail(429, "rate_limited");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_ASK_BODY_BYTES) return fail(413, "too_large");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_ASK_BODY_BYTES) return fail(413, "too_large");

  let body: {
    signature?: unknown;
    level?: unknown;
    lang?: unknown;
    question?: unknown;
    history?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_request");
  }
  const { signature, level, lang } = body;
  if (!isSignature(signature) || !isLang(lang) || !Number.isInteger(level) || (level as number) < 1 || (level as number) > 3) {
    return fail(400, "invalid_request");
  }
  const checked = validateAsk(body.question, body.history);
  if (!checked.ok) return fail(400, checked.error);

  // The server keeps its own count: the client's counter can be bypassed.
  const asked = tutorState.questionCounts.get(signature) ?? 0;
  if (asked >= MAX_QUESTIONS) return fail(429, "question_limit");

  let facts;
  try {
    facts = await getVerifiedFacts(signature, level as number);
  } catch (err) {
    if (err instanceof TutorHttpError) return fail(err.status, err.code);
    throw err;
  }

  const chat = getChat();
  if (!chat) return fail(503, "tutor_unavailable");

  // Count before waiting for the model, so parallel requests cannot skip the limit.
  tutorState.questionCounts.set(signature, asked + 1, FACTS_CACHE_MS);
  try {
    const text = await answerQuestion(
      { facts, lang: lang as Lang, question: checked.question, history: checked.history },
      chat,
    );
    return NextResponse.json({ text, remaining: MAX_QUESTIONS - (asked + 1) });
  } catch (err) {
    // A failed answer does not use up one of the player's questions.
    const current = tutorState.questionCounts.get(signature) ?? 1;
    tutorState.questionCounts.set(signature, Math.max(0, current - 1), FACTS_CACHE_MS);
    console.warn("[tutor] chat unavailable:", err instanceof Error ? err.message : "unknown");
    return fail(503, "tutor_unavailable");
  }
}
