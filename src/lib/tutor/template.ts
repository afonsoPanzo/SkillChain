import { formatNumberFor, makeT, type Lang } from "../../i18n/translate";
import { formatSol, shortAddress } from "../skillchain/format";
import type { TxFacts } from "./facts";

/**
 * Explanation built from the facts alone, without AI. It is the fallback when
 * the model fails, times out or runs out of quota.
 */
export function explainWithTemplate(facts: TxFacts, lang: Lang): string {
  const t = makeT(lang);
  const n = (value: number) => formatNumberFor(lang, value);
  const sol = (lamports: number) => formatSol(lamports, lang);
  const parts: string[] = [];

  const base = {
    signer: shortAddress(facts.signer),
    fee: n(facts.feeLamports),
    sol: sol(facts.feeLamports),
  };
  parts.push(t(facts.success ? "tutor.tpl.sent.ok" : "tutor.tpl.sent.failed", base));

  const created = facts.createdAccounts[0];
  const rent = created
    ? { rent: n(created.rentLamports), sol: sol(created.rentLamports) }
    : null;

  if (facts.level === 1) {
    const profile = facts.accounts.find((a) => a.role === "profile_pda");
    if (profile) parts.push(t("tutor.tpl.l1", { profile: shortAddress(profile.address) }));
    if (rent) parts.push(t("tutor.tpl.rent", rent));
  } else if (facts.level === 2) {
    const transfer = facts.transfers[0];
    if (transfer) {
      parts.push(
        t("tutor.tpl.l2", {
          amount: n(transfer.lamports),
          sol: sol(transfer.lamports),
          recipient: shortAddress(transfer.to),
        }),
      );
    }
    parts.push(t("tutor.tpl.l2.tx"));
  } else {
    const note = facts.accounts.find((a) => a.role === "note_pda");
    if (note) {
      parts.push(
        t("tutor.tpl.l3", {
          note: shortAddress(note.address),
          message: facts.message ?? "",
        }),
      );
    }
    if (rent) parts.push(t("tutor.tpl.rent", rent));
  }

  const event = facts.events[0];
  if (event) {
    parts.push(t("tutor.tpl.event", { level: event.level, points: n(event.points) }));
  }
  return parts.join(" ");
}
