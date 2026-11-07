import { LEVEL_POINTS, TOTAL_LEVELS } from "./constants";
import { shortAddress } from "./format";
import type { TFunction } from "../../i18n/translate";
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
export function getRival(sorted: Profile[], me: string | null, t: TFunction): Rival | null {
  if (!me) return null;
  const index = sorted.findIndex((p) => p.owner === me);
  if (index === -1) return null;

  if (index === 0) {
    return {
      title: t("rival.top"),
      sub: t("rival.topSub"),
      href: "/leaderboard",
      ahead: null,
    };
  }

  const mine = sorted[index];
  const ahead = sorted[index - 1];
  const who = shortAddress(ahead.owner);

  if (ahead.level > mine.level && mine.level < TOTAL_LEVELS) {
    return {
      title: t("rival.pass", { n: LEVEL_POINTS[mine.level], who }),
      sub: t("rival.passSub", { level: mine.level + 1 }),
      href: `/learn/${mine.level + 1}`,
      ahead,
    };
  }

  return {
    title: t("rival.tie", { who }),
    sub: t("rival.tieSub"),
    href: "/leaderboard",
    ahead,
  };
}
