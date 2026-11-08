import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { useAccount } from "@/lib/skillchain/use-account";
import { DemoExplorerNote } from "./demo-explorer-note";
import { TOTAL_LEVELS } from "@/lib/skillchain/constants";
import { explorerTxUrl, shortAddress } from "@/lib/skillchain/format";

interface LevelCompleteProps {
  level: number;
  gain: number;
  signature: string;
  /** The mock backend produces fake signatures that do not exist on-chain. */
  isMock: boolean;
}

export function LevelComplete({ level, gain, signature, isMock }: LevelCompleteProps) {
  const { t } = useT();
  const { isDemo } = useAccount();
  const isLast = level >= TOTAL_LEVELS;
  const href = isLast ? "/shop" : `/learn/${level + 1}`;
  const label = isLast ? t("level.complete.shop") : t("level.complete.next", { n: level + 1 });

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-4 text-center">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          {t("level.complete.kicker", { n: level })}
        </div>
        <div className="animate-burst text-[80px] leading-[0.9] font-extrabold tracking-[-0.04em] text-lime">
          +{gain}
        </div>
        <div className="text-lg">{t("level.complete.points")}</div>

        <div className="mt-2 flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 text-left">
          <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
            {t("level.complete.proof")}
          </div>
          <div className="font-mono text-[13px] break-all">{shortAddress(signature)}</div>
          {isDemo ? (
            <DemoExplorerNote kind="tx" />
          ) : isMock ? (
            <p className="m-0 text-[13px] text-coral-t">
              {t("level.complete.mockSignature")}
            </p>
          ) : (
            <a
              href={explorerTxUrl(signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-bold"
            >
              {t("common.viewExplorer")}
            </a>
          )}
        </div>
      </div>
      <Link href={href} className="btn btn-primary">
        {label}
      </Link>
    </>
  );
}
