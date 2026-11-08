import type { Connection, PublicKey } from "@solana/web3.js";
import type { RunInfo } from "../skillchain/types";

const PAGE = 1000;
const MAX_PAGES = 20;
/** Anyone can send SOL to a PDA before it exists, so only the oldest few are checked. */
const MAX_CANDIDATES = 5;

export interface FoundSignature {
  signature: string;
  blockTime: number;
}

/**
 * Oldest successful transaction on `address` whose logs show `instruction`
 * (for example "InitProfile"). Checking the logs keeps a stray transfer to the
 * address from being taken for the start of the run.
 */
export async function oldestInstructionSignature(
  connection: Connection,
  address: PublicKey,
  programId: PublicKey,
  instruction: string,
): Promise<FoundSignature | null> {
  type Entry = Awaited<ReturnType<Connection["getSignaturesForAddress"]>>[number];
  const successful: Entry[] = [];
  let before: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await connection.getSignaturesForAddress(
      address,
      { limit: PAGE, before },
      "confirmed",
    );
    successful.push(...batch.filter((entry) => !entry.err));
    if (batch.length < PAGE) break;
    before = batch[batch.length - 1].signature;
  }

  // Newest first from the RPC: walk from the oldest end.
  for (const entry of successful.reverse().slice(0, MAX_CANDIDATES)) {
    const tx = await connection.getTransaction(entry.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    const logs = tx?.meta?.logMessages ?? [];
    const calledProgram = logs.some((line) => line.startsWith(`Program ${programId.toBase58()} invoke`));
    if (!calledProgram || !logs.some((line) => line.endsWith(`Instruction: ${instruction}`))) continue;
    const blockTime =
      entry.blockTime ?? tx?.blockTime ?? (await connection.getBlockTime(entry.slot));
    if (blockTime === null || blockTime === undefined) return null;
    return { signature: entry.signature, blockTime: Number(blockTime) };
  }
  return null;
}

/** Start and end transactions of a run. Start and end are final once found, so callers can cache them. */
export async function readRunInfo(
  connection: Connection,
  programId: PublicKey,
  profile: PublicKey,
  note: PublicKey,
  includeEnd: boolean,
): Promise<RunInfo | null> {
  const start = await oldestInstructionSignature(connection, profile, programId, "InitProfile");
  if (!start) return null;
  const end = includeEnd
    ? await oldestInstructionSignature(connection, note, programId, "CompleteLevel3")
    : null;
  return {
    startTime: start.blockTime,
    startSignature: start.signature,
    endSignature: end?.signature ?? null,
  };
}
