import type { Metadata } from "next";
import { DuelScreen } from "@/components/skillchain/duel-screen";
import { shortAddress } from "@/lib/skillchain/format";

type Props = { params: Promise<{ from: string; to: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { from, to } = await params;
  const title = `SkillChain duel: ${shortAddress(from)} vs ${shortAddress(to)}`;
  const description =
    "Who finishes all 3 SkillChain levels faster? Both times are verified on the Solana blockchain.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DuelPage({ params }: Props) {
  const { from, to } = await params;
  return <DuelScreen from={from} to={to} />;
}
