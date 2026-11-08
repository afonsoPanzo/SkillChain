import { actionPreflight, actionResponse } from "@/lib/blink/headers";

/** Maps the shared /challenge/<address> links to the action API (Solana Actions `actions.json`). */
export function GET() {
  return actionResponse({
    rules: [
      { pathPattern: "/challenge/*", apiPath: "/api/actions/challenge/*" },
      { pathPattern: "/challenge", apiPath: "/api/actions/challenge" },
      // Idempotent rule: action URLs map to themselves.
      { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
    ],
  });
}

export const OPTIONS = actionPreflight;
