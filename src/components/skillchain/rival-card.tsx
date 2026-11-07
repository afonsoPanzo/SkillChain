import Link from "next/link";
import type { Rival } from "@/lib/skillchain/rival";

/** The player just above you, and what it takes to pass them. */
export function RivalCard({ rival }: { rival: Rival }) {
  return (
    <Link
      href={rival.href}
      className="flex items-center justify-between gap-3 rounded-2xl border-[1.5px] border-lime bg-lime/8 px-4 py-3.5 text-left text-fg hover:text-fg hover:no-underline"
    >
      <div className="flex flex-col gap-0.5">
        <div className="text-base font-extrabold">{rival.title}</div>
        <div className="text-[13px] text-fg-3">{rival.sub}</div>
      </div>
      <div className="text-lg text-lime">→</div>
    </Link>
  );
}
