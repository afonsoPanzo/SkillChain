import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("simulated speedrun in demo mode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("seeds a challenger who finished in 6m 42s and a speedrun board", async () => {
    const { mockBackend } = await import("../src/lib/skillchain/mock-backend");
    const { loadRun, loadSpeedrunBoard, formatDuration } = await import("../src/lib/speedrun/run");
    const profiles = await mockBackend.listProfiles();
    const board = await loadSpeedrunBoard(mockBackend, profiles);
    expect(board.map((run) => formatDuration(run.durationSeconds!))).toEqual(["6m 42s", "9m 11s", "14m 55s"]);

    const level2 = profiles.find((p) => p.level === 2)!;
    expect((await loadRun(mockBackend, level2.owner)).status).toBe("running");
  });
});
