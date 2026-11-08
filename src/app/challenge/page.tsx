import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChallengeLanding } from "@/components/skillchain/challenge-landing";
import { challengerLabel, refFromParam, sanitizeName } from "@/lib/blink/challenge";

type Props = { searchParams: Promise<{ ref?: string | string[]; name?: string | string[] }> };

const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : null;

const TITLE = "SkillChain — Learn Solana by playing";
const DESCRIPTION =
  "You've been challenged: finish all 3 SkillChain levels. Every level ends with a real transaction on Solana Devnet.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
    twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  };
}

export default async function ChallengePage({ searchParams }: Props) {
  const { ref, name } = await searchParams;
  const challenger = refFromParam(first(ref));
  const cleanName = sanitizeName(first(name));

  // Earlier shared links used /challenge?ref=<address>: send them to the new page.
  if (challenger) {
    redirect(`/challenge/${challenger}${cleanName ? `?name=${encodeURIComponent(cleanName)}` : ""}`);
  }
  return <ChallengeLanding challenger={null} label={challengerLabel(null, cleanName)} />;
}
