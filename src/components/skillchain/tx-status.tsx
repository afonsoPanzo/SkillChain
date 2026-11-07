import { useT } from "@/i18n/use-t";
import { explorerTxUrl } from "@/lib/skillchain/format";
import type { TxState } from "@/lib/skillchain/types";

const STEPS = ["tx.sign", "tx.confirm", "tx.done"] as const;

function stageOf(state: TxState): number {
  switch (state.status) {
    case "signing":
      return 0;
    case "confirming":
      return 1;
    case "confirmed":
      return 2;
    default:
      return -1;
  }
}

/** Transaction progress: signing -> confirming -> confirmed, or an error. */
export function TxStatus({ state }: { state: TxState }) {
  const { t } = useT();
  if (state.status === "idle") return null;
  const stage = stageOf(state);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4"
    >
      {STEPS.map((label, i) => {
        const done = stage > i || (stage === 2 && i === 2);
        const active = stage === i && i < 2;
        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={`size-2.5 flex-none rounded-full ${
                done ? "bg-lime" : active ? "animate-pulse-dot bg-violet" : "bg-line"
              }`}
            />
            <span className={`text-[15px] ${done || active ? "text-fg" : "text-muted"}`}>
              {t(label)}
            </span>
          </div>
        );
      })}
      {state.status === "confirmed" && (
        <a
          href={explorerTxUrl(state.signature)}
          target="_blank"
          rel="noopener noreferrer"
          className="border-t border-line pt-3 text-[15px] font-bold"
        >
          {t("common.viewExplorer")}
        </a>
      )}
      {state.status === "error" && (
        <p className="border-t border-line pt-3 text-[15px] text-coral-t">
          {state.message}
        </p>
      )}
    </div>
  );
}
