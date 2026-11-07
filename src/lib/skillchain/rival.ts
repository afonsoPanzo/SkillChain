import { LEVEL_POINTS, TOTAL_LEVELS } from "./constants";
import { shortAddress } from "./format";
import type { Profile } from "./types";

export interface Rival {
  title: string;
  sub: string;
  /** Where the card leads: the next level to overtake, or the leaderboard. */
  href: string;
  /** The player just ahead (null when the player is first). */
  ahead: Profile | null;
}

/**
 * The "rival card": the player directly above `me` in the leaderboard.
 * `sorted` must come from sortLeaderboard (level desc, total earned desc).
 * Returns null if `me` has no profile in the list.
 */
export function getRival(sorted: Profile[], me: string | null): Rival | null {
  if (!me) return null;
  const index = sorted.findIndex((p) => p.owner === me);
  if (index === -1) return null;

  if (index === 0) {
    return {
      title: "Estás em 1.º",
      sub: "Ninguém está à tua frente",
      href: "/leaderboard",
      ahead: null,
    };
  }

  const mine = sorted[index];
  const ahead = sorted[index - 1];
  const who = shortAddress(ahead.owner);

  if (ahead.level > mine.level && mine.level < TOTAL_LEVELS) {
    return {
      title: `+${LEVEL_POINTS[mine.level]} pts para passares ${who}`,
      sub: `Conclui o nível ${mine.level + 1} para ultrapassar`,
      href: `/learn/${mine.level + 1}`,
      ahead,
    };
  }

  return {
    title: `Empatado com ${who}`,
    sub: "Mesmo nível, mesmos pontos. Não abrandes.",
    href: "/leaderboard",
    ahead,
  };
}
