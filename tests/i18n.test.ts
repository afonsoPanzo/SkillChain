import { describe, expect, it } from "vitest";
import { en } from "../src/i18n/en";
import { pt } from "../src/i18n/pt";
import { DICTIONARIES, formatNumberFor, itemKey, makeT, translate } from "../src/i18n/translate";
import { ITEMS } from "../src/lib/skillchain/constants";
import enLessons from "../src/content/lessons.en.json";
import ptLessons from "../src/content/lessons.pt.json";
import { formatSol } from "../src/lib/skillchain/format";
import { toUserMessage } from "../src/lib/skillchain/errors";
import { getNextReward } from "../src/lib/skillchain/rewards";
import type { Profile } from "../src/lib/skillchain/types";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("have exactly the same keys", () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort());
  });

  it("use the same placeholders in both languages", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(pt[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("have no empty strings", () => {
    for (const lang of ["en", "pt"] as const) {
      for (const [key, value] of Object.entries(DICTIONARIES[lang])) {
        expect(value.length, `${lang}:${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("have a name and a category for every item", () => {
    for (const item of ITEMS) {
      expect(en[itemKey(item.id)]).toBeTruthy();
      expect(pt[`category.${item.category}`]).toBeTruthy();
    }
  });

  it("replaces placeholders and keeps unknown ones", () => {
    expect(translate("en", "reward.need", { n: 5, item: "X" })).toBe("5 more pts for X");
    expect(translate("pt", "reward.need", { n: 5, item: "X" })).toBe("Faltam 5 pts para X");
  });
});

describe("lessons", () => {
  it("have the same structure in English and Portuguese", () => {
    const shape = (lessons: typeof enLessons) =>
      lessons.map((l) => ({
        level: l.level,
        steps: l.steps.map((s) => ({ type: s.type, hasTerm: "term" in s })),
        quiz: l.quiz.map((q) => ({ options: q.options.length, answer: q.answer })),
        task: l.task.type,
      }));
    expect(shape(ptLessons as typeof enLessons)).toEqual(shape(enLessons));
  });

  it("keep Solana terms untranslated", () => {
    const text = JSON.stringify(enLessons) + JSON.stringify(ptLessons);
    for (const term of ["PDA", "rent", "lamports"]) expect(text).toContain(term);
  });
});

describe("number formatting", () => {
  it("follows the language", () => {
    expect(formatSol(500_000_000, "en")).toBe("0.5");
    expect(formatSol(500_000_000, "pt")).toBe("0,5");
    expect(formatNumberFor("en", 10_000_000)).toBe("10,000,000");
    expect(formatNumberFor("pt", 1234.5, 1)).toMatch(/^1\s?234,5$/);
  });
});

describe("translated messages", () => {
  it("maps program errors in both languages", () => {
    const err = new Error('{"Custom":6009}');
    expect(toUserMessage(err, makeT("en"))).toBe("Invalid equipment slot.");
    expect(toUserMessage(err, makeT("pt"))).toBe("Espaço de equipamento inválido.");
  });

  it("translates the next-reward card", () => {
    const profile: Profile = {
      owner: "A".repeat(32),
      level: 1,
      points: 100,
      totalEarned: 100,
      items: 0,
      equippedFrame: 255,
      equippedAccessory: 255,
      equippedTitle: 255,
    };
    expect(getNextReward(profile, makeT("en")).text).toBe("You can unlock Devnet Frame now");
    expect(getNextReward(profile, makeT("pt")).text).toBe("Já podes desbloquear: Moldura Devnet");
  });
});
