import idl from "../../idl/skillchain.json";
import { base58Decode, base58Encode } from "./base58";

/** The parts of a `getTransaction` (jsonParsed) result that the tutor reads. */
export interface RawInstruction {
  programId: string;
  accounts?: string[];
  data?: string;
  program?: string;
  parsed?: { type: string; info: Record<string, unknown> };
}

export interface RawTransaction {
  slot?: number;
  meta: {
    err: unknown;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    logMessages?: string[] | null;
    innerInstructions?: { index: number; instructions: RawInstruction[] }[] | null;
  } | null;
  transaction: {
    message: {
      accountKeys: { pubkey: string; signer: boolean; writable: boolean }[];
      instructions: RawInstruction[];
    };
  };
}

export type InstructionName = "init_profile" | "complete_level_2" | "complete_level_3";

const LEVEL_OF: Record<InstructionName, 1 | 2 | 3> = {
  init_profile: 1,
  complete_level_2: 2,
  complete_level_3: 3,
};

/** Role of each account, from the account names in the IDL. */
const ROLE_OF: Record<string, AccountRole> = {
  player: "player",
  profile: "profile_pda",
  recipient: "recipient",
  note: "note_pda",
  system_program: "system_program",
};

export type AccountRole =
  | "player"
  | "profile_pda"
  | "recipient"
  | "note_pda"
  | "system_program"
  | "skillchain_program";

export interface AccountFact {
  address: string;
  role: AccountRole;
  signer: boolean;
  writable: boolean;
  /** Post minus pre balance, in lamports. */
  balanceChangeLamports: number;
}

export interface TxFacts {
  signature: string;
  success: boolean;
  error: string | null;
  feeLamports: number;
  signer: string;
  programId: string;
  level: 1 | 2 | 3;
  instruction: InstructionName;
  /** Level 3 only: the note the player wrote (user text, untrusted). */
  message: string | null;
  accounts: AccountFact[];
  createdAccounts: { address: string; role: AccountRole | null; rentLamports: number; space: number }[];
  transfers: { from: string; to: string; lamports: number }[];
  events: { name: "LevelCompleted"; player: string; level: number; points: number }[];
  logs: string[];
}

export class NotSkillChainTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotSkillChainTransactionError";
  }
}

const INSTRUCTIONS = idl.instructions.map((ix) => ({
  name: ix.name,
  discriminator: Uint8Array.from(ix.discriminator),
  accounts: ix.accounts.map((a) => a.name),
}));

const LEVEL_COMPLETED = Uint8Array.from(
  idl.events.find((e) => e.name === "LevelCompleted")!.discriminator,
);

function startsWith(data: Uint8Array, prefix: Uint8Array): boolean {
  return data.length >= prefix.length && prefix.every((b, i) => data[i] === b);
}

function readU64(data: Uint8Array, offset: number): number {
  return Number(new DataView(data.buffer, data.byteOffset).getBigUint64(offset, true));
}

function base64Decode(value: string): Uint8Array | null {
  try {
    return Uint8Array.from(Buffer.from(value, "base64"));
  } catch {
    return null;
  }
}

function decodeMessage(data: Uint8Array): string | null {
  if (data.length < 12) return null;
  const length = new DataView(data.buffer, data.byteOffset).getUint32(8, true);
  if (length < 1 || length > 100 || data.length < 12 + length) return null;
  return new TextDecoder().decode(data.slice(12, 12 + length));
}

function decodeLevelCompleted(data: Uint8Array, toBase58: (bytes: Uint8Array) => string) {
  // discriminator 8 + player 32 + level 1 + points 8
  if (data.length < 49 || !startsWith(data, LEVEL_COMPLETED)) return null;
  return {
    name: "LevelCompleted" as const,
    player: toBase58(data.slice(8, 40)),
    level: data[40],
    points: readU64(data, 41),
  };
}

function relevantLogs(logs: string[], programId: string): string[] {
  return logs
    .filter(
      (line) =>
        line.startsWith("Program log:") ||
        (line.startsWith(`Program ${programId} `) && /invoke|success|failed|consumed/.test(line)),
    )
    .slice(0, 12)
    .map((line) => line.slice(0, 200));
}

/**
 * Reduces a Devnet transaction to verified facts. Throws
 * NotSkillChainTransactionError if it is not a SkillChain level instruction.
 */
export function extractFacts(
  signature: string,
  tx: RawTransaction,
  programId: string,
): TxFacts {
  if (!tx.meta) throw new NotSkillChainTransactionError("Transaction has no metadata");
  const { meta } = tx;
  const keys = tx.transaction.message.accountKeys;

  let matched: { ix: RawInstruction; def: (typeof INSTRUCTIONS)[number] } | null = null;
  let touchesProgram = false;
  for (const ix of tx.transaction.message.instructions) {
    if (ix.programId !== programId) continue;
    touchesProgram = true;
    const data = ix.data ? base58Decode(ix.data) : null;
    const def = data && INSTRUCTIONS.find((d) => startsWith(data, d.discriminator));
    if (def && def.name in LEVEL_OF) {
      matched = { ix, def };
      break;
    }
  }
  if (!matched) {
    throw new NotSkillChainTransactionError(
      touchesProgram
        ? "Not a level instruction of the SkillChain program"
        : "Transaction does not call the SkillChain program",
    );
  }

  const { ix, def } = matched;
  const name = def.name as InstructionName;
  const data = base58Decode(ix.data!)!;
  const indexOf = new Map(keys.map((k, i) => [k.pubkey, i]));
  const roleByAddress = new Map<string, AccountRole>();

  const accounts: AccountFact[] = (ix.accounts ?? []).map((address, i) => {
    const role = ROLE_OF[def.accounts[i]] ?? "system_program";
    roleByAddress.set(address, role);
    const index = indexOf.get(address) ?? -1;
    const key = keys[index];
    return {
      address,
      role,
      signer: key?.signer ?? false,
      writable: key?.writable ?? false,
      balanceChangeLamports:
        index >= 0 ? (meta.postBalances[index] ?? 0) - (meta.preBalances[index] ?? 0) : 0,
    };
  });
  accounts.push({
    address: programId,
    role: "skillchain_program",
    signer: false,
    writable: false,
    balanceChangeLamports: 0,
  });

  const signer = keys.find((k) => k.signer)?.pubkey ?? accounts.find((a) => a.role === "player")?.address ?? "";

  const createdAccounts: TxFacts["createdAccounts"] = [];
  const transfers: TxFacts["transfers"] = [];
  const topIndex = tx.transaction.message.instructions.indexOf(ix);
  for (const inner of meta.innerInstructions ?? []) {
    if (inner.index !== topIndex) continue;
    for (const sub of inner.instructions) {
      const info = sub.parsed?.info;
      if (!info || sub.program !== "system") continue;
      if (sub.parsed?.type === "createAccount") {
        const address = String(info.newAccount);
        createdAccounts.push({
          address,
          role: roleByAddress.get(address) ?? null,
          rentLamports: Number(info.lamports),
          space: Number(info.space),
        });
      } else if (sub.parsed?.type === "transfer") {
        transfers.push({
          from: String(info.source),
          to: String(info.destination),
          lamports: Number(info.lamports),
        });
      }
    }
  }

  const logs = meta.logMessages ?? [];
  const events: TxFacts["events"] = [];
  for (const line of logs) {
    if (!line.startsWith("Program data: ")) continue;
    const bytes = base64Decode(line.slice("Program data: ".length));
    const event = bytes && decodeLevelCompleted(bytes, base58Encode);
    if (event) events.push(event);
  }

  return {
    signature,
    success: meta.err === null || meta.err === undefined,
    error: meta.err ? JSON.stringify(meta.err).slice(0, 200) : null,
    feeLamports: meta.fee,
    signer,
    programId,
    level: LEVEL_OF[name],
    instruction: name,
    message: name === "complete_level_3" ? decodeMessage(data) : null,
    accounts,
    createdAccounts,
    transfers,
    events,
    logs: relevantLogs(logs, programId),
  };
}
