"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/format";
import type { Tone } from "@/types";
import { toneSoft } from "./tones";

export type CardVariant = "clay" | "bento" | "sticker" | "soft" | "flat";

// DESIGN.md §9.1
const variants: Record<CardVariant, string> = {
  clay: "bg-white shadow-clay rounded-[28px]",
  bento: "bg-white border border-line-cool shadow-soft rounded-2xl",
  sticker: "bg-white border-2 border-ink shadow-pop-lg rounded-[24px]",
  soft: "rounded-[24px]",
  flat: "bg-white rounded-2xl border border-line",
};

interface Props extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  tone?: Tone;
  interactive?: boolean;
  pad?: boolean;
}

export function Card({ variant = "clay", tone = "lavender", interactive, pad = true, className, ...rest }: Props) {
  return (
    <div
      className={cn(
        variants[variant],
        variant === "soft" && toneSoft[tone],
        pad && "p-5 sm:p-6",
        interactive && "cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-clay-lg",
        className,
      )}
      {...rest}
    />
  );
}
