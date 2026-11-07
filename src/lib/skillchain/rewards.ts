import { ITEMS, hasItem } from "./constants";
import { itemKey, type TFunction } from "../../i18n/translate";
import type { Profile } from "./types";

export interface NextReward {
  text: string;
  /** "points/price", empty when there is nothing left to unlock. */
  count: string;
  /** 0 to 100. */
  percent: number;
}

/** The item the player should aim for next, derived from constants only. */
export function getNextReward(profile: Profile, t: TFunction): NextReward {
  const missing = ITEMS.filter((item) => !hasItem(profile.items, item.id)).sort(
    (a, b) => a.price - b.price,
  );
  if (missing.length === 0) {
    return { text: t("reward.all"), count: "", percent: 100 };
  }

  const buyable = missing.find(
    (item) => profile.level >= item.minLevel && profile.points >= item.price,
  );
  const target =
    buyable ?? missing.find((item) => profile.level >= item.minLevel) ?? missing[0];

  const item = t(itemKey(target.id));
  const text = buyable
    ? t("reward.buy", { item })
    : profile.level < target.minLevel
      ? t("reward.level", { item, n: target.minLevel })
      : t("reward.need", { item, n: target.price - profile.points });

  return {
    text,
    count: `${Math.min(profile.points, target.price)}/${target.price}`,
    percent: Math.min(100, (profile.points / target.price) * 100),
  };
}
