import { PublicKey } from "@solana/web3.js";

/** A Solana address: base58, 32 bytes. */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isSolanaAddress(value: string): boolean {
  if (!BASE58.test(value)) return false;
  try {
    return new PublicKey(value).toBytes().length === 32;
  } catch {
    return false;
  }
}

/**
 * Address of a profile page. In demo mode the simulated players have
 * made-up addresses, so only the base58 shape is checked.
 */
export function isProfileAddress(value: string, demo: boolean): boolean {
  return demo ? BASE58.test(value) : isSolanaAddress(value);
}
