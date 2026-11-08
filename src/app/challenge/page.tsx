import type { Metadata } from "next";
import { ChallengeLanding } from "@/components/skillchain/challenge-landing";
import { challengerLabel, refFromParam, sanitizeName } from "@/lib/blink/challenge";

type Props = { searchParams: Promise<{ ref?: string | string[]; name?: string | string[] }> };

const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : null;

const TITLE = "SkillChain — Learn Solana by playing";
const DESCRIPTION =
  "You've been challenged: reach level 3 on SkillChain. Every level ends with a real transaction on Solana Devnet.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ref, name } = await searchParams;
  const who = challengerLabel(refFromParam(first(ref)), sanitizeName(first(name)));
  const description = who
    ? `${who} challenges you: reach level 3 on SkillChain. Every level ends with a real transaction on Solana Devnet.`
    : DESCRIPTION;
  return {
    title: TITLE,
    description,
    openGraph: { title: TITLE, description, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description },
  };
}

export default async function ChallengePage({ searchParams }: Props) {
  const { ref, name } = await searchParams;
  const challenger = refFromParam(first(ref));
  const label = challengerLabel(challenger, sanitizeName(first(name)));
  return <ChallengeLanding challenger={challenger} label={label} />;
}
