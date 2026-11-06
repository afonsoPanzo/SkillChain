import { mockBackend } from "./mock-backend";
import type { SkillChainBackend } from "./types";

/**
 * The active data layer. Right now it is the in-memory mock.
 *
 * When the IDL (src/idl/skillchain.json) and NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID
 * are available, implement SkillChainBackend against the program and export it
 * here instead. Hooks and components stay untouched.
 */
export const backend: SkillChainBackend = mockBackend;
