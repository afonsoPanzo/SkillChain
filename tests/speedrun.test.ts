import { describe, expect, it } from "vitest";
import {
  buildRunResult,
  computeDuration,
  duelWinner,
  formatDuration,
  loadRun,
  loadSpeedrunBoard,
  sortSpeedrun,
  type RunResult,
} from "../src/lib/speedrun/run";
import type { Note, Profile, RunInfo, SkillChainBackend } from "../src/lib/skillchain/types";

const addr = (c: string) => c.repeat(32);

function profile(owner: string, level: number): Profile {
  return {
    owner,
    level,
    points: 0,
    totalEarned: 0,
    items: 0,
    equippedFrame: 255,
    equippedAccessory: 255,
    equippedTitle: 255,
  };
}

const note = (owner: string, createdAt: number): Note => ({ owner, message: "hi", createdAt });
const info = (startTime: number): RunInfo => ({
  startTime,
  startSignature: "start-sig",
  endSignature: "end-sig",
});

describe("computeDuration", () => {
  it("is the end minus the start, in seconds", () => {
    expect(computeDuration(1000, 1402)).toBe(402);
    expect(computeDuration(1000, 1000)).toBe(0);
  });

  it("clamps a tiny negative gap between the two clocks to zero", () => {
    expect(computeDuration(1000, 999)).toBe(0);
  });

  it("is null while either end is unknown", () => {
    expect(computeDuration(null, 1402)).toBeNull();
    expect(computeDuration(1000, null)).toBeNull();
  });
});

describe("buildRunResult", () => {
  const owner = addr("A");

  it("finished: has a note, so the time is note.created_at minus the first transaction", () => {
    const run = buildRunResult(owner, profile(owner, 3), note(owner, 1402), info(1000));
    expect(run).toMatchObject({
      status: "finished",
      level: 3,
      durationSeconds: 402,
      startTime: 1000,
      endTime: 1402,
      startSignature: "start-sig",
      endSignature: "end-sig",
    });
  });

  it("running: no note yet, so it shows the current level and no time", () => {
    const run = buildRunResult(owner, profile(owner, 2), null, info(1000));
    expect(run).toMatchObject({ status: "running", level: 2, durationSeconds: null, endTime: null });
  });

  it("none: no profile means the player has not started", () => {
    const run = buildRunResult(owner, null, null, null);
    expect(run).toMatchObject({ status: "none", level: 0, durationSeconds: null, profile: null });
  });

  it("finished without a known start has no time", () => {
    const run = buildRunResult(owner, profile(owner, 3), note(owner, 1402), null);
    expect(run.status).toBe("finished");
    expect(run.durationSeconds).toBeNull();
  });
});

function finished(owner: string, seconds: number): RunResult {
  return buildRunResult(owner, profile(owner, 3), note(owner, 1000 + seconds), info(1000));
}
const running = (owner: string) => buildRunResult(owner, profile(owner, 2), null, info(1000));

describe("duelWinner", () => {
  it("picks the faster finished run", () => {
    expect(duelWinner(finished(addr("A"), 402), finished(addr("B"), 551))).toBe("first");
    expect(duelWinner(finished(addr("A"), 900), finished(addr("B"), 551))).toBe("second");
  });

  it("is a tie when the times are equal", () => {
    expect(duelWinner(finished(addr("A"), 300), finished(addr("B"), 300))).toBe("tie");
  });

  it("has no winner until both have finished", () => {
    expect(duelWinner(finished(addr("A"), 300), running(addr("B")))).toBeNull();
    expect(duelWinner(running(addr("A")), running(addr("B")))).toBeNull();
    expect(duelWinner(finished(addr("A"), 300), buildRunResult(addr("C"), null, null, null))).toBeNull();
  });
});

describe("sortSpeedrun", () => {
  it("orders the fastest first and ignores runs that are not finished", () => {
    const runs = [
      finished(addr("C"), 900),
      running(addr("D")),
      finished(addr("A"), 402),
      finished(addr("B"), 551),
      buildRunResult(addr("E"), null, null, null),
    ];
    expect(sortSpeedrun(runs).map((r) => r.owner[0])).toEqual(["A", "B", "C"]);
  });

  it("keeps the top 10 and breaks ties by address", () => {
    const many = Array.from({ length: 14 }, (_, i) =>
      finished(String.fromCharCode(65 + i).repeat(32), i < 2 ? 100 : 200 + i),
    );
    const top = sortSpeedrun([...many].reverse());
    expect(top).toHaveLength(10);
    expect(top[0].owner[0]).toBe("A");
    expect(top[1].owner[0]).toBe("B");
  });
});

describe("formatDuration", () => {
  it("uses minutes and seconds, then hours and minutes", () => {
    expect(formatDuration(42)).toBe("42s");
    expect(formatDuration(402)).toBe("6m 42s");
    expect(formatDuration(60)).toBe("1m 00s");
    expect(formatDuration(3780)).toBe("1h 03m");
    expect(formatDuration(7325)).toBe("2h 02m");
    expect(formatDuration(0)).toBe("0s");
  });
});

function fakeBackend(data: Record<string, { level: number; note?: number; start?: number }>): SkillChainBackend {
  const get = (owner: string) => data[owner];
  return {
    isMock: true,
    getProfile: async (o) => (get(o) ? profile(o, get(o).level) : null),
    getNote: async (o) => (get(o)?.note ? note(o, get(o).note!) : null),
    listProfiles: async () => Object.keys(data).map((o) => profile(o, data[o].level)),
    getRunInfo: async (o) => (get(o)?.start ? info(get(o).start!) : null),
    initProfile: async () => "",
    completeLevel2: async () => "",
    completeLevel3: async () => "",
    buyItem: async () => "",
    equipItem: async () => "",
    unequipItem: async () => "",
  };
}

describe("loading runs from a backend", () => {
  const data = {
    [addr("A")]: { level: 3, note: 1402, start: 1000 },
    [addr("B")]: { level: 3, note: 1551, start: 1000 },
    [addr("C")]: { level: 2, start: 1000 },
    [addr("D")]: { level: 3, note: 5000, start: 1000 },
  };

  it("loadRun reads profile, note and run info", async () => {
    const backend = fakeBackend(data);
    expect((await loadRun(backend, addr("A"))).durationSeconds).toBe(402);
    expect((await loadRun(backend, addr("C"))).status).toBe("running");
    expect((await loadRun(backend, addr("Z"))).status).toBe("none");
  });

  it("the speedrun board times only finished players, fastest first", async () => {
    const backend = fakeBackend(data);
    const board = await loadSpeedrunBoard(backend, await backend.listProfiles());
    expect(board.map((r) => [r.owner[0], r.durationSeconds])).toEqual([
      ["A", 402],
      ["B", 551],
      ["D", 4000],
    ]);
  });

  it("one unreadable player does not hide the others", async () => {
    const backend = fakeBackend(data);
    const original = backend.getNote;
    backend.getNote = async (o) => {
      if (o === addr("B")) throw new Error("rpc down");
      return original(o);
    };
    const board = await loadSpeedrunBoard(backend, await backend.listProfiles());
    expect(board.map((r) => r.owner[0])).toEqual(["A", "D"]);
  });
});
