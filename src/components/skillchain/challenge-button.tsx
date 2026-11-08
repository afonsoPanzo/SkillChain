"use client";

import { useState } from "react";
import { useT } from "@/i18n/use-t";
import { MAX_NAME_LENGTH, sanitizeName } from "@/lib/blink/challenge";
import { useDemo } from "@/lib/skillchain/use-demo";

const NAME_KEY = "skillchain.challengeName";

/** The name remembered on this device. This component only renders after the data has loaded. */
function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * "Challenge a friend": copies the shareable challenge link and offers a link
 * to open the same action in a Blinks inspector on Devnet.
 */
export function ChallengeButton({ address }: { address: string }) {
  const { t, lang } = useT();
  const demo = useDemo();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState(readSavedName);

  function changeName(value: string) {
    setName(value);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // Not remembered, still used for this link.
    }
  }

  // A simulated player does not exist on-chain, so there is nothing to challenge with.
  if (demo) return null;

  const cleanName = sanitizeName(name);
  const langQuery =
    (cleanName ? `&name=${encodeURIComponent(cleanName)}` : "") + (lang === "pt" ? "&lang=pt" : "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/challenge?ref=${address}${langQuery}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the inspector link below still works.
    }
  }

  // The inspector fetches the action API itself, so it gets the API URL.
  function inspectorUrl(): string {
    const action = `${window.location.origin}/api/actions/challenge?ref=${address}${langQuery}`;
    return `https://dial.to/devnet?action=solana-action:${encodeURIComponent(action)}`;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        value={name}
        onChange={(e) => changeName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        placeholder={t("blink.namePlaceholder")}
        aria-label={t("blink.nameLabel")}
        autoComplete="off"
        className="h-11 rounded-xl border-[1.5px] border-line bg-surface px-3 text-[14px] text-fg outline-none"
      />
      <button
        type="button"
        onClick={() => void copy()}
        className="h-12 w-full cursor-pointer rounded-xl border border-line bg-surface text-[15px] font-bold text-fg hover:border-lime"
      >
        {copied ? t("blink.copied") : t("blink.challenge")}
      </button>
      <div className="text-[13px] text-muted">
        {t("blink.hint")}{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.open(inspectorUrl(), "_blank", "noopener,noreferrer");
          }}
        >
          {t("blink.test")}
        </a>
      </div>
    </div>
  );
}
