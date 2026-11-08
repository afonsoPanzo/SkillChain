import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSwitchingBackend } from "../src/lib/skillchain/switching-backend";
import type { SkillChainBackend, TxContext } from "../src/lib/skillchain/types";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

function fakeBackend(isMock: boolean): SkillChainBackend {
  return {
    isMock,
    getProfile: vi.fn().mockResolvedValue(null),
    getNote: vi.fn().mockResolvedValue(null),
    listProfiles: vi.fn().mockResolvedValue([]),
    initProfile: vi.fn().mockResolvedValue("sig"),
    completeLevel2: vi.fn().mockResolvedValue("sig"),
    completeLevel3: vi.fn().mockResolvedValue("sig"),
    buyItem: vi.fn().mockResolvedValue("sig"),
    equipItem: vi.fn().mockResolvedValue("sig"),
    unequipItem: vi.fn().mockResolvedValue("sig"),
  };
}

describe("backend selection", () => {
  it("uses the real backend outside demo mode and the mock inside it", async () => {
    const real = fakeBackend(false);
    const mock = fakeBackend(true);
    let demo = false;
    const backend = createSwitchingBackend(real, mock, () => demo);

    await backend.getProfile("A");
    expect(real.getProfile).toHaveBeenCalledTimes(1);
    expect(mock.getProfile).not.toHaveBeenCalled();
    expect(backend.isMock).toBe(false);

    demo = true;
    await backend.listProfiles();
    expect(mock.listProfiles).toHaveBeenCalledTimes(1);
    expect(real.listProfiles).not.toHaveBeenCalled();
    expect(backend.isMock).toBe(true);

    demo = false;
    await backend.buyItem({} as TxContext, 1);
    expect(real.buyItem).toHaveBeenCalledTimes(1);
    expect(mock.buyItem).not.toHaveBeenCalled();
  });
});

describe("demo mode", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubGlobal("sessionStorage", memoryStorage());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const ctx = (owner: string): TxContext => ({
    owner,
    sendTransaction: vi.fn(),
    onConfirming: vi.fn(),
  });

  /** Lets the mock's simulated delays elapse. */
  async function settle<T>(promise: Promise<T>): Promise<T> {
    await vi.advanceTimersByTimeAsync(3000);
    return promise;
  }

  async function load() {
    const flag = await import("../src/lib/skillchain/demo-flag");
    const demo = await import("../src/lib/skillchain/demo");
    const mock = await import("../src/lib/skillchain/mock-backend");
    return { flag, demo, mock };
  }

  it("is off by default and toggles on and off", async () => {
    const { flag, demo } = await load();
    expect(flag.isDemoActive()).toBe(false);
    demo.enterDemo();
    expect(flag.isDemoActive()).toBe(true);
    expect(sessionStorage.getItem("skillchain.demo")).toBe("1");
    demo.exitDemo();
    expect(flag.isDemoActive()).toBe(false);
    expect(sessionStorage.getItem("skillchain.demo")).toBeNull();
  });

  it("starts a new level-0 player with the simulated ranking", async () => {
    const { demo, mock } = await load();
    demo.enterDemo();
    expect(await settle(mock.mockBackend.getProfile(demo.DEMO_OWNER))).toBeNull();
    const profiles = await settle(mock.mockBackend.listProfiles());
    expect(profiles).toHaveLength(7);
    expect(profiles.some((p) => p.owner === demo.DEMO_OWNER)).toBe(false);
  });

  it("keeps the simulated progress after a reload", async () => {
    const first = await load();
    first.demo.enterDemo();
    const done = first.mock.mockBackend.initProfile(ctx(first.demo.DEMO_OWNER));
    await settle(done);

    vi.resetModules(); // a page reload: same sessionStorage, fresh modules
    const second = await load();
    expect(second.flag.isDemoActive()).toBe(true);
    const profile = await settle(second.mock.mockBackend.getProfile(second.demo.DEMO_OWNER));
    expect(profile?.level).toBe(1);
  });

  it("clears the simulated data when leaving demo mode", async () => {
    const { demo, mock } = await load();
    demo.enterDemo();
    const done = mock.mockBackend.initProfile(ctx(demo.DEMO_OWNER));
    await settle(done);
    expect(await settle(mock.mockBackend.getProfile(demo.DEMO_OWNER))).not.toBeNull();

    demo.exitDemo();
    expect(sessionStorage.getItem("skillchain.demo.data")).toBeNull();
    expect(await settle(mock.mockBackend.getProfile(demo.DEMO_OWNER))).toBeNull();
  });

  it("does not persist anything outside demo mode (the dev mock still resets on reload)", async () => {
    const { demo, mock } = await load();
    const done = mock.mockBackend.initProfile(ctx(demo.DEMO_OWNER));
    await settle(done);
    expect(sessionStorage.getItem("skillchain.demo.data")).toBeNull();
  });

  it("still works when sessionStorage is blocked", async () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    vi.stubGlobal("sessionStorage", {
      getItem: blocked,
      setItem: blocked,
      removeItem: blocked,
    });
    const { flag, demo } = await load();
    demo.enterDemo();
    expect(flag.isDemoActive()).toBe(true);
    demo.exitDemo();
    expect(flag.isDemoActive()).toBe(false);
  });
});
