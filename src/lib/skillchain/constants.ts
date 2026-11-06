/**
 * Mirror of the on-chain constants (SDD section 4.4).
 * These values MUST match anchor/programs/skillchain/src/lib.rs.
 */

export const POINTS_LEVEL_1 = 100;
export const POINTS_LEVEL_2 = 150;
export const POINTS_LEVEL_3 = 200;

/** Points awarded by each level, indexed by `level - 1`. */
export const LEVEL_POINTS = [POINTS_LEVEL_1, POINTS_LEVEL_2, POINTS_LEVEL_3] as const;
export const TOTAL_LEVELS = LEVEL_POINTS.length;
export const TOTAL_POINTS = POINTS_LEVEL_1 + POINTS_LEVEL_2 + POINTS_LEVEL_3;

/** Level 2 transfer: 0.01 SOL. */
export const TRANSFER_LAMPORTS = 10_000_000;
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const BASE_FEE_LAMPORTS = 5_000;

/** "No item equipped" marker. */
export const NONE = 255;

export const MAX_NOTE_LENGTH = 100;

export const ITEM_CATEGORY = { frame: 0, accessory: 1, title: 2 } as const;
export type ItemCategory = keyof typeof ITEM_CATEGORY;

export interface ItemDef {
  id: number;
  category: ItemCategory;
  name: string;
  price: number;
  /** Minimum `profile.level` required to buy the item. */
  minLevel: number;
  /** Visual asset in /public. Titles are rendered as text pills. */
  asset: string | null;
}

export const ITEMS: readonly ItemDef[] = [
  {
    id: 0,
    category: "frame",
    name: "Moldura Devnet",
    price: 100,
    minLevel: 1,
    asset: "/items/avatar-frame-devnet.svg",
  },
  {
    id: 1,
    category: "frame",
    name: "Moldura Validador",
    price: 250,
    minLevel: 3,
    asset: "/items/avatar-frame-validator.svg",
  },
  {
    id: 2,
    category: "accessory",
    name: "Óculos Turbo",
    price: 150,
    minLevel: 2,
    asset: "/items/avatar-turbo-goggles.svg",
  },
  {
    id: 3,
    category: "title",
    name: "Mestre das PDAs",
    price: 200,
    minLevel: 3,
    asset: null,
  },
] as const;

export const ITEMS_TOTAL_PRICE = ITEMS.reduce((sum, item) => sum + item.price, 0);

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  frame: "Moldura",
  accessory: "Acessório",
  title: "Título",
};

export function getItem(id: number): ItemDef | undefined {
  return ITEMS.find((item) => item.id === id);
}

export function hasItem(itemsBitmask: number, id: number): boolean {
  return ((itemsBitmask >> id) & 1) === 1;
}

export const FAUCET_URL = "https://faucet.solana.com";
export const CLUSTER = "devnet";
