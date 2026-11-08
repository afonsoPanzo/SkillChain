import type { Metadata } from "next";
import { ChallengeLanding } from "@/components/skillchain/challenge-landing";
import { refFromParam } from "@/lib/blink/challenge";

type Props = { searchParams: Promise<{ ref?: string | string[] }> };

const TITLE = "SkillChain — Learn Solana by playing";
const DESCRIPTION =
  "You've been challenged: reach level 3 on SkillChain. Every level ends with a real transaction on Solana Devnet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default async function ChallengePage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const challenger = refFromParam(typeof ref === "string" ? ref : null);
  return <ChallengeLanding challenger={challenger} />;
}
