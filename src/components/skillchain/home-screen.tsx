"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter";
import { FAUCET_URL, TOTAL_LEVELS, TOTAL_POINTS } from "@/lib/skillchain/constants";
import { ConnectButton } from "./connect-button";

const LOOP = [
  { n: "01", title: "Lê", sub: "Ecrãs curtos" },
  { n: "02", title: "Responde", sub: "Quiz" },
  { n: "03", title: "Assina", sub: "Tarefa on-chain" },
] as const;

export function HomeScreen() {
  const { connected } = useWallet();

  return (
    <div className="flex flex-col gap-7 pt-5">
      <div className="flex flex-col gap-4">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          {TOTAL_LEVELS} níveis · {TOTAL_POINTS} pontos · 100% on-chain
        </div>
        <h1 className="m-0 text-[46px] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance">
          Aprende Solana <span className="text-lime">a jogar.</span>
        </h1>
        <p className="m-0 text-[17px] leading-normal text-fg-3 text-pretty">
          Cada nível termina com uma tarefa real na blockchain. A transacção que assinas é a
          prova de que passaste.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LOOP.map((step) => (
          <div
            key={step.n}
            className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-surface p-3.5"
          >
            <div className="font-mono text-xs text-lime">{step.n}</div>
            <div className="text-[15px] font-bold">{step.title}</div>
            <div className="text-[13px] leading-snug text-muted">{step.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3.5">
        {connected ? (
          <Link href="/learn" className="btn btn-primary">
            Começar
          </Link>
        ) : (
          <ConnectButton />
        )}
        <div className="text-center text-sm text-muted">
          Sem SOL de teste?{" "}
          <a href={FAUCET_URL} target="_blank" rel="noopener noreferrer">
            Pede no faucet da Devnet.
          </a>
        </div>
      </div>
    </div>
  );
}
