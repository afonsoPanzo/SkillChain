import { formatNumberFor, type Lang } from "../../i18n/translate";
import { CLUSTER, LAMPORTS_PER_SOL } from "./constants";

export function shortAddress(address: string): string {
  return address.length > 9 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${CLUSTER}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${CLUSTER}`;
}

/** 1_980_000_000 -> "1.98" in English and "1,98" in Portuguese (max 4 decimals). */
export function formatSol(lamports: bigint | number, lang: Lang): string {
  return formatNumberFor(lang, Number(lamports) / LAMPORTS_PER_SOL, 4);
}
