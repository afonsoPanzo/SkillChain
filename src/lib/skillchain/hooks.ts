"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useWallet } from "@solana/wallet-adapter";
import { backend } from "./backend";
import { toUserMessage } from "./errors";
import { getDataVersion, invalidateData, subscribeData } from "./store";
import type { Note, Profile, TxContext, TxState } from "./types";

const TOP_PLAYERS = 20;

function useDataVersion() {
  return useSyncExternalStore(subscribeData, getDataVersion, () => 0);
}

/**
 * Runs `fetcher` whenever `key` or the data version changes. Previous data is
 * kept while refetching, so screens do not flash after a transaction.
 */
function useQuery<T>(key: string | null, fetcher: () => Promise<T>) {
  const version = useDataVersion();
  const [result, setResult] = useState<{
    key: string;
    data: T | null;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (key === null) return;
    let active = true;
    fetcher().then(
      (data) => active && setResult({ key, data, error: false }),
      (err) => {
        console.error(err);
        if (active) setResult({ key, data: null, error: true });
      },
    );
    return () => {
      active = false;
    };
  }, [key, fetcher, version]);

  const current = result !== null && result.key === key ? result : null;
  return {
    data: current?.data ?? null,
    isLoading: key !== null && current === null,
    error: current?.error ?? false,
  };
}

/** Profile of the connected wallet. `profile` is null if it does not exist yet (level 0). */
export function useProfile() {
  const { publicKey } = useWallet();
  const owner = publicKey?.toBase58() ?? null;
  const fetcher = useCallback(
    () => (owner ? backend.getProfile(owner) : Promise.resolve(null)),
    [owner],
  );
  const { data, isLoading, error } = useQuery<Profile | null>(owner, fetcher);
  return { owner, profile: data, isLoading, error };
}

/** The level-3 note of the connected wallet, if it exists. */
export function useNote() {
  const { publicKey } = useWallet();
  const owner = publicKey?.toBase58() ?? null;
  const fetcher = useCallback(
    () => (owner ? backend.getNote(owner) : Promise.resolve(null)),
    [owner],
  );
  const { data, isLoading } = useQuery<Note | null>(owner, fetcher);
  return { note: data, isLoading };
}

/** Level desc, then total earned desc. */
export function sortLeaderboard(profiles: Profile[]): Profile[] {
  return [...profiles].sort(
    (a, b) => b.level - a.level || b.totalEarned - a.totalEarned,
  );
}

/** All players sorted by level, then total earned (SDD section 5.2). */
export function useLeaderboard() {
  const fetcher = useCallback(async () => {
    const profiles = await backend.listProfiles();
    return sortLeaderboard(profiles);
  }, []);
  const { data, isLoading, error } = useQuery<Profile[]>("leaderboard", fetcher);
  return {
    all: data ?? [],
    top: (data ?? []).slice(0, TOP_PLAYERS),
    isLoading,
    error,
  };
}

/**
 * Mutations plus the transaction lifecycle:
 * idle -> signing -> confirming -> confirmed | error.
 * Each mutation resolves with the signature, or null if it failed.
 */
export function useSkillChain() {
  const { publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<TxState>({ status: "idle" });
  const busyRef = useRef(false);

  const run = useCallback(
    async (action: (ctx: TxContext) => Promise<string>) => {
      if (busyRef.current) return null;
      if (!publicKey) {
        setState({ status: "error", message: "Liga primeiro a carteira." });
        return null;
      }
      busyRef.current = true;
      setState({ status: "signing" });
      try {
        const signature = await action({
          owner: publicKey.toBase58(),
          sendTransaction,
          onConfirming: () => setState({ status: "confirming" }),
        });
        invalidateData();
        setState({ status: "confirmed", signature });
        return signature;
      } catch (err) {
        console.error(err);
        setState({ status: "error", message: toUserMessage(err) });
        return null;
      } finally {
        busyRef.current = false;
      }
    },
    [publicKey, sendTransaction],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return {
    state,
    busy: state.status === "signing" || state.status === "confirming",
    reset,
    initProfile: () => run((ctx) => backend.initProfile(ctx)),
    completeLevel2: (recipient: string) =>
      run((ctx) => backend.completeLevel2(ctx, recipient)),
    completeLevel3: (message: string) =>
      run((ctx) => backend.completeLevel3(ctx, message)),
    buyItem: (itemId: number) => run((ctx) => backend.buyItem(ctx, itemId)),
    equipItem: (itemId: number) => run((ctx) => backend.equipItem(ctx, itemId)),
    unequipItem: (slot: number) => run((ctx) => backend.unequipItem(ctx, slot)),
  };
}
