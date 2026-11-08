import { PublicKey } from "@solana/web3.js";

const encoder = new TextEncoder();

/** PDA of the program for `[prefix, owner]` (SDD section 4.1). */
export async function deriveAddress(
  programId: PublicKey,
  prefix: "profile" | "note",
  owner: PublicKey,
): Promise<PublicKey> {
  const [address] = await PublicKey.findProgramAddress(
    [encoder.encode(prefix), owner.toBytes()],
    programId,
  );
  return address;
}

/** Program ID from the environment, or null while it is not configured. */
export function getProgramId(): string | null {
  return (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim() || null;
}

/**
 * Base58 address of an account PDA for the configured program, or null when
 * there is no Program ID (mock mode: the accounts do not exist on-chain).
 */
export async function getAccountAddress(
  prefix: "profile" | "note",
  owner: string,
): Promise<string | null> {
  const programId = getProgramId();
  if (!programId) return null;
  return (await deriveAddress(new PublicKey(programId), prefix, new PublicKey(owner))).toBase58();
}
