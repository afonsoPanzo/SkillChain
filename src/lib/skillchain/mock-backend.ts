/**
 * In-memory implementation of SkillChainBackend.
 * Mirrors the program rules from SDD section 4.2 so the UI can be built and
 * tested before the real program/IDL is wired in. State resets on page reload.
 * Signatures are random: they will NOT resolve in the Solana Explorer.
 */
import {
  LEVEL_POINTS,
  MAX_NOTE_LENGTH,
  NONE,
  getItem,
  hasItem,
} from "./constants";
import { isDemoActive } from "./demo-flag";
import { SkillChainProgramError } from "./errors";
import type { Note, Profile, SkillChainBackend, TxContext } from "./types";

const SIGNING_MS = 900;
const CONFIRMING_MS = 1200;
const READ_MS = 150;

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function randomSignature(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(88));
  return Array.from(bytes, (b) => BASE58[b % BASE58.length]).join("");
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function seed(
  owner: string,
  level: number,
  totalEarned: number,
  equippedFrame: number,
  accessory: boolean,
  title: boolean,
): Profile {
  return {
    owner,
    level,
    points: totalEarned,
    totalEarned,
    items: 0,
    equippedFrame,
    equippedAccessory: accessory ? 2 : NONE,
    equippedTitle: title ? 3 : NONE,
  };
}

/** Other players, taken from the design prototype. */
function seedProfiles(): Profile[] {
  return [
    seed("4hTqYw8LcR3nPz6mKxD2sVbF9aJeGu1oN7iWtQ5rH2Zk", 3, 450, 1, true, true),
    seed("Bm7xR2kPqN9vTz4LcW8sYdH3eJ6fAu1oG5iKtX2nQpLs", 3, 450, 0, false, true),
    seed("7nKpX3qRmT8vLz2WcB6sYdH9eJ4fAu1oG5iNtQ7rPxMa", 3, 450, NONE, true, false),
    seed("DqW5mN2xR8kPvT3LzC7sYbH6eJ9fAu4oG1iKtX5nQrVy", 2, 250, 0, false, false),
    seed("Hs3LpQ9xR2kNvT7mZc4WyB8dJ6eFaU1oG5iKtX3nQrPw", 2, 250, NONE, true, false),
    seed("Kc8vT2mR5xNqP9LzW3sYbH7eJ4fAu6oG1iDtX8nQpRm", 1, 100, 0, false, false),
    seed("Pw2nX7qRmK4vTz9LcB3sYdH8eJ5fAu1oG6iWtQ2rHxNb", 1, 100, NONE, false, false),
  ];
}

const profiles = new Map<string, Profile>();
const notes = new Map<string, Note>();

/** Restores the seeded ranking and forgets every player and note. */
export function resetMockState() {
  profiles.clear();
  notes.clear();
  for (const p of seedProfiles()) profiles.set(p.owner, p);
  clearPersisted();
}

// In demo mode the simulated state survives a reload (sessionStorage only).
const STORAGE_KEY = "skillchain.demo.data";

function persist() {
  if (!isDemoActive()) return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ profiles: [...profiles.values()], notes: [...notes.values()] }),
    );
  } catch {
    // Blocked storage: progress just lasts until the next reload.
  }
}

function clearPersisted() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

function restorePersisted(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { profiles: Profile[]; notes: Note[] };
    profiles.clear();
    notes.clear();
    for (const p of data.profiles) profiles.set(p.owner, p);
    for (const n of data.notes) notes.set(n.owner, n);
    return true;
  } catch {
    return false;
  }
}

for (const p of seedProfiles()) profiles.set(p.owner, p);
if (isDemoActive()) restorePersisted();

function requireProfile(owner: string): Profile {
  const profile = profiles.get(owner);
  if (!profile) throw new Error("Profile account does not exist");
  return profile;
}

function save(profile: Profile) {
  profiles.set(profile.owner, { ...profile });
  persist();
}

async function send(ctx: TxContext): Promise<string> {
  await wait(SIGNING_MS);
  ctx.onConfirming();
  await wait(CONFIRMING_MS);
  return randomSignature();
}

export const mockBackend: SkillChainBackend = {
  isMock: true,

  async getProfile(owner) {
    await wait(READ_MS);
    const profile = profiles.get(owner);
    return profile ? { ...profile } : null;
  },

  async getNote(owner) {
    await wait(READ_MS);
    const note = notes.get(owner);
    return note ? { ...note } : null;
  },

  async listProfiles() {
    await wait(READ_MS);
    return Array.from(profiles.values(), (p) => ({ ...p }));
  },

  async initProfile(ctx) {
    if (profiles.has(ctx.owner)) throw new Error("account already in use");
    const signature = await send(ctx);
    save({
      owner: ctx.owner,
      level: 1,
      points: LEVEL_POINTS[0],
      totalEarned: LEVEL_POINTS[0],
      items: 0,
      equippedFrame: NONE,
      equippedAccessory: NONE,
      equippedTitle: NONE,
    });
    return signature;
  },

  async completeLevel2(ctx, recipient) {
    const profile = requireProfile(ctx.owner);
    if (profile.level !== 1) throw new SkillChainProgramError("WrongLevel");
    if (recipient === ctx.owner) throw new SkillChainProgramError("InvalidRecipient");
    const signature = await send(ctx);
    save({
      ...profile,
      level: 2,
      points: profile.points + LEVEL_POINTS[1],
      totalEarned: profile.totalEarned + LEVEL_POINTS[1],
    });
    return signature;
  },

  async completeLevel3(ctx, message) {
    const profile = requireProfile(ctx.owner);
    if (profile.level !== 2) throw new SkillChainProgramError("WrongLevel");
    const length = new TextEncoder().encode(message).length;
    if (length < 1 || length > MAX_NOTE_LENGTH) {
      throw new SkillChainProgramError("MessageTooLong");
    }
    const signature = await send(ctx);
    notes.set(ctx.owner, {
      owner: ctx.owner,
      message,
      createdAt: Math.floor(Date.now() / 1000),
    });
    save({
      ...profile,
      level: 3,
      points: profile.points + LEVEL_POINTS[2],
      totalEarned: profile.totalEarned + LEVEL_POINTS[2],
    });
    return signature;
  },

  async buyItem(ctx, itemId) {
    const profile = requireProfile(ctx.owner);
    const item = getItem(itemId);
    if (!item) throw new SkillChainProgramError("UnknownItem");
    if (hasItem(profile.items, itemId)) throw new SkillChainProgramError("AlreadyOwned");
    if (profile.level < item.minLevel) throw new SkillChainProgramError("LevelTooLow");
    if (profile.points < item.price) throw new SkillChainProgramError("NotEnoughPoints");
    const signature = await send(ctx);
    save({
      ...profile,
      points: profile.points - item.price,
      items: profile.items | (1 << itemId),
    });
    return signature;
  },

  async equipItem(ctx, itemId) {
    const profile = requireProfile(ctx.owner);
    const item = getItem(itemId);
    if (!item) throw new SkillChainProgramError("UnknownItem");
    if (!hasItem(profile.items, itemId)) throw new SkillChainProgramError("NotOwned");
    const signature = await send(ctx);
    const next = { ...profile };
    if (item.category === "frame") next.equippedFrame = itemId;
    else if (item.category === "accessory") next.equippedAccessory = itemId;
    else next.equippedTitle = itemId;
    save(next);
    return signature;
  },

  async unequipItem(ctx, slot) {
    const profile = requireProfile(ctx.owner);
    if (slot < 0 || slot > 2) throw new SkillChainProgramError("UnknownItem");
    const signature = await send(ctx);
    const next = { ...profile };
    if (slot === 0) next.equippedFrame = NONE;
    else if (slot === 1) next.equippedAccessory = NONE;
    else next.equippedTitle = NONE;
    save(next);
    return signature;
  },
};
