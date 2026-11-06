import Link from "next/link";
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
  const isLast = level >= TOTAL_LEVELS;
  const href = isLast ? "/shop" : `/learn/${level + 1}`;
  const label = isLast ? "Ir à loja" : `Começar o nível ${level + 1}`;

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3.5 py-4 text-center">
        <div className="font-mono text-xs tracking-[0.08em] text-muted uppercase">
          Nível {level} concluído
        </div>
        <div className="animate-burst text-[80px] leading-[0.9] font-extrabold tracking-[-0.04em] text-lime">
          +{gain}
        </div>
        <div className="text-lg">pontos ganhos</div>

        <div className="mt-2 flex w-full flex-col gap-2 rounded-2xl border border-line bg-surface p-4 text-left">
          <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">
            Prova on-chain
          </div>
          <div className="font-mono text-[13px] break-all">{shortAddress(signature)}</div>
          {isMock ? (
            <p className="m-0 text-[13px] text-coral-t">
              Assinatura simulada (modo mock): não existe no Explorer.
            </p>
          ) : (
            <a
              href={explorerTxUrl(signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] font-bold"
            >
              Ver no Solana Explorer ↗
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
