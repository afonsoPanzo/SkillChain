import { Connection } from "@solana/web3.js";

/** SkillChain runs on Devnet only. */
export const DEVNET_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

let connection: Connection | null = null;

/** Shared read-only connection for the data layer. */
export function getConnection(): Connection {
  connection ??= new Connection(DEVNET_RPC, "confirmed");
  return connection;
}
