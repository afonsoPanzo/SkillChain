import { describe, expect, it } from "vitest";
import { isProfileAddress, isSolanaAddress } from "../src/lib/skillchain/address";

const REAL = "11111111111111111111111111111111"; // System Program, a valid 32-byte key
const SIMULATED = "4hTqYw8LcR3nPz6mKxD2sVbF9aJeGu1oN7iWtQ5rH2Zk"; // demo ranking address

describe("profile addresses", () => {
  it("accepts real Solana addresses", () => {
    expect(isSolanaAddress(REAL)).toBe(true);
    expect(isProfileAddress(REAL, false)).toBe(true);
  });

  it("rejects text that is not an address", () => {
    for (const bad of ["", "hello", "0OIl".repeat(10), "<script>"]) {
      expect(isProfileAddress(bad, false), bad).toBe(false);
      expect(isProfileAddress(bad, true), bad).toBe(false);
    }
  });

  it("checks the key length outside demo mode", () => {
    expect(isProfileAddress(REAL + "1", false)).toBe(false);
  });

  it("accepts the simulated demo players only in demo mode", () => {
    expect(isProfileAddress(SIMULATED, true)).toBe(true);
    // A made-up address can fail the 32-byte check outside demo mode.
    expect(isProfileAddress(SIMULATED, false)).toBe(isSolanaAddress(SIMULATED));
  });
});
