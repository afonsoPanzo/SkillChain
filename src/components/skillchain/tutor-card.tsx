"use client";

import { useState } from "react";
import { useT } from "@/i18n/use-t";
import type { TKey } from "@/i18n/translate";
import { explorerTxUrl } from "@/lib/skillchain/format";
import { useAccount } from "@/lib/skillchain/use-account";
import { TutorChat } from "./tutor-chat";

type View =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string; source: "ai" | "template" }
  | { status: "error"; message: TKey };

const ERROR_KEY: Record<string, TKey> = {
  rate_limited: "tutor.error.rate",
  transaction_not_found: "tutor.error.notFound",
  not_skillchain: "tutor.error.notFound",
};

/**
 * "Explain my transaction": an AI tutor (or a template) explains the player's real transaction.
 * Pass `signature` right after completing a level. For a level finished earlier, pass `owner`
 * and the transaction is looked up on Devnet first.
 */
export function TutorCard({
  signature: knownSignature,
  owner,
  level,
}: {
  signature?: string;
  owner?: string;
  level: number;
}) {
  const { t, lang } = useT();
  const { isDemo } = useAccount();
  const [view, setView] = useState<View>({ status: "idle" });
  const [found, setFound] = useState<string | null>(null);
  const signature = knownSignature ?? found ?? "";

  async function findSignature(): Promise<string | null> {
    const response = await fetch("/api/tutor/find", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner, level }),
    });
    const data = (await response.json()) as { signature?: string; error?: string };
    if (!response.ok || !data.signature) {
      setView({ status: "error", message: ERROR_KEY[data.error ?? ""] ?? "tutor.error.generic" });
      return null;
    }
    setFound(data.signature);
    return data.signature;
  }

  async function explain() {
    setView({ status: "loading" });
    try {
      const target = knownSignature ?? found ?? (owner ? await findSignature() : null);
      if (!target) {
        setView((current) =>
          current.status === "loading" ? { status: "error", message: "tutor.error.generic" } : current,
        );
        return;
      }
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature: target, level, lang }),
      });
      const data = (await response.json()) as { text?: string; source?: "ai" | "template"; error?: string };
      if (!response.ok || !data.text || !data.source) {
        setView({ status: "error", message: ERROR_KEY[data.error ?? ""] ?? "tutor.error.generic" });
        return;
      }
      setView({ status: "done", text: data.text, source: data.source });
    } catch {
      setView({ status: "error", message: "tutor.error.generic" });
    }
  }

  const button =
    "btn h-[54px] w-full rounded-2xl border border-line bg-surface text-base font-bold text-fg hover:border-lime disabled:opacity-60";

  // Demo mode never calls the server: the example text is fixed.
  if (isDemo) {
    return (
      <>
        <Card label={t("tutor.label.demo")}>
          <p className="m-0 text-[15px] leading-normal text-fg-3">
            {t(`tutor.demo.${Math.min(Math.max(level, 1), 3)}` as TKey)}
          </p>
          <p className="m-0 text-[13px] leading-snug text-coral-t">{t("tutor.demo.note")}</p>
        </Card>
        <TutorChat signature={signature} level={level} demo />
      </>
    );
  }

  if (view.status === "done") {
    return (
      <>
      <Card label={view.source === "ai" ? t("tutor.label.ai") : t("tutor.label.template")}>
        <p className="m-0 text-[15px] leading-normal text-fg-3">{view.text}</p>
        {view.source === "template" && (
          <p className="m-0 text-[13px] leading-snug text-muted">{t("tutor.templateNote")}</p>
        )}
        <a
          href={explorerTxUrl(signature)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] font-bold"
        >
          {t("common.viewExplorer")}
        </a>
      </Card>
      <TutorChat signature={signature} level={level} demo={false} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        className={button}
        disabled={view.status === "loading"}
        onClick={() => void explain()}
      >
        {view.status === "loading"
          ? t("tutor.loading")
          : view.status === "error"
            ? t("pub.retry")
            : t("tutor.explain")}
      </button>
      {view.status === "error" && (
        <p role="alert" className="m-0 text-[14px] text-coral-t">
          {t(view.message)}
        </p>
      )}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 text-left">
      <div className="text-xs font-bold tracking-[0.06em] text-violet uppercase">{label}</div>
      {children}
    </div>
  );
}
