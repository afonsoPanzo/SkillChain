import { actionPreflight, actionResponse } from "@/lib/blink/headers";

/** Maps the site's /challenge link to the action API (Solana Actions `actions.json`). */
export function GET() {
  return actionResponse({
    rules: [
      { pathPattern: "/challenge", apiPath: "/api/actions/challenge" },
      // Idempotent rule: action URLs map to themselves.
      { pathPattern: "/api/actions/**", apiPath: "/api/actions/**" },
    ],
  });
}

export const OPTIONS = actionPreflight;
