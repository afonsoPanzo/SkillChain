import { ITEMS, hasItem } from "./constants";
import type { Profile } from "./types";

export interface NextReward {
  text: string;
  /** "points/price", empty when there is nothing left to unlock. */
  count: string;
  /** 0 to 100. */
  percent: number;
}

/** The item the player should aim for next, derived from constants only. */
export function getNextReward(profile: Profile): NextReward {
  const missing = ITEMS.filter((item) => !hasItem(profile.items, item.id)).sort(
    (a, b) => a.price - b.price,
  );
  if (missing.length === 0) {
    return { text: "Já tens todos os itens", count: "", percent: 100 };
  }

  const buyable = missing.find(
    (item) => profile.level >= item.minLevel && profile.points >= item.price,
  );
  const target =
    buyable ?? missing.find((item) => profile.level >= item.minLevel) ?? missing[0];

  const text = buyable
    ? `Já podes desbloquear: ${target.name}`
    : profile.level < target.minLevel
      ? `${target.name} desbloqueia no nível ${target.minLevel}`
      : `Faltam ${target.price - profile.points} pts para ${target.name}`;

  return {
    text,
    count: `${Math.min(profile.points, target.price)}/${target.price}`,
    percent: Math.min(100, (profile.points / target.price) * 100),
  };
}
