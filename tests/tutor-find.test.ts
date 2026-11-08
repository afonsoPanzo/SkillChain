import { beforeEach, describe, expect, it, vi } from "vitest";
import { findLevelSignature, type SignatureSource } from "../src/lib/tutor/find-signature";
import { extractFacts, type RawTransaction } from "../src/lib/tutor/facts";
import init from "./fixtures/tx-InitProfile.json";
import level2 from "./fixtures/tx-CompleteLevel2.json";
import level3 from "./fixtures/tx-CompleteLevel3.json";

const mocks = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn() }));
vi.mock("../src/lib/tutor/fetch-transaction", () => ({
  listSignatures: mocks.list,
  fetchTransaction: mocks.get,
}));

const PROGRAM = "AqdB1HaXB8wnvwGFTNsxTRrpSNMMVs2x5t4bz6UxU2X7";

const fixtures = [
  { level: 1 as const, f: init },
  { level: 2 as const, f: level2 },
  { level: 3 as const, f: level3 },
];
const byAll: Record<string, RawTransaction> = Object.fromEntries(
  fixtures.map(({ f }) => [f.signature, f.tx as RawTransaction]),
);
const signerOf = (f: (typeof fixtures)[number]["f"]) =>
  extractFacts(f.signature, f.tx as RawTransaction, PROGRAM).signer;

// A shop transaction of the program: it touches the profile but is not a level.
const shopTx = (() => {
  const tx = structuredClone(init.tx) as RawTransaction;
  tx.transaction.message.instructions.find((i) => i.programId === PROGRAM)!.data = "3qi1MbrtkR83";
  return tx;
})();
const SHOP = "5".repeat(88);

function source(newestFirst: string[]): SignatureSource {
  return {
    listSignatures: async () => newestFirst,
    getTransaction: async (sig) => (sig === SHOP ? shopTx : (byAll[sig] ?? null)),
  };
}

describe("findLevelSignature", () => {
  for (const { level, f } of fixtures) {
    it(`finds the level ${level} transaction among shop transactions`, async () => {
      // Newest first: shop actions came after the level transaction.
      const found = await findLevelSignature(signerOf(f), level, PROGRAM, source([SHOP, SHOP, f.signature]));
      expect(found).toBe(f.signature);
    });
  }

  it("returns null when the level was never completed", async () => {
    const owner = signerOf(init);
    expect(await findLevelSignature(owner, 2, PROGRAM, source([SHOP, init.signature]))).toBeNull();
    expect(await findLevelSignature(owner, 3, PROGRAM, source([]))).toBeNull();
  });

  it("ignores transactions signed by someone else", async () => {
    const stranger = "11111111111111111111111111111111";
    expect(await findLevelSignature(stranger, 1, PROGRAM, source([init.signature]))).toBeNull();
  });
});

describe("POST /api/tutor/find", () => {
  const OWNER = signerOf(level3);
  type FindRoute = typeof import("../src/app/api/tutor/find/route");
  let route: FindRoute;
  let ip = 0;

  beforeEach(async () => {
    vi.resetModules();
    delete (globalThis as { __skillchainTutor?: unknown }).__skillchainTutor;
    vi.stubEnv("NEXT_PUBLIC_SKILLCHAIN_PROGRAM_ID", PROGRAM);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.list.mockReset();
    mocks.get.mockReset();
    mocks.list.mockResolvedValue([level3.signature]);
    mocks.get.mockImplementation(async (sig: string) => byAll[sig] ?? null);
    route = await import("../src/app/api/tutor/find/route");
  });

  const call = (body: unknown) =>
    route.POST(
      new Request("http://localhost/api/tutor/find", {
        method: "POST",
        headers: { "x-forwarded-for": `10.1.0.${++ip}` },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );

  it("returns the signature of a level finished earlier, then serves it from cache", async () => {
    const first = await call({ owner: OWNER, level: 3 });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ signature: level3.signature });
    const second = await call({ owner: OWNER, level: 3 });
    expect(await second.json()).toEqual({ signature: level3.signature });
    expect(mocks.list).toHaveBeenCalledTimes(1);
  });

  it("answers 404 when the level has no transaction", async () => {
    mocks.list.mockResolvedValue([]);
    const response = await call({ owner: OWNER, level: 2 });
    expect(response.status).toBe(404);
  });

  it("rejects bad input", async () => {
    expect((await call({ owner: "nope", level: 1 })).status).toBe(400);
    expect((await call({ owner: OWNER, level: 4 })).status).toBe(400);
    expect((await call("not json")).status).toBe(400);
  });

  it("reports RPC failures", async () => {
    mocks.list.mockRejectedValue(new Error("RPC error 500"));
    expect((await call({ owner: OWNER, level: 3 })).status).toBe(502);
  });
});
