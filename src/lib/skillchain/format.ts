import { CLUSTER, LAMPORTS_PER_SOL } from "./constants";

export function shortAddress(address: string): string {
  return address.length > 9 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

/** 1_980_000_000 -> "1,98" (pt-PT, max 4 decimals). */
export function formatSol(lamports: bigint | number): string {
  const sol = Number(lamports) / LAMPORTS_PER_SOL;
  return sol.toLocaleString("pt-PT", { maximumFractionDigits: 4 });
}
