/**
 * Hand-written Borsh codec for the SkillChain program (no Anchor client).
 * Layouts follow anchor/programs/skillchain/src/lib.rs and src/idl/skillchain.json:
 * little-endian integers, no padding, 8-byte Anchor discriminator first.
 *
 * Imports are relative (no "@/") so the unit tests can load this file directly.
 */
import { PublicKey } from "@solana/web3.js";
import idl from "../../idl/skillchain.json";
import { MAX_NOTE_LENGTH } from "./constants";
import { SkillChainProgramError } from "./errors";
import type { Note, Profile } from "./types";

export const PROFILE_SIZE = 62; // 8 + 32 + 1 + 8 + 8 + 1 + 1 + 1 + 1 + 1
export const DISCRIMINATOR_LENGTH = 8;

function discriminatorOf(
  list: { name: string; discriminator: number[] }[],
  name: string,
): Uint8Array {
  const found = list.find((entry) => entry.name === name);
  if (!found) throw new Error(`IDL has no entry "${name}"`);
  return Uint8Array.from(found.discriminator);
}

export const PROFILE_DISCRIMINATOR = discriminatorOf(idl.accounts, "Profile");
export const NOTE_DISCRIMINATOR = discriminatorOf(idl.accounts, "Note");

export type InstructionName =
  | "init_profile"
  | "complete_level_2"
  | "complete_level_3"
  | "buy_item"
  | "equip_item"
  | "unequip_item";

export function instructionDiscriminator(name: InstructionName): Uint8Array {
  return discriminatorOf(idl.instructions, name);
}

function startsWith(data: Uint8Array, prefix: Uint8Array): boolean {
  if (data.length < prefix.length) return false;
  return prefix.every((byte, i) => data[i] === byte);
}

function view(data: Uint8Array): DataView {
  return new DataView(data.buffer, data.byteOffset, data.byteLength);
}

/** Decodes a Profile account. Throws if the discriminator or size is wrong. */
export function decodeProfile(data: Uint8Array): Profile {
  if (!startsWith(data, PROFILE_DISCRIMINATOR)) {
    throw new Error("Account is not a SkillChain Profile (bad discriminator).");
  }
  if (data.length < PROFILE_SIZE) {
    throw new Error(`Profile account too short: ${data.length} bytes.`);
  }
  const dv = view(data);
  let o = DISCRIMINATOR_LENGTH;
  const owner = new PublicKey(data.slice(o, o + 32)).toBase58();
  o += 32;
  const level = data[o++];
  const points = Number(dv.getBigUint64(o, true));
  o += 8;
  const totalEarned = Number(dv.getBigUint64(o, true));
  o += 8;
  const items = data[o++];
  const equippedFrame = data[o++];
  const equippedAccessory = data[o++];
  const equippedTitle = data[o++];
  return {
    owner,
    level,
    points,
    totalEarned,
    items,
    equippedFrame,
    equippedAccessory,
    equippedTitle,
  };
}

/** Decodes a Note account. The string is read by its length prefix, not to the end of the buffer. */
export function decodeNote(data: Uint8Array): Note {
  if (!startsWith(data, NOTE_DISCRIMINATOR)) {
    throw new Error("Account is not a SkillChain Note (bad discriminator).");
  }
  const dv = view(data);
  let o = DISCRIMINATOR_LENGTH;
  if (data.length < o + 32 + 4) throw new Error("Note account too short.");
  const owner = new PublicKey(data.slice(o, o + 32)).toBase58();
  o += 32;
  const length = dv.getUint32(o, true);
  o += 4;
  if (o + length + 8 + 1 > data.length) {
    throw new Error("Note account has an invalid message length.");
  }
  const message = new TextDecoder("utf-8", { fatal: true }).decode(
    data.slice(o, o + length),
  );
  o += length;
  const createdAt = Number(dv.getBigInt64(o, true));
  return { owner, message, createdAt };
}

// ---------- Instruction data ----------

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Instruction with no arguments: just the discriminator. */
export function encodeNoArgs(name: InstructionName): Uint8Array {
  return instructionDiscriminator(name);
}

/** Instruction with a single u8 argument (item_id, slot). */
export function encodeU8Arg(name: InstructionName, value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`u8 out of range: ${value}`);
  }
  return concat(instructionDiscriminator(name), Uint8Array.of(value));
}

/**
 * complete_level_3(message: String): discriminator + u32 LE byte length + UTF-8.
 * The program limits the message to 1..100 bytes, so it is checked here too.
 */
export function encodeCompleteLevel3(message: string): Uint8Array {
  const text = new TextEncoder().encode(message);
  if (text.length === 0 || text.length > MAX_NOTE_LENGTH) {
    throw new SkillChainProgramError("MessageTooLong");
  }
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, text.length, true);
  return concat(instructionDiscriminator("complete_level_3"), length, text);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** Filters for the leaderboard query: only Profile accounts of this program. */
export function profileFilters() {
  return [
    { dataSize: PROFILE_SIZE },
    {
      memcmp: {
        offset: 0,
        bytes: toBase64(PROFILE_DISCRIMINATOR),
        encoding: "base64" as const,
      },
    },
  ];
}
