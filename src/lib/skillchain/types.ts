import type { Connection, Transaction } from "@solana/web3.js";

export interface Profile {
  /** Wallet address (base58) of the player. */
  owner: string;
  /** Last completed level, 1 to 3. A player without profile is level 0. */
  level: number;
  points: number;
  totalEarned: number;
  /** Bitmask of purchased items (bit = item id). */
  items: number;
  equippedFrame: number;
  equippedAccessory: number;
  equippedTitle: number;
}

export interface Note {
  owner: string;
  message: string;
  createdAt: number;
}

/**
 * When and with which transactions a wallet's run began and ended, read from
 * the blockchain. The end time itself is the note's created_at.
 */
export interface RunInfo {
  /** Unix seconds of the first successful init_profile transaction. */
  startTime: number;
  startSignature: string;
  /** Signature of the complete_level_3 transaction, once the note exists. */
  endSignature: string | null;
}

export type TxPhase = "signing" | "confirming";

export type TxState =
  | { status: "idle" }
  | { status: TxPhase }
  | { status: "confirmed"; signature: string }
  | { status: "error"; message: string };

/** Passed to every mutation so the backend can report progress. */
export interface TxContext {
  /** Connected wallet address (base58). */
  owner: string;
  /** Asks the wallet to sign and send; resolves with the signature. Unused by the mock. */
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
  ) => Promise<string>;
  /** Call once the wallet has signed and the transaction is being confirmed. */
  onConfirming: () => void;
}

/**
 * Everything the UI needs from the program. The mock and the real Anchor
 * implementation both satisfy this interface, so components never change.
 */
export interface SkillChainBackend {
  readonly isMock: boolean;
  getProfile(owner: string): Promise<Profile | null>;
  getNote(owner: string): Promise<Note | null>;
  listProfiles(): Promise<Profile[]>;
  /** Start (and optionally end) transaction of a wallet's run, or null if it has no profile. */
  getRunInfo(owner: string, includeEnd?: boolean): Promise<RunInfo | null>;
  initProfile(ctx: TxContext): Promise<string>;
  completeLevel2(ctx: TxContext, recipient: string): Promise<string>;
  completeLevel3(ctx: TxContext, message: string): Promise<string>;
  buyItem(ctx: TxContext, itemId: number): Promise<string>;
  equipItem(ctx: TxContext, itemId: number): Promise<string>;
  unequipItem(ctx: TxContext, slot: number): Promise<string>;
}
