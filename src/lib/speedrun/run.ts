import type { Note, Profile, RunInfo, SkillChainBackend } from "../skillchain/types";

/** Players who finish all levels this many at most are timed for the speedrun board. */
export const MAX_BOARD_PLAYERS = 30;
export const BOARD_SIZE = 10;

export type RunStatus = "none" | "running" | "finished";

/** The speedrun of one wallet, read from the blockchain. */
export interface RunResult {
  owner: string;
  status: RunStatus;
  profile: Profile | null;
  /** Current level while running; 3 when finished. */
  level: number;
  /** Seconds between the profile creation and the level 3 note, once finished. */
  durationSeconds: number | null;
  startTime: number | null;
  endTime: number | null;
  startSignature: string | null;
  endSignature: string | null;
}

/**
 * Seconds from the profile's first transaction to the note's `created_at`.
 * Both come from the validators' clock, so a tiny negative gap is clamped to 0.
 * Returns null while either end is unknown.
 */
export function computeDuration(startTime: number | null, endTime: number | null): number | null {
  if (startTime === null || endTime === null) return null;
  return Math.max(0, Math.round(endTime - startTime));
}

/**
 * Combines the on-chain pieces into a run. With no note the player is still
 * running; with no profile they have not started.
 */
export function buildRunResult(
  owner: string,
  profile: Profile | null,
  note: Note | null,
  info: RunInfo | null,
): RunResult {
  if (!profile) {
    return {
      owner,
      status: "none",
      profile: null,
      level: 0,
      durationSeconds: null,
      startTime: null,
      endTime: null,
      startSignature: null,
      endSignature: null,
    };
  }
  const startTime = info?.startTime ?? null;
  const endTime = note ? note.createdAt : null;
  return {
    owner,
    status: note ? "finished" : "running",
    profile,
    level: profile.level,
    durationSeconds: computeDuration(startTime, endTime),
    startTime,
    endTime,
    startSignature: info?.startSignature ?? null,
    endSignature: info?.endSignature ?? null,
  };
}

/** Reads a wallet's run through any backend (real, mock or demo). */
export async function loadRun(
  backend: SkillChainBackend,
  owner: string,
  includeEnd = true,
): Promise<RunResult> {
  const [profile, note] = await Promise.all([backend.getProfile(owner), backend.getNote(owner)]);
  const info = profile ? await backend.getRunInfo(owner, includeEnd && Boolean(note)) : null;
  return buildRunResult(owner, profile, note, info);
}

export type DuelWinner = "first" | "second" | "tie";

/** The winner of a duel, or null until both players have a finished, timed run. */
export function duelWinner(first: RunResult, second: RunResult): DuelWinner | null {
  if (first.durationSeconds === null || second.durationSeconds === null) return null;
  if (first.status !== "finished" || second.status !== "finished") return null;
  if (first.durationSeconds === second.durationSeconds) return "tie";
  return first.durationSeconds < second.durationSeconds ? "first" : "second";
}

/** Fastest finished runs first. Ties keep a stable order by address. */
export function sortSpeedrun(runs: RunResult[], limit = BOARD_SIZE): RunResult[] {
  return runs
    .filter((run) => run.status === "finished" && run.durationSeconds !== null)
    .sort(
      (a, b) =>
        (a.durationSeconds as number) - (b.durationSeconds as number) ||
        a.owner.localeCompare(b.owner),
    )
    .slice(0, limit);
}

/** "42s", "6m 42s", or "1h 03m" once it takes an hour or more. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(rest).padStart(2, "0")}s`;
  return `${rest}s`;
}

/** Times the finished players of the profile list and returns the speedrun board. */
export async function loadSpeedrunBoard(
  backend: SkillChainBackend,
  profiles: Profile[],
): Promise<RunResult[]> {
  const finished = profiles.filter((p) => p.level >= 3).slice(0, MAX_BOARD_PLAYERS);
  const runs: RunResult[] = [];
  const CHUNK = 4;
  for (let i = 0; i < finished.length; i += CHUNK) {
    const batch = finished.slice(i, i + CHUNK);
    const results = await Promise.all(
      batch.map(async (profile) => {
        try {
          const note = await backend.getNote(profile.owner);
          const info = note ? await backend.getRunInfo(profile.owner, false) : null;
          return buildRunResult(profile.owner, profile, note, info);
        } catch {
          return null; // one unreadable player must not hide the others
        }
      }),
    );
    for (const run of results) if (run) runs.push(run);
  }
  return sortSpeedrun(runs);
}
