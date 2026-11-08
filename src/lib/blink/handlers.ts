import { makeT } from "../../i18n/translate";
import { isSolanaAddress } from "../skillchain/address";
import { RateLimiter, clientIp } from "../tutor/limits";
import {
  buildChallengeMetadata,
  buildInitProfileTransaction,
  langFromParam,
  refFromParam,
  sanitizeName,
  type ChallengeChain,
} from "./challenge";
import { actionError, actionPreflight, actionResponse } from "./headers";

const MAX_BODY_BYTES = 1024;

export interface ChallengeDeps {
  chain: ChallengeChain;
  /** Program ID, or an empty string while it is not configured. */
  programId: () => string;
  limiter?: RateLimiter;
}

/** GET, POST and OPTIONS of the challenge action, with injectable dependencies. */
export function createChallengeHandlers({
  chain,
  programId,
  limiter = new RateLimiter(20),
}: ChallengeDeps) {
  return {
    GET(request: Request): Response {
      const url = new URL(request.url);
      const lang = langFromParam(url.searchParams.get("lang"));
      const ref = refFromParam(url.searchParams.get("ref"));
      const name = sanitizeName(url.searchParams.get("name"));
      return actionResponse(buildChallengeMetadata(url.origin, lang, ref, name));
    },

    OPTIONS(): Response {
      return actionPreflight();
    },

    async POST(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const t = makeT(langFromParam(url.searchParams.get("lang")));

      if (!limiter.allow(clientIp(request.headers))) return actionError(t("blink.err.rate"), 429);

      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
        return actionError(t("blink.err.badRequest"), 413);
      }
      let account: unknown;
      try {
        account = (JSON.parse(raw) as { account?: unknown }).account;
      } catch {
        return actionError(t("blink.err.badRequest"), 400);
      }
      if (typeof account !== "string" || !isSolanaAddress(account)) {
        return actionError(t("blink.err.invalidAccount"), 400);
      }

      const program = programId();
      if (!program) return actionError(t("blink.err.notConfigured"), 503);

      try {
        if (await chain.hasProfile(account, program)) {
          return actionError(t("blink.err.hasProfile"), 400);
        }
        const blockhash = await chain.latestBlockhash();
        const transaction = await buildInitProfileTransaction(account, program, blockhash);
        return actionResponse({ type: "transaction", transaction, message: t("blink.message") });
      } catch (err) {
        console.warn("[blink] failed:", err instanceof Error ? err.message : "unknown");
        return actionError(t("blink.err.rpc"), 502);
      }
    },
  };
}
