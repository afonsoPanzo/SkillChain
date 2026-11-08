import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Blockhash,
} from "@solana/web3.js";
import { DEFAULT_LANG, isLang, makeT, type Lang } from "../../i18n/translate";
import { isSolanaAddress } from "../skillchain/address";
import { encodeNoArgs } from "../skillchain/codec";
import { shortAddress } from "../skillchain/format";
import { deriveAddress } from "../skillchain/pda";

/** Path of the action API, relative to the site. */
export const CHALLENGE_PATH = "/api/actions/challenge";

/** `?lang=pt` selects Portuguese; anything else is English. */
export function langFromParam(value: string | null): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/** The challenger's address, only if it is a valid Solana address. */
export function refFromParam(value: string | null): string | null {
  return value && isSolanaAddress(value) ? value : null;
}

export const MAX_NAME_LENGTH = 20;

/**
 * A display name typed into a link. It is plain text from the URL, so anyone
 * can write anything: keep only letters, digits, spaces and a few marks
 * (no dots or slashes, so a name cannot pass for a web address).
 */
export function sanitizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const clean = value
    .replace(/[^\p{L}\p{N} _'-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  return clean || null;
}

/** Who challenges: "Maria (GSyT…1uY6)", or just the name or the short address. */
export function challengerLabel(ref: string | null, name: string | null): string | null {
  if (name && ref) return `${name} (${shortAddress(ref)})`;
  if (name) return name;
  return ref ? shortAddress(ref) : null;
}

/** Metadata shown by a Blink client (ActionGetResponse). */
export function buildChallengeMetadata(
  origin: string,
  lang: Lang,
  ref: string | null,
  name: string | null = null,
) {
  const t = makeT(lang);
  const who = challengerLabel(ref, name);
  const query = new URLSearchParams();
  if (ref) query.set("ref", ref);
  if (name) query.set("name", name);
  if (lang !== DEFAULT_LANG) query.set("lang", lang);
  const queryString = query.toString();
  const href = queryString ? `${CHALLENGE_PATH}?${queryString}` : CHALLENGE_PATH;
  const label = t("blink.label");
  return {
    type: "action" as const,
    icon: `${origin}/blink.svg`,
    title: t("blink.title"),
    description: who ? t("blink.description.ref", { ref: who }) : t("blink.description"),
    label,
    links: { actions: [{ type: "transaction" as const, href, label }] },
  };
}

/**
 * The init_profile transaction for `account`: fee payer = account, recent
 * blockhash, no signatures. The wallet adds the player's signature.
 */
export async function buildInitProfileTransaction(
  account: string,
  programId: string,
  blockhash: string,
): Promise<string> {
  const program = new PublicKey(programId);
  const player = new PublicKey(account);
  const profile = await deriveAddress(program, "profile", player);
  const instruction = new TransactionInstruction({
    programId: program,
    keys: [
      { pubkey: player, isSigner: true, isWritable: true },
      { pubkey: profile, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeNoArgs("init_profile"),
  });
  const tx = new Transaction({
    feePayer: player,
    recentBlockhash: blockhash as Blockhash,
  }).add(instruction);
  const bytes = await tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  return Buffer.from(bytes).toString("base64");
}

/** The Devnet reads the POST needs. Injected so it can be tested. */
export interface ChallengeChain {
  /** True if the program already owns a profile account for `account`. */
  hasProfile(account: string, programId: string): Promise<boolean>;
  latestBlockhash(): Promise<string>;
}
