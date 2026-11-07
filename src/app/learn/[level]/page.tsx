import { notFound } from "next/navigation";
import { LevelScreen } from "@/components/skillchain/level-screen";
import { TOTAL_LEVELS } from "@/lib/skillchain/constants";

export default async function LevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  const n = Number(level);
  if (!Number.isInteger(n) || n < 1 || n > TOTAL_LEVELS) notFound();
  return <LevelScreen key={n} level={n} />;
}
