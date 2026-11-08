/**
 * Headers required by the Solana Actions specification (v2.x), as the official
 * @solana/actions SDK sets them. They go on every response of an action route
 * and of /actions.json, and nowhere else.
 */

/** CAIP-2 id of Solana Devnet. */
export const DEVNET_BLOCKCHAIN_ID = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1";

export const ACTION_VERSION = "2.4";

export const ACTION_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Accept-Action-Version, X-Accept-Blockchain-Ids",
  "Access-Control-Expose-Headers": "X-Action-Version, X-Blockchain-Ids",
  "Content-Type": "application/json",
  "X-Action-Version": ACTION_VERSION,
  "X-Blockchain-Ids": DEVNET_BLOCKCHAIN_ID,
};

export function actionResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: ACTION_HEADERS });
}

/** OPTIONS answers with the same headers as GET, with no body. */
export function actionPreflight(): Response {
  return new Response(null, { status: 204, headers: ACTION_HEADERS });
}

/** Error body of the specification: `{ message }`. */
export function actionError(message: string, status: number): Response {
  return actionResponse({ message }, status);
}
