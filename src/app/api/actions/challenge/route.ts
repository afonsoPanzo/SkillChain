import { devnetChain } from "@/lib/blink/chain";
import { createChallengeHandlers } from "@/lib/blink/handlers";

export const runtime = "nodejs";
// The metadata depends on query parameters and the POST reads the chain: never cache.
export const dynamic = "force-dynamic";

const handlers = createChallengeHandlers({
  chain: devnetChain,
  programId: () => (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim(),
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const OPTIONS = handlers.OPTIONS;
