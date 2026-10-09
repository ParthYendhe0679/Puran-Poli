"use client";

import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/format";

export type ButtonVariant = "primary" | "purple" | "secondary" | "outline" | "soft" | "danger" | "success" | "ghost" | "sun";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-purple";

// DESIGN.md §8.1
const variants: Record<ButtonVariant, string> = {
  primary: "bg-pill text-white border-2 border-pill shadow-[3px_3px_0_#7b5cf0] hover:shadow-[4px_4px_0_#7b5cf0] hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  purple: "bg-purple text-white border-2 border-ink shadow-pop hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  sun: "bg-sun text-ink border-2 border-ink shadow-pop hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  secondary: "bg-white text-ink shadow-clay-sm hover:-translate-y-0.5 active:scale-[0.97]",
  outline: "bg-white text-ink border-2 border-ink shadow-pop hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  soft: "bg-lavender-soft text-purple-deep hover:bg-lavender/60 active:scale-[0.97]",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.97]",
  success: "bg-success text-white hover:brightness-110 active:scale-[0.97]",
  ghost: "bg-transparent text-ink hover:bg-ink/5 active:scale-[0.97]",
};

// DESIGN.md §8.2
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-14 px-7 text-base gap-2.5",
  icon: "h-11 w-11 p-0",
  "icon-sm": "h-9 w-9 p-0",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = "primary", size = "md", className, loading, children, disabled, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
});

interface LinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  external?: boolean;
  "aria-label"?: string;
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, external, ...rest }: LinkProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
