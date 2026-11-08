import { challengeHandlers } from "@/lib/blink/instance";

export const runtime = "nodejs";
// The metadata depends on query parameters and the chain: never cache.
export const dynamic = "force-dynamic";

export const GET = (request: Request) => challengeHandlers.GET(request);
export const POST = (request: Request) => challengeHandlers.POST(request);
export const OPTIONS = challengeHandlers.OPTIONS;
