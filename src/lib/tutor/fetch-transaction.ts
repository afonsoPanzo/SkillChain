import { DEVNET_RPC } from "../skillchain/rpc";
import type { RawTransaction } from "./facts";

const ATTEMPTS = 4;
const RETRY_MS = 900;

/**
 * Reads a confirmed transaction from Devnet. The RPC node the server asks may
 * be a moment behind the one the wallet used, so a missing result is retried.
 */
export async function fetchTransaction(signature: string): Promise<RawTransaction | null> {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const response = await fetch(DEVNET_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [
          signature,
          { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`RPC error ${response.status}`);
    const json = (await response.json()) as { result?: RawTransaction | null; error?: unknown };
    if (json.error) throw new Error("RPC returned an error");
    if (json.result) return json.result;
    if (attempt < ATTEMPTS - 1) await new Promise((r) => setTimeout(r, RETRY_MS));
  }
  return null;
}
