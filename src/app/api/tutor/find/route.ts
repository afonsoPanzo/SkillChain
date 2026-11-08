import { NextResponse } from "next/server";
import { isSolanaAddress } from "@/lib/skillchain/address";
import { findLevelSignature } from "@/lib/tutor/find-signature";
import { fetchTransaction, listSignatures } from "@/lib/tutor/fetch-transaction";
import { MAX_BODY_BYTES, clientIp } from "@/lib/tutor/limits";
import { FACTS_CACHE_MS, fail, tutorState } from "@/lib/tutor/server-state";

export const runtime = "nodejs";

/** Finds the signature of the transaction that completed a level, for levels finished earlier. */
export async function POST(request: Request) {
  if (!tutorState.limiter.allow(clientIp(request.headers))) return fail(429, "rate_limited");

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return fail(413, "too_large");

  let body: { owner?: unknown; level?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "invalid_request");
  }
  const { owner, level } = body;
  if (typeof owner !== "string" || !isSolanaAddress(owner) || (level !== 1 && level !== 2 && level !== 3)) {
    return fail(400, "invalid_request");
  }

  const programId = (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim();
  if (!programId) return fail(503, "not_configured");

  const cacheKey = `${owner}:${level}`;
  const cached = tutorState.signatures.get(cacheKey);
  if (cached) return NextResponse.json({ signature: cached });

  try {
    const signature = await findLevelSignature(owner, level, programId, {
      listSignatures,
      getTransaction: fetchTransaction,
    });
    if (!signature) return fail(404, "transaction_not_found");
    tutorState.signatures.set(cacheKey, signature, FACTS_CACHE_MS);
    return NextResponse.json({ signature });
  } catch (err) {
    console.warn("[tutor] find failed:", err instanceof Error ? err.message : "unknown");
    return fail(502, "rpc_failed");
  }
}
