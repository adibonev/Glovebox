"use client";

import { useState } from "react";

/** A link to hand to someone else, with a button that copies it (a Passport Link, an invite). */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard (an insecure context, an old browser): the address is on screen to select.
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-ink2 px-3 py-2.5 font-mono text-[13px] text-silver">
        {url}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className="rounded-lg border border-white/12 px-4 py-2.5 font-body text-sm font-semibold text-ivory transition hover:border-copper/50 hover:text-copper"
      >
        {copied ? "Копирано" : "Копирай"}
      </button>
    </div>
  );
}
