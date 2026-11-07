/**
 * Maps program and wallet errors to translated messages (SDD section 4.3).
 * Anchor custom errors start at 6000, in declaration order.
 */
import type { TFunction } from "../../i18n/translate";


/** Program error names, in declaration order: code = 6000 + index. Messages live in src/i18n. */
export const PROGRAM_ERRORS = [
  "WrongLevel",
  "InvalidRecipient",
  "MessageTooLong",
  "UnknownItem",
  "AlreadyOwned",
  "LevelTooLow",
  "NotEnoughPoints",
  "NotOwned",
  "Unauthorized",
  "InvalidSlot",
  "Overflow",
] as const;

export type ProgramErrorName = (typeof PROGRAM_ERRORS)[number];

export const ANCHOR_ERROR_OFFSET = 6000;


/** Thrown by the mock backend to mimic an on-chain error. */
export class SkillChainProgramError extends Error {
  readonly code: ProgramErrorName;
  constructor(code: ProgramErrorName) {
    super(`Error Code: ${code}`);
    this.name = "SkillChainProgramError";
    this.code = code;
  }
}

function messageChain(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 5 && current != null; i++) {
    if (current instanceof Error) {
      parts.push(current.message);
      const logs = (current as { logs?: unknown }).logs;
      if (Array.isArray(logs)) parts.push(logs.join("\n"));
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join("\n");
}

/**
 * Finds the custom program error code (6000 and up) in an error or its logs:
 * "custom program error: 0x1771", {"InstructionError":[0,{"Custom":6001}]},
 * or "Error Number: 6001".
 */
export function extractCustomCode(text: string): number | null {
  const hex = /custom program error: 0x([0-9a-f]+)/i.exec(text);
  if (hex) return parseInt(hex[1], 16);
  const json = /"?Custom"?\s*:\s*(\d+)/.exec(text);
  if (json) return Number(json[1]);
  const logged = /Error Number:\s*(\d+)/.exec(text);
  if (logged) return Number(logged[1]);
  return null;
}

/** Serialises a transaction error from the RPC (may contain bigint). */
export function describeTxError(err: unknown): string {
  return JSON.stringify(err, (_key, value) =>
    typeof value === "bigint" ? Number(value) : value,
  );
}

/** Turns any wallet, RPC or program error into a message for the player. */
export function toUserMessage(err: unknown, t: TFunction): string {
  const text = messageChain(err);

  if (/user (?:rejected|declined|denied)|rejected (?:by|the)|request was rejected/i.test(text)) {
    return t("error.cancelled");
  }

  const code = extractCustomCode(text);
  if (code !== null) {
    const name = PROGRAM_ERRORS[code - ANCHOR_ERROR_OFFSET];
    if (name) return t(`error.${name}`);
  }

  for (const name of PROGRAM_ERRORS) {
    if (new RegExp(`\\b${name}\\b`).test(text)) return t(`error.${name}`);
  }

  if (/AccountOwnedByWrongProgram|owned by a different program/i.test(text)) {
    return t("error.wrongProgram");
  }
  if (/already in use/i.test(text)) return t("error.alreadyInUse");
  if (/insufficient (?:funds|lamports)|attempt to debit an account/i.test(text)) {
    return t("error.insufficientFunds");
  }
  if (/blockhash not found|block height exceeded|expired/i.test(text)) {
    return t("error.expired");
  }

  return t("error.generic");
}
