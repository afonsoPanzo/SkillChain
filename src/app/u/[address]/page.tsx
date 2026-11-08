import type { Metadata } from "next";
import { PublicProfileScreen } from "@/components/skillchain/public-profile-screen";
import { shortAddress } from "@/lib/skillchain/format";

type Props = { params: Promise<{ address: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const title = `SkillChain player ${shortAddress(address)}`;
  const description =
    "Check this player's SkillChain level, items and note straight from the Solana blockchain. No wallet needed.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", url: `/u/${address}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { address } = await params;
  return <PublicProfileScreen address={address} />;
}
