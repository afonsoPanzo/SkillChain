import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import {
  NOTE_DISCRIMINATOR,
  PROFILE_DISCRIMINATOR,
  PROFILE_SIZE,
  decodeNote,
  decodeProfile,
  encodeCompleteLevel3,
  encodeU8Arg,
  instructionDiscriminator,
  profileFilters,
} from "../src/lib/skillchain/codec";
import { makeT } from "../src/i18n/translate";
import { extractCustomCode, toUserMessage } from "../src/lib/skillchain/errors";

const OWNER = new PublicKey("AqdB1HaXB8wnvwGFTNsxTRrpSNMMVs2x5t4bz6UxU2X7");

function concat(...parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function u64(value: bigint) {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setBigUint64(0, value, true);
  return b;
}

describe("decodeProfile", () => {
  // discriminator + owner + level + points + total_earned + items + 3 equipped + bump
  const bytes = concat(
    PROFILE_DISCRIMINATOR,
    OWNER.toBytes(),
    Uint8Array.of(2),
    u64(250n),
    u64(450n),
    Uint8Array.of(0b0101, 0, 2, 255, 254),
  );

  it("is 62 bytes long", () => {
    expect(bytes.length).toBe(PROFILE_SIZE);
  });

  it("reads every field", () => {
    expect(decodeProfile(bytes)).toEqual({
      owner: OWNER.toBase58(),
      level: 2,
      points: 250,
      totalEarned: 450,
      items: 5,
      equippedFrame: 0,
      equippedAccessory: 2,
      equippedTitle: 255,
    });
  });

  it("rejects a wrong discriminator", () => {
    const bad = bytes.slice();
    bad[0] ^= 0xff;
    expect(() => decodeProfile(bad)).toThrow(/discriminator/);
  });

  it("rejects a Note passed as a Profile", () => {
    const note = concat(NOTE_DISCRIMINATOR, new Uint8Array(PROFILE_SIZE));
    expect(() => decodeProfile(note)).toThrow(/discriminator/);
  });
});

describe("decodeNote", () => {
  const message = "Olá, Solana!";
  const text = new TextEncoder().encode(message);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, text.length, true);
  const createdAt = new Uint8Array(8);
  new DataView(createdAt.buffer).setBigInt64(0, 1_762_500_000n, true);
  // The real account is 153 bytes: the string is read by its prefix, not to the end.
  const body = concat(NOTE_DISCRIMINATOR, OWNER.toBytes(), length, text, createdAt, Uint8Array.of(254));
  const padded = concat(body, new Uint8Array(153 - body.length));

  it("reads the string by its length prefix", () => {
    expect(padded.length).toBe(153);
    expect(decodeNote(padded)).toEqual({
      owner: OWNER.toBase58(),
      message,
      createdAt: 1_762_500_000,
    });
  });

  it("rejects a wrong discriminator", () => {
    const bad = padded.slice();
    bad[3] ^= 0xff;
    expect(() => decodeNote(bad)).toThrow(/discriminator/);
  });

  it("rejects a length prefix larger than the account", () => {
    const bad = padded.slice();
    new DataView(bad.buffer).setUint32(40, 5000, true);
    expect(() => decodeNote(bad)).toThrow(/length/);
  });
});

describe("instruction arguments", () => {
  it("serialises complete_level_3 as discriminator + u32 LE length + UTF-8", () => {
    const data = encodeCompleteLevel3("Olá");
    const expected = concat(
      instructionDiscriminator("complete_level_3"),
      Uint8Array.of(4, 0, 0, 0), // "Olá" is 4 bytes in UTF-8
      Uint8Array.of(0x4f, 0x6c, 0xc3, 0xa1),
    );
    expect(Array.from(data)).toEqual(Array.from(expected));
  });

  it("rejects an empty or over-long message", () => {
    expect(() => encodeCompleteLevel3("")).toThrow();
    expect(() => encodeCompleteLevel3("a".repeat(101))).toThrow();
    expect(encodeCompleteLevel3("a".repeat(100)).length).toBe(8 + 4 + 100);
  });

  it("serialises u8 arguments after the discriminator", () => {
    const data = encodeU8Arg("buy_item", 3);
    expect(data.length).toBe(9);
    expect(data[8]).toBe(3);
    expect(() => encodeU8Arg("buy_item", 256)).toThrow();
  });
});

describe("leaderboard filters", () => {
  it("filters by size 62 and the Profile discriminator at offset 0", () => {
    const [size, memcmp] = profileFilters() as [
      { dataSize: number },
      { memcmp: { offset: number; bytes: string; encoding: string } },
    ];
    expect(size.dataSize).toBe(62);
    expect(memcmp.memcmp.offset).toBe(0);
    expect(memcmp.memcmp.encoding).toBe("base64");
    expect(Array.from(Buffer.from(memcmp.memcmp.bytes, "base64"))).toEqual(
      Array.from(PROFILE_DISCRIMINATOR),
    );
  });
});

describe("program errors", () => {
  it("extracts custom codes from the usual formats", () => {
    expect(extractCustomCode("custom program error: 0x1771")).toBe(6001);
    expect(extractCustomCode('{"InstructionError":[0,{"Custom":6010}]}')).toBe(6010);
    expect(extractCustomCode("Error Number: 6009. Error Message: x")).toBe(6009);
    expect(extractCustomCode("nothing here")).toBeNull();
  });

  it("maps all 11 codes to a message in both languages", () => {
    for (const lang of ["en", "pt"] as const) {
      const t = makeT(lang);
      for (let code = 6000; code <= 6010; code++) {
        const msg = toUserMessage(new Error(`{"Custom":${code}}`), t);
        expect(msg).not.toBe(t("error.generic"));
      }
    }
  });
});
