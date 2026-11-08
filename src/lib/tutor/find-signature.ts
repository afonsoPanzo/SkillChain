import { PublicKey } from "@solana/web3.js";
import { deriveAddress } from "../skillchain/pda";
import { extractFacts, type RawTransaction } from "./facts";

/** What the search needs from the network. Injected so it can be tested. */
export interface SignatureSource {
  /** Successful signatures that touched `address`, newest first. */
  listSignatures(address: string): Promise<string[]>;
  getTransaction(signature: string): Promise<RawTransaction | null>;
}

/** Profile transactions include shop actions, so only the oldest few can be level completions. */
const MAX_CANDIDATES = 30;

/**
 * Finds the transaction that completed `level` for `owner`: init_profile
 * (level 1) and complete_level_2 touch the profile PDA, complete_level_3
 * creates the note PDA. Every candidate is checked against the program's
 * own instruction, so only a real level transaction is returned.
 */
export async function findLevelSignature(
  owner: string,
  level: 1 | 2 | 3,
  programId: string,
  source: SignatureSource,
): Promise<string | null> {
  const program = new PublicKey(programId);
  const account = await deriveAddress(program, level === 3 ? "note" : "profile", new PublicKey(owner));
  const oldestFirst = (await source.listSignatures(account.toBase58())).slice().reverse();

  for (const signature of oldestFirst.slice(0, MAX_CANDIDATES)) {
    const tx = await source.getTransaction(signature);
    if (!tx) continue;
    try {
      const facts = extractFacts(signature, tx, programId);
      if (facts.level === level && facts.success && facts.signer === owner) return signature;
    } catch {
      // Not a level instruction (a shop action, for example): try the next one.
    }
  }
  return null;
}
