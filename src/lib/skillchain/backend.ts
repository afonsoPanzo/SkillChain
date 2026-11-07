import { mockBackend } from "./mock-backend";
import { createProgramBackend } from "./program";
import type { SkillChainBackend } from "./types";

const PROGRAM_ID = (process.env.NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID ?? "").trim();
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** The mock is used if NEXT_PUBLIC_USE_MOCK=true or there is no Program ID. */
export const USE_MOCK = FORCE_MOCK || PROGRAM_ID === "";

export const backend: SkillChainBackend = USE_MOCK
  ? mockBackend
  : createProgramBackend(PROGRAM_ID);
