import { PublicKey } from "@solana/web3.js";
import { deriveAddress } from "../skillchain/pda";
import { getConnection } from "../skillchain/rpc";
import type { ChallengeChain } from "./challenge";

/** Devnet implementation of the reads the challenge action needs. */
export const devnetChain: ChallengeChain = {
  async hasProfile(account, programId) {
    const program = new PublicKey(programId);
    const profile = await deriveAddress(program, "profile", new PublicKey(account));
    const info = await getConnection().getAccountInfo(profile, "confirmed");
    return Boolean(info && info.owner.equals(program));
  },
  async latestBlockhash() {
    return (await getConnection().getLatestBlockhash("confirmed")).blockhash;
  },
};
