import { isDemoActive, setDemoActive } from "./demo-flag";
import { resetMockState } from "./mock-backend";
import { invalidateData } from "./store";

/** Address of the simulated player. It never exists on-chain. */
export const DEMO_OWNER = "Demo" + "1".repeat(40);

/** Simulated Devnet balance, enough for every level. */
export const DEMO_LAMPORTS = 1_000_000_000n;

/** Starts demo mode with a brand new level-0 player and the simulated ranking. */
export function enterDemo() {
  resetMockState();
  setDemoActive(true);
  invalidateData();
}

/** Leaves demo mode and drops every simulated player, note and point. */
export function exitDemo() {
  if (!isDemoActive()) return;
  setDemoActive(false);
  resetMockState();
  invalidateData();
}
