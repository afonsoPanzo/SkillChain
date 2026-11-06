"use client";

import { useWallet } from "@solana/wallet-adapter";
import { FAUCET_URL } from "@/lib/skillchain/constants";
import { formatSol } from "@/lib/skillchain/format";
import type { Lesson } from "@/lib/skillchain/lessons";
import { useBalance } from "@/lib/skillchain/use-balance";
import type { TxState } from "@/lib/skillchain/types";
import { TxStatus } from "./tx-status";

interface TaskPanelProps {
  lesson: Lesson;
  pointsLabel: string;
  alreadyDone: boolean;
  tx: TxState;
  /** Runs the on-chain instruction of the level. */
  onSubmit: () => void;
}

/** The on-chain task of a level. Phase 1 implements level 1 (init_profile). */
export function TaskPanel({ lesson, pointsLabel, alreadyDone, tx, onSubmit }: TaskPanelProps) {
  const { publicKey } = useWallet();
  const { lamports, isLoading: balanceLoading, error: balanceError } = useBalance(publicKey);

  const busy = tx.status === "signing" || tx.status === "confirming";
  const isLevel1 = lesson.task.type === "init_profile";
  const hasSol = lamports !== null && lamports > 0n;
  const ready = !alreadyDone && !busy && (!isLevel1 || hasSol);

  const label =
    tx.status === "signing"
      ? "A aguardar assinatura…"
      : tx.status === "confirming"
        ? "A confirmar…"
        : tx.status === "error"
          ? "Tentar de novo"
          : lesson.task.button;

  return (
    <>
      <div className="flex flex-1 flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="font-mono text-xs tracking-[0.08em] text-lime uppercase">
            Tarefa on-chain · {pointsLabel}
          </div>
          <h2 className="m-0 text-[30px] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance">
            {lesson.task.title}
          </h2>
          <p className="m-0 text-base leading-normal text-fg-3 text-pretty">
            {lesson.task.description}
          </p>
        </div>

        {alreadyDone && (
          <div className="rounded-[14px] border border-line bg-surface p-4 text-[15px] text-fg-3">
            Já concluíste este nível on-chain. Cada nível só pode ser concluído uma vez.
          </div>
        )}

        {!alreadyDone && isLevel1 && (
          <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm text-muted">Saldo na Devnet</div>
              <div
                className={`font-mono text-xl font-semibold ${
                  hasSol ? "text-fg" : "text-coral-t"
                }`}
              >
                {balanceLoading
                  ? "…"
                  : balanceError || lamports === null
                    ? "—"
                    : `${formatSol(lamports)} SOL`}
              </div>
            </div>
            {!balanceLoading && !balanceError && !hasSol && (
              <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
                <p className="m-0 text-[15px] leading-snug">
                  Precisas de SOL de teste para pagar o rent da conta.
                </p>
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-bold"
                >
                  Abrir o faucet ↗
                </a>
              </div>
            )}
            {balanceError && (
              <p className="m-0 text-sm text-coral-t">
                Não foi possível ler o saldo. Verifica a ligação à Devnet.
              </p>
            )}
          </div>
        )}

        {!alreadyDone && <TxStatus state={tx} />}
      </div>

      {!alreadyDone && (
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={onSubmit}>
          {label}
        </button>
      )}
    </>
  );
}
