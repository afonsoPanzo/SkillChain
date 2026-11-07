import { describe, expect, it } from "vitest";
import { sortLeaderboard } from "../src/lib/skillchain/hooks";
import { makeT } from "../src/i18n/translate";
import { getRival } from "../src/lib/skillchain/rival";
import type { Profile } from "../src/lib/skillchain/types";

const LEVEL_TOTAL = [0, 100, 250, 450];

function player(owner: string, level: number): Profile {
  return {
    owner,
    level,
    points: 0,
    totalEarned: LEVEL_TOTAL[level],
    items: 0,
    equippedFrame: 255,
    equippedAccessory: 255,
    equippedTitle: 255,
  };
}

describe("sortLeaderboard", () => {
  it("orders by level, then total earned, then address", () => {
    const sorted = sortLeaderboard([
      player("B".repeat(32), 1),
      player("C".repeat(32), 3),
      player("A".repeat(32), 3),
      player("D".repeat(32), 2),
    ]);
    expect(sorted.map((p) => p.owner[0])).toEqual(["A", "C", "D", "B"]);
  });
});

const t = makeT("en");

describe("getRival", () => {
  const top = player("T".repeat(32), 3);
  const mid = player("M".repeat(32), 2);
  const me = player("Z".repeat(32), 1);
  const sorted = sortLeaderboard([top, mid, me]);

  it("proposes the next level to pass a higher-level player", () => {
    const rival = getRival(sorted, me.owner, t);
    expect(rival?.title).toContain("+150 pts to pass");
    expect(rival?.href).toBe("/learn/2");
  });

  it("reports a tie when the player ahead is on the same level", () => {
    const tied = sortLeaderboard([top, player("A".repeat(32), 1), me]);
    const rival = getRival(tied, me.owner, t);
    expect(rival?.title).toMatch(/^Tied with/);
    expect(rival?.href).toBe("/leaderboard");
  });

  it("says first place when nobody is ahead", () => {
    expect(getRival(sorted, top.owner, t)?.title).toBe("You're #1");
  });

  it("returns null without a profile", () => {
    expect(getRival(sorted, "X".repeat(32), t)).toBeNull();
    expect(getRival(sorted, null, t)).toBeNull();
  });
});
