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
  initProfile(ctx: TxContext): Promise<string>;
  completeLevel2(ctx: TxContext, recipient: string): Promise<string>;
  completeLevel3(ctx: TxContext, message: string): Promise<string>;
  buyItem(ctx: TxContext, itemId: number): Promise<string>;
  equipItem(ctx: TxContext, itemId: number): Promise<string>;
  unequipItem(ctx: TxContext, slot: number): Promise<string>;
}
