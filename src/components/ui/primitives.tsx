"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { CheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/format";
import type { Tone } from "@/types";
import { toneBg } from "./tones";

// DESIGN.md §10.1
const inputBase =
  "h-12 w-full rounded-2xl border-2 border-transparent bg-white px-4 text-[15px] font-medium text-ink shadow-clay-sm outline-none transition placeholder:text-faint focus:border-purple aria-[invalid=true]:border-danger disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(inputBase, className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-none rounded-2xl border-2 border-transparent bg-white px-4 py-3 text-[15px] font-medium shadow-clay-sm outline-none transition placeholder:text-faint focus:border-purple aria-[invalid=true]:border-danger",
        className,
      )}
      {...rest}
    />
  );
});

// DESIGN.md §10.2 custom select with embedded chevron
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-2xl border-2 border-transparent bg-white bg-[length:12px] bg-[right_14px_center] bg-no-repeat pl-4 pr-9 text-sm font-semibold shadow-clay-sm outline-none focus:border-purple",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 256 256%22><path fill=%22%231c1b2b%22 d=%22M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80a8 8 0 0 1 11.32-11.32L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32Z%22/></svg>')]",
        className,
      )}
      {...rest}
    />
  );
});

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
}

export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-muted">Optional</span>}
      </label>
      {children(id, [hintId, errId].filter(Boolean).join(" ") || undefined)}
      {error ? (
        <p id={errId} role="alert" className="text-xs font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs font-medium text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// DESIGN.md §10.3 selection chip
interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md";
  disabled?: boolean;
}

export function Chip({ selected, onClick, children, tone = "sun", size = "md", disabled }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold transition-all active:scale-95 disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        selected ? cn(toneBg[tone], "text-ink ring-2 ring-ink shadow-pop") : "bg-white text-ink-soft shadow-clay-sm hover:-translate-y-0.5",
      )}
    >
      {selected && <CheckIcon size={size === "sm" ? 12 : 14} weight="bold" />}
      {children}
    </button>
  );
}

// DESIGN.md §10.4 switch
export function Switch({ checked, onCheckedChange, label, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-7 w-12 shrink-0 rounded-full bg-ink/15 transition-colors data-[state=checked]:bg-purple"
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white shadow-md transition-transform data-[state=checked]:translate-x-6" />
    </SwitchPrimitive.Root>
  );
}

// DESIGN.md §10.4 slider
export function Slider({ value, onValueChange, min, max, step, label }: { value: number; onValueChange: (v: number) => void; min: number; max: number; step: number; label: string }) {
  return (
    <SliderPrimitive.Root className="relative flex h-8 w-full touch-none select-none items-center" value={[value]} min={min} max={max} step={step} onValueChange={(v) => onValueChange(v[0])}>
      <SliderPrimitive.Track className="relative h-3 grow overflow-hidden rounded-full bg-ink/10 shadow-inner">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-lavender to-purple" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={label} className="block h-7 w-7 rounded-full border-2 border-ink bg-white shadow-pop transition hover:scale-110 focus-visible:outline-3 focus-visible:outline-purple" />
    </SliderPrimitive.Root>
  );
}

export function ProgressBar({ value, tone = "purple", className, label, marker }: { value: number; tone?: "purple" | "mint" | "sun" | "coral"; className?: string; label: string; marker?: number }) {
  const fill = { purple: "bg-gradient-to-r from-lavender to-purple", mint: "bg-gradient-to-r from-mint to-success", sun: "bg-gradient-to-r from-sun to-star", coral: "bg-gradient-to-r from-pink to-coral" }[tone];
  return (
    <div className={cn("relative h-3 w-full rounded-full bg-ink/10 shadow-inner", className)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <div className={cn("h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]", fill)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      {marker !== undefined && <span className="absolute -top-1 h-5 w-0.5 rounded-full bg-ink" style={{ left: `${marker * 100}%` }} aria-hidden />}
    </div>
  );
}
