"use client";

import type { ReactNode } from "react";
import { FlaskIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/format";
import type { Tone } from "@/types";
import { toneBg, toneSoft, toneText } from "./tones";

type BadgeKind = Tone | "success" | "warning" | "danger" | "info" | "ink" | "neutral";

const map: Record<BadgeKind, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  ink: "bg-pill text-white",
  neutral: "bg-canvas text-ink-soft",
  purple: `${toneSoft.purple} ${toneText.purple}`,
  lavender: `${toneSoft.lavender} ${toneText.lavender}`,
  sun: `${toneSoft.sun} ${toneText.sun}`,
  coral: `${toneSoft.coral} ${toneText.coral}`,
  mint: `${toneSoft.mint} ${toneText.mint}`,
  sky: `${toneSoft.sky} ${toneText.sky}`,
  pink: `${toneSoft.pink} ${toneText.pink}`,
  cream: `${toneSoft.cream} ${toneText.cream}`,
};

const dot: Partial<Record<BadgeKind, string>> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  purple: "bg-purple",
  coral: "bg-coral",
  mint: "bg-mint-deep",
  sun: "bg-sun-deep",
};

export function Badge({ kind = "neutral", children, withDot, pulse, className }: { kind?: BadgeKind; children: ReactNode; withDot?: boolean; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 max-w-full items-center gap-1.5 truncate whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold tracking-[0.03em]", map[kind], className)}>
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full", dot[kind] ?? "bg-current", pulse && "animate-pulse")} aria-hidden />}
      {children}
    </span>
  );
}

/** Tilted sticker kicker (DESIGN.md §1.3). */
export function Kicker({ children, tone = "sun", className, rotate = true }: { children: ReactNode; tone?: Tone; className?: string; rotate?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-ink shadow-pop", toneBg[tone], rotate && "-rotate-1", className)}>
      {children}
    </span>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-bold uppercase tracking-[0.14em] text-muted", className)}>{children}</p>;
}

/** Honest label for anything simulated. */
export function DemoTag({ children = "Simulated", className }: { children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-sun-deep/50 bg-sun-soft px-2 text-[11px] font-bold text-sun-deep", className)}>
      <FlaskIcon size={12} weight="bold" aria-hidden />
      {children}
    </span>
  );
}

/** Comic burst sticker (ZAP!, NEW!, YOU!). */
export function Burst({ children, tone = "sun", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("relative inline-grid h-20 w-20 place-items-center", className)} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[3px_3px_0_#1c1b2b]">
        <polygon
          points="50,2 61,22 84,12 78,36 98,46 79,60 88,84 63,78 54,98 42,79 18,90 22,65 2,54 21,40 12,16 37,22"
          className={cn("stroke-ink", { sun: "fill-sun", coral: "fill-coral", mint: "fill-mint", sky: "fill-sky", pink: "fill-pink", lavender: "fill-lavender", purple: "fill-purple", cream: "fill-cream" }[tone])}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative font-display text-sm font-extrabold tracking-tight text-ink">{children}</span>
    </span>
  );
}

export function Highlight({ children, tone = "sun" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span className={cn("absolute inset-x-0 bottom-1 z-0 h-4 -rotate-1 rounded-full sm:h-5", toneBg[tone])} aria-hidden />
    </span>
  );
}
