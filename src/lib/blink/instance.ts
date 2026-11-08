import { createProgramBackend } from "../skillchain/program";
import type { SkillChainBackend } from "../skillchain/types";
import { loadRun } from "../speedrun/run";
import { devnetChain } from "./chain";
import { createChallengeHandlers } from "./handlers";

const programId = () => (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim();

let backend: SkillChainBackend | null = null;

/** The challenge action wired to Devnet, shared by every action route. */
export const challengeHandlers = createChallengeHandlers({
  chain: devnetChain,
  programId,
  async describeRun(owner) {
    const id = programId();
    if (!id) return null;
    backend ??= createProgramBackend(id);
    const run = await loadRun(backend, owner);
    return { status: run.status, level: run.level, durationSeconds: run.durationSeconds };
  },
});
