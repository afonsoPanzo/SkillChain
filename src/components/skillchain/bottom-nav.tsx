"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "@/lib/skillchain/use-account";
import { useT } from "@/i18n/use-t";

const TABS = [
  { href: "/learn", label: "nav.learn" },
  { href: "/shop", label: "nav.shop" },
  { href: "/profile", label: "nav.profile" },
  { href: "/leaderboard", label: "nav.leaderboard" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { connected } = useAccount();
  const { t } = useT();

  // Hidden while the player is inside a level, as in the design.
  const inLesson = /^\/learn\/\d+/.test(pathname);
  if (!connected || inLesson) return null;

  return (
    <nav
      aria-label={t("nav.aria")}
      className="sticky bottom-0 z-10 grid grid-cols-4 border-t border-divider bg-ink/95 backdrop-blur-[10px]"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-[60px] items-center justify-center border-t-2 text-sm font-bold hover:no-underline ${
              active
                ? "border-lime text-lime hover:text-lime"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {t(tab.label)}
          </Link>
        );
      })}
    </nav>
  );
}
