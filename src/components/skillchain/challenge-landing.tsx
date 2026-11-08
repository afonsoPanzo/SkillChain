"use client";

import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { shortAddress } from "@/lib/skillchain/format";

/** Page behind a shared challenge link, for people whose client does not render Blinks. */
export function ChallengeLanding({ challenger }: { challenger: string | null }) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-5 pt-5">
      <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
        {t("challenge.kicker")}
      </div>
      <h1 className="m-0 text-[38px] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance">
        {challenger
          ? t("challenge.titleRef", { ref: shortAddress(challenger) })
          : t("challenge.title")}
      </h1>
      <p className="m-0 text-[17px] leading-normal text-fg-3 text-pretty">{t("challenge.body")}</p>
      <Link href="/" className="btn btn-primary">
        {t("challenge.cta")}
      </Link>
      {challenger && (
        <Link href={`/u/${challenger}`} className="text-center text-[15px] font-bold">
          {t("challenge.seeProfile")}
        </Link>
      )}
    </div>
  );
}
