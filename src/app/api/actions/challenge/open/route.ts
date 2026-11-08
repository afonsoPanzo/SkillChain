import { challengeHandlers } from "@/lib/blink/instance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Blink "external-link" step: returns the challenge page for the friend to open. */
export const POST = (request: Request) => challengeHandlers.OPEN(request);
export const OPTIONS = challengeHandlers.OPTIONS;
