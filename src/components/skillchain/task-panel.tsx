"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter";
import {
  BASE_FEE_LAMPORTS,
  FAUCET_URL,
  MAX_NOTE_LENGTH,
  TRANSFER_LAMPORTS,
} from "@/lib/skillchain/constants";
import { formatSol, shortAddress } from "@/lib/skillchain/format";
import type { Lesson } from "@/lib/skillchain/lessons";
import { useBalance } from "@/lib/skillchain/use-balance";
import type { TxState } from "@/lib/skillchain/types";
import { TxStatus } from "./tx-status";

/** A Solana address: base58, 32 bytes. */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Fresh account (note PDA, about 153 bytes) rent plus fee, rounded up. */
const LEVEL_3_MIN_LAMPORTS = 3_000_000n;

function isSolanaAddress(value: string): boolean {
  if (!BASE58.test(value)) return false;
  try {
    return new PublicKey(value).toBytes().length === 32;
  } catch {
    return false;
  }
}

interface TaskPanelProps {
  lesson: Lesson;
  pointsLabel: string;
  tx: TxState;
  /** Runs the on-chain instruction. `input` is the recipient (level 2) or the note (level 3). */
  onSubmit: (input: string) => void;
}

/** The on-chain task of a level: create profile, send 0.01 SOL, or write a note. */
export function TaskPanel({ lesson, pointsLabel, tx, onSubmit }: TaskPanelProps) {
  const { publicKey } = useWallet();
  const { lamports, isLoading: balanceLoading, error: balanceError } = useBalance(publicKey);
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  const type = lesson.task.type;
  const busy = tx.status === "signing" || tx.status === "confirming";
  const hasSol = lamports !== null && lamports > 0n;
  const own = publicKey?.toBase58() ?? "";

  const recipientText = recipient.trim();
  const recipientFormat = isSolanaAddress(recipientText);
  const recipientSelf = recipientText === own;
  const recipientValid = recipientFormat && !recipientSelf;

  const messageBytes = new TextEncoder().encode(message.trim()).length;
  const messageValid = messageBytes >= 1 && messageBytes <= MAX_NOTE_LENGTH;

  const needed =
    type === "complete_level_2"
      ? BigInt(TRANSFER_LAMPORTS + BASE_FEE_LAMPORTS)
      : type === "complete_level_3"
        ? LEVEL_3_MIN_LAMPORTS
        : 1n;
  const enoughSol = lamports !== null && lamports >= needed;

  let inputsReady = true;
  if (type === "complete_level_2") inputsReady = recipientValid;
  if (type === "complete_level_3") inputsReady = messageValid;
  const ready = !busy && enoughSol && inputsReady;

  const label =
    tx.status === "signing"
      ? "A aguardar assinatura…"
      : tx.status === "confirming"
        ? "A confirmar…"
        : tx.status === "error"
          ? "Tentar de novo"
          : lesson.task.button;

  function submit() {
    if (type === "complete_level_2") onSubmit(recipientText);
    else if (type === "complete_level_3") onSubmit(message.trim());
    else onSubmit("");
  }

  let recipientHint = "Endereço Solana em base58";
  let recipientHintColor = "text-muted";
  if (recipientText) {
    if (recipientSelf) {
      recipientHint = "O destinatário não pode ser a tua própria carteira.";
      recipientHintColor = "text-coral-t";
    } else if (!recipientFormat) {
      recipientHint = "Endereço inválido.";
      recipientHintColor = "text-coral-t";
    } else {
      recipientHint = "Endereço válido";
      recipientHintColor = "text-lime";
    }
  }

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

        {type === "complete_level_2" && (
          <div className="flex flex-col gap-2.5">
            <label htmlFor="recipient" className="text-sm text-muted">
              Endereço do destinatário
            </label>
            <input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={busy}
              placeholder="Cola um endereço Solana"
              spellCheck={false}
              autoComplete="off"
              className={`h-[52px] rounded-xl border-[1.5px] bg-surface px-3.5 font-mono text-[13px] text-fg outline-none ${
                recipientText && !recipientValid ? "border-coral" : "border-line"
              }`}
            />
            <div className={`text-[13px] ${recipientHintColor}`}>{recipientHint}</div>
            {recipientValid && (
              <div className="flex flex-col gap-2 rounded-[14px] border border-line bg-surface px-4 py-3.5">
                <div className="text-[15px]">
                  Vais enviar <b className="text-lime">0,01 SOL</b> para{" "}
                  <span className="font-mono">{shortAddress(recipientText)}</span>
                </div>
                <div className="font-mono text-xs text-muted">
                  = 10 000 000 lamports + taxa de 5 000
                </div>
              </div>
            )}
          </div>
        )}

        {type === "complete_level_3" && (
          <div className="flex flex-col gap-2.5">
            <label htmlFor="note" className="text-sm text-muted">
              A tua nota on-chain
            </label>
            <textarea
              id="note"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Escreve uma mensagem para ficar na blockchain"
              className="resize-none rounded-xl border-[1.5px] border-line bg-surface p-3.5 text-base leading-[1.45] text-fg outline-none"
            />
            <div className="flex justify-between gap-3 font-mono text-[13px]">
              <span className="text-muted">
                seeds: [&quot;note&quot;, {own ? shortAddress(own) : "…"}]
              </span>
              <span className={messageBytes > MAX_NOTE_LENGTH ? "text-coral-t" : "text-muted"}>
                {messageBytes}/{MAX_NOTE_LENGTH}
              </span>
            </div>
          </div>
        )}

        {(
          <div className="flex flex-col gap-3.5 rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-sm text-muted">Saldo na Devnet</div>
              <div
                className={`font-mono text-xl font-semibold ${
                  enoughSol || balanceLoading ? "text-fg" : "text-coral-t"
                }`}
              >
                {balanceLoading
                  ? "…"
                  : balanceError || lamports === null
                    ? "—"
                    : `${formatSol(lamports)} SOL`}
              </div>
            </div>
            {!balanceLoading && !balanceError && !enoughSol && (
              <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
                <p className="m-0 text-[15px] leading-snug">
                  {!hasSol
                    ? "Precisas de SOL de teste para pagar o rent da conta."
                    : "Não tens SOL suficiente para esta tarefa."}
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

        <TxStatus state={tx} />
      </div>

      {(
        <button type="button" className="btn btn-primary" disabled={!ready} onClick={submit}>
          {label}
        </button>
      )}
    </>
  );
}
