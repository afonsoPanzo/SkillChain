/**
 * Real SkillChainBackend: talks to the Anchor program on Devnet using the
 * hand-written codec (no @coral-xyz/anchor). Program ID comes from
 * NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID.
 */
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type AccountMeta,
} from "@solana/web3.js";
import {
  decodeNote,
  decodeProfile,
  encodeCompleteLevel3,
  encodeNoArgs,
  encodeU8Arg,
  profileFilters,
} from "./codec";
import { readRunInfo } from "../speedrun/chain-run";
import { SkillChainProgramError, describeTxError } from "./errors";
import { deriveAddress } from "./pda";
import { getConnection } from "./rpc";
import type { Note, Profile, RunInfo, SkillChainBackend, TxContext } from "./types";

export function createProgramBackend(programIdBase58: string): SkillChainBackend {
  const programId = new PublicKey(programIdBase58);

  const pda = (prefix: "profile" | "note", owner: PublicKey) =>
    deriveAddress(programId, prefix, owner);

  async function fetchAccount(address: PublicKey): Promise<Uint8Array | null> {
    const info = await getConnection().getAccountInfo(address, "confirmed");
    if (!info || !info.owner.equals(programId)) return null;
    return info.data;
  }

  async function send(ctx: TxContext, ix: TransactionInstruction): Promise<string> {
    const connection = getConnection();
    const payer = new PublicKey(ctx.owner);
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    const tx = new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(ix);

    // Resolves after the wallet signed and the transaction was submitted.
    const signature = await ctx.sendTransaction(tx, connection);
    ctx.onConfirming();

    const result = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (result.value.err) {
      throw new Error(`Transaction failed: ${describeTxError(result.value.err)}`);
    }
    return signature;
  }

  /** Accounts shared by every instruction that edits only the profile. */
  async function profileKeys(owner: string, writablePlayer: boolean) {
    const player = new PublicKey(owner);
    const profile = await pda("profile", player);
    const keys: AccountMeta[] = [
      { pubkey: player, isSigner: true, isWritable: writablePlayer },
      { pubkey: profile, isSigner: false, isWritable: true },
    ];
    return { player, profile, keys };
  }

  // A run's start and end never change once found, so they are read only once.
  const runCache = new Map<string, RunInfo>();

  const ix = (keys: AccountMeta[], data: Uint8Array) =>
    new TransactionInstruction({ programId, keys, data });

  return {
    isMock: false,

    async getProfile(owner): Promise<Profile | null> {
      const data = await fetchAccount(await pda("profile", new PublicKey(owner)));
      return data ? decodeProfile(data) : null;
    },

    async getNote(owner): Promise<Note | null> {
      const data = await fetchAccount(await pda("note", new PublicKey(owner)));
      return data ? decodeNote(data) : null;
    },

    async listProfiles(): Promise<Profile[]> {
      const accounts = await getConnection().getProgramAccounts(programId, {
        commitment: "confirmed",
        filters: profileFilters(),
      });
      return accounts.map(({ account }) => decodeProfile(account.data));
    },

    async getRunInfo(owner, includeEnd = true): Promise<RunInfo | null> {
      const cached = runCache.get(owner);
      if (cached && (!includeEnd || cached.endSignature)) return cached;
      const player = new PublicKey(owner);
      const info = await readRunInfo(
        getConnection(),
        programId,
        await pda("profile", player),
        await pda("note", player),
        includeEnd,
      );
      if (info && (!includeEnd || info.endSignature)) runCache.set(owner, info);
      return info;
    },

    async initProfile(ctx) {
      const { keys } = await profileKeys(ctx.owner, true);
      keys.push({ pubkey: SystemProgram.programId, isSigner: false, isWritable: false });
      return send(ctx, ix(keys, encodeNoArgs("init_profile")));
    },

    async completeLevel2(ctx, recipient) {
      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(recipient);
      } catch {
        throw new SkillChainProgramError("InvalidRecipient");
      }
      const { player, keys } = await profileKeys(ctx.owner, true);
      if (recipientKey.equals(player)) throw new SkillChainProgramError("InvalidRecipient");
      keys.push(
        { pubkey: recipientKey, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      );
      return send(ctx, ix(keys, encodeNoArgs("complete_level_2")));
    },

    async completeLevel3(ctx, message) {
      const data = encodeCompleteLevel3(message);
      const { player, keys } = await profileKeys(ctx.owner, true);
      keys.push(
        { pubkey: await pda("note", player), isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      );
      return send(ctx, ix(keys, data));
    },

    async buyItem(ctx, itemId) {
      const { keys } = await profileKeys(ctx.owner, false);
      return send(ctx, ix(keys, encodeU8Arg("buy_item", itemId)));
    },

    async equipItem(ctx, itemId) {
      const { keys } = await profileKeys(ctx.owner, false);
      return send(ctx, ix(keys, encodeU8Arg("equip_item", itemId)));
    },

    async unequipItem(ctx, slot) {
      const { keys } = await profileKeys(ctx.owner, false);
      return send(ctx, ix(keys, encodeU8Arg("unequip_item", slot)));
    },
  };
}
