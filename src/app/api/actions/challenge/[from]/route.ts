import { challengeHandlers } from "@/lib/blink/instance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ from: string }> };

/** The action behind a shared /challenge/<address> link (see actions.json). */
export async function GET(request: Request, { params }: Context) {
  return challengeHandlers.GET(request, (await params).from);
}

export async function POST(request: Request, { params }: Context) {
  return challengeHandlers.POST(request, (await params).from);
}

export const OPTIONS = challengeHandlers.OPTIONS;
