import { describe, expect, it, vi } from "vitest";
import { Transaction } from "@solana/web3.js";
import { instructionDiscriminator } from "../src/lib/skillchain/codec";
import { DEVNET_BLOCKCHAIN_ID } from "../src/lib/blink/headers";
import { createChallengeHandlers } from "../src/lib/blink/handlers";
import type { ChallengeChain } from "../src/lib/blink/challenge";
import { RateLimiter } from "../src/lib/tutor/limits";
import { GET as actionsJson, OPTIONS as actionsJsonOptions } from "../src/app/actions.json/route";

const PROGRAM = "AqdB1HaXB8wnvwGFTNsxTRrpSNMMVs2x5t4bz6UxU2X7";
const PLAYER = "GSyTYMGBmPoeBy2J25i5UxpomkXK91qWeYGqXzhJ1uY6";
const FRIEND = "BArAj3HKjzqPuyn3Z1L1QUfmiUXkZbBgt9FMfWiYG8k8";
const BLOCKHASH = "EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N";
const ORIGIN = "https://skillchain.example";

function handlers(hasProfile = false) {
  const chain: ChallengeChain = {
    hasProfile: vi.fn().mockResolvedValue(hasProfile),
    latestBlockhash: vi.fn().mockResolvedValue(BLOCKHASH),
  };
  return {
    chain,
    ...createChallengeHandlers({ chain, programId: () => PROGRAM, limiter: new RateLimiter(100) }),
  };
}

const get = (h: ReturnType<typeof handlers>, query = "") =>
  h.GET(new Request(`${ORIGIN}/api/actions/challenge${query}`));
const post = (h: ReturnType<typeof handlers>, body: unknown, query = "") =>
  h.POST(
    new Request(`${ORIGIN}/api/actions/challenge${query}`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

function expectActionHeaders(response: Response) {
  expect(response.headers.get("access-control-allow-origin")).toBe("*");
  expect(response.headers.get("access-control-allow-methods")).toBe("GET,POST,PUT,OPTIONS");
  expect(response.headers.get("access-control-allow-headers")).toContain("Content-Type");
  expect(response.headers.get("access-control-allow-headers")).toContain("X-Accept-Action-Version");
  expect(response.headers.get("x-action-version")).toBeTruthy();
  expect(response.headers.get("x-blockchain-ids")).toBe(DEVNET_BLOCKCHAIN_ID);
}

describe("GET /api/actions/challenge", () => {
  it("returns valid Action metadata with the required headers", async () => {
    const response = await get(handlers());
    expect(response.status).toBe(200);
    expectActionHeaders(response);
    const body = await response.json();
    expect(body.type).toBe("action");
    expect(body.title).toBe("SkillChain — Learn Solana by playing");
    expect(body.label).toBe("Accept the challenge");
    expect(body.label.split(" ").length).toBeLessThanOrEqual(5);
    expect(body.icon).toBe(`${ORIGIN}/blink.svg`);
    expect(new URL(body.icon).protocol).toBe("https:");
    expect(body.icon).toMatch(/\.(svg|png|webp)$/);
    expect(body.description).toContain("level 3");
    expect(body.links.actions).toEqual([
      { type: "transaction", href: "/api/actions/challenge", label: "Accept the challenge" },
    ]);
  });

  it("shows who challenges you when ?ref is a valid address", async () => {
    const body = await (await get(handlers(), `?ref=${FRIEND}`)).json();
    expect(body.description).toContain("BArA…G8k8 challenges you: reach level 3!");
    expect(body.links.actions[0].href).toBe(`/api/actions/challenge?ref=${FRIEND}`);
  });

  it("ignores an invalid ?ref", async () => {
    const body = await (await get(handlers(), "?ref=<script>")).json();
    expect(body.description).not.toContain("script");
    expect(body.links.actions[0].href).toBe("/api/actions/challenge");
  });

  it("is available in Portuguese", async () => {
    const body = await (await get(handlers(), "?lang=pt")).json();
    expect(body.label).toBe("Aceitar o desafio");
    expect(body.links.actions[0].href).toBe("/api/actions/challenge?lang=pt");
  });
});

describe("POST /api/actions/challenge", () => {
  it("returns an unsigned init_profile transaction for a new account", async () => {
    const h = handlers(false);
    const response = await post(h, { account: PLAYER });
    expect(response.status).toBe(200);
    expectActionHeaders(response);
    const body = await response.json();
    expect(body.type).toBe("transaction");
    expect(body.message).toContain("level 1");

    const tx = Transaction.from(Buffer.from(body.transaction, "base64"));
    expect(tx.feePayer?.toBase58()).toBe(PLAYER);
    expect(tx.recentBlockhash).toBe(BLOCKHASH);
    expect(tx.signatures.every((s) => s.signature === null)).toBe(true);
    expect(tx.instructions).toHaveLength(1);

    const ix = tx.instructions[0];
    expect(ix.programId.toBase58()).toBe(PROGRAM);
    expect(Array.from(ix.data)).toEqual(Array.from(instructionDiscriminator("init_profile")));
    expect(ix.keys.map((k) => [k.isSigner, k.isWritable])).toEqual([
      [true, true],
      [false, true],
      [false, false],
    ]);
    expect(ix.keys[0].pubkey.toBase58()).toBe(PLAYER);
    expect(ix.keys[2].pubkey.toBase58()).toBe("11111111111111111111111111111111");
    expect(h.chain.hasProfile).toHaveBeenCalledWith(PLAYER, PROGRAM);
  });

  it("derives the same profile PDA the app uses", async () => {
    const { deriveAddress } = await import("../src/lib/skillchain/pda");
    const { PublicKey } = await import("@solana/web3.js");
    const body = await (await post(handlers(), { account: PLAYER })).json();
    const tx = Transaction.from(Buffer.from(body.transaction, "base64"));
    const expected = await deriveAddress(new PublicKey(PROGRAM), "profile", new PublicKey(PLAYER));
    expect(tx.instructions[0].keys[1].pubkey.toBase58()).toBe(expected.toBase58());
  });

  it("returns a friendly error for an account that already has a profile", async () => {
    const h = handlers(true);
    const response = await post(h, { account: PLAYER });
    expect(response.status).toBe(400);
    expectActionHeaders(response);
    const body = await response.json();
    expect(body.message).toContain("already have a SkillChain profile");
    expect(body.transaction).toBeUndefined();
    expect(h.chain.latestBlockhash).not.toHaveBeenCalled();
  });

  it("rejects invalid accounts and bodies", async () => {
    const h = handlers();
    expect((await post(h, { account: "nope" })).status).toBe(400);
    expect((await post(h, {})).status).toBe(400);
    expect((await post(h, "not json")).status).toBe(400);
    expect((await post(h, { account: PLAYER, pad: "x".repeat(2000) })).status).toBe(413);
    expect(h.chain.hasProfile).not.toHaveBeenCalled();
    expectActionHeaders(await post(h, { account: "nope" }));
  });

  it("reports Devnet failures without leaking details", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const h = handlers();
    vi.mocked(h.chain.hasProfile).mockRejectedValue(new Error("secret rpc url"));
    const response = await post(h, { account: PLAYER });
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });

  it("answers in Portuguese when asked", async () => {
    const body = await (await post(handlers(true), { account: PLAYER }, "?lang=pt")).json();
    expect(body.message).toContain("Já tens um perfil");
  });
});

describe("OPTIONS and actions.json", () => {
  it("answers OPTIONS with the CORS headers", () => {
    const response = handlers().OPTIONS();
    expect(response.status).toBe(204);
    expectActionHeaders(response);
  });

  it("serves actions.json rules that point to the action, with CORS", async () => {
    const response = actionsJson();
    expectActionHeaders(response);
    const body = await response.json();
    expect(body.rules).toContainEqual({
      pathPattern: "/challenge",
      apiPath: "/api/actions/challenge",
    });
    expect(actionsJsonOptions().headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("challenger display name", () => {
  it("keeps plain names and cleans anything else", async () => {
    const { sanitizeName } = await import("../src/lib/blink/challenge");
    expect(sanitizeName("Maria")).toBe("Maria");
    expect(sanitizeName("  João   Silva ")).toBe("João Silva");
    expect(sanitizeName("<b>Hacker</b> https://evil.example")).toBe("bHackerb httpsevilex");
    expect(sanitizeName("evil.com/login")).toBe("evilcomlogin");
    expect(sanitizeName("a".repeat(50))).toBe("a".repeat(20));
    expect(sanitizeName("🔥🔥")).toBeNull();
    expect(sanitizeName("   ")).toBeNull();
    expect(sanitizeName(null)).toBeNull();
  });

  it("shows the name with the short address in the Blink card", async () => {
    const body = await (await get(handlers(), `?ref=${FRIEND}&name=Maria`)).json();
    expect(body.description).toContain("Maria (BArA…G8k8) challenges you: reach level 3!");
    expect(body.links.actions[0].href).toBe(`/api/actions/challenge?ref=${FRIEND}&name=Maria`);
  });

  it("works with a name and no address, and ignores a name that sanitizes to nothing", async () => {
    const named = await (await get(handlers(), "?name=Maria")).json();
    expect(named.description).toContain("Maria challenges you");
    const empty = await (await get(handlers(), "?name=%F0%9F%94%A5")).json();
    expect(empty.description).not.toContain("challenges you");
    expect(empty.links.actions[0].href).toBe("/api/actions/challenge");
  });

  it("keeps the name when the card is in Portuguese", async () => {
    const body = await (await get(handlers(), `?name=Maria&lang=pt`)).json();
    expect(body.description).toContain("Maria desafia-te");
    expect(body.links.actions[0].href).toBe("/api/actions/challenge?name=Maria&lang=pt");
  });
});
