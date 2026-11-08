import type { Metadata } from "next";
import { ChallengeFromScreen } from "@/components/skillchain/challenge-from-screen";
import { challengerLabel, sanitizeName } from "@/lib/blink/challenge";
import { shortAddress } from "@/lib/skillchain/format";

type Props = {
  params: Promise<{ from: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
};

const first = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { from } = await params;
  const { name } = await searchParams;
  const who = challengerLabel(null, sanitizeName(first(name))) ?? shortAddress(from);
  const title = "SkillChain — Learn Solana by playing";
  const description = `${who} challenges you: finish all 3 SkillChain levels faster. Every time is verified on the Solana blockchain.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ChallengeFromPage({ params, searchParams }: Props) {
  const { from } = await params;
  const { name } = await searchParams;
  return <ChallengeFromScreen from={from} name={sanitizeName(first(name))} />;
}
