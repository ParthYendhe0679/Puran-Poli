"use client";

import { AnimatePresence, motion } from "motion/react";
import { create } from "zustand";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowClockwiseIcon, CheckIcon, CopyIcon, InfoIcon, SparkleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { cn, countdown } from "@/lib/format";
import { copyText } from "@/lib/share";
import { Button, type ButtonVariant, type ButtonSize } from "./Button";
import { Mascot } from "./Art";

// ── Toaster (DESIGN.md §11.1) ──────────────────────────────────────────────────────────
type ToastKind = "success" | "error" | "info" | "warning" | "ai";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}
const useToasts = create<{ toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; dismiss: (id: number) => void }>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = (kind: ToastKind, title: string, body?: string) => useToasts.getState().push({ kind, title, body });

const toastIcon: Record<ToastKind, { bg: string; icon: ReactNode }> = {
  success: { bg: "bg-mint", icon: <CheckIcon size={18} weight="bold" /> },
  error: { bg: "bg-pink", icon: <XIcon size={18} weight="bold" /> },
  info: { bg: "bg-sky", icon: <InfoIcon size={18} weight="bold" /> },
  warning: { bg: "bg-sun", icon: <WarningIcon size={18} weight="bold" /> },
  ai: { bg: "bg-lavender", icon: <SparkleIcon size={18} weight="fill" /> },
};

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4 sm:items-end" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[22px] border-2 border-ink bg-white p-3 pr-2 shadow-pop-lg"
            role="status"
          >
            <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink", toastIcon[t.kind].bg)}>{toastIcon[t.kind].icon}</span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-ink">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[13px] font-medium text-muted">{t.body}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5" aria-label="Dismiss">
              <XIcon size={14} weight="bold" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── States (DESIGN.md §11.3) ───────────────────────────────────────────────────────────
export function EmptyState({ title, body, action, mood = "happy" }: { title: string; body?: string; action?: ReactNode; mood?: "happy" | "think" }) {
  return (
    <div className="rounded-[28px] bg-white/60 p-8 text-center sm:p-14">
      <div className="mx-auto mb-3 w-fit">
        <Mascot size={96} mood={mood} />
      </div>
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm font-medium text-muted">{body}</p>}
      {action && <div className="mt-5 flex justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, body, onRetry, action }: { title: string; body?: string; onRetry?: () => void; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-[28px] border-2 border-dashed border-danger/30 bg-danger-soft/40 px-6 py-10 text-center">
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm font-medium text-muted">{body}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <ArrowClockwiseIcon size={18} weight="bold" /> Try again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} aria-hidden />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[24px]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-[28px]" />
    </div>
  );
}

// ── Live clock & countdown ─────────────────────────────────────────────────────────────
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function Countdown({ to, prefix, className }: { to: string; prefix?: string; className?: string }) {
  const now = useNow(1000);
  const c = countdown(to, now);
  const urgent = !c.done && c.days === 0 && c.hours < 3;
  return (
    <span className={cn("tabular inline-flex items-center gap-1.5 font-semibold", c.done ? "text-muted" : urgent ? "text-coral-deep" : "text-ink", className)}>
      {!c.done && <span className={cn("h-1.5 w-1.5 rounded-full", urgent ? "bg-coral animate-pulse" : "bg-purple animate-pulse")} aria-hidden />}
      {prefix && <span className="font-medium text-muted">{prefix}</span>}
      {c.label}
    </span>
  );
}

// ── Copy + QR ──────────────────────────────────────────────────────────────────────────
export function CopyButton({ text, label = "Copy", variant = "secondary", size = "sm", toastTitle = "Copied to clipboard" }: { text: string; label?: string; variant?: ButtonVariant; size?: ButtonSize; toastTitle?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={variant}
      size={size}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setDone(true);
          toast("success", toastTitle);
          setTimeout(() => setDone(false), 1600);
        } else toast("error", "Could not copy", "Select the text and copy it manually.");
      }}
    >
      {done ? <CheckIcon size={16} weight="bold" /> : <CopyIcon size={16} weight="bold" />}
      {done ? "Copied" : label}
    </Button>
  );
}

export function QRImage({ value, size = 168, label }: { value: string; size?: number; label: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: "#1c1b2b", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  return (
    <div className="inline-grid place-items-center rounded-[24px] border-2 border-ink bg-white p-3 shadow-pop" style={{ width: size + 28, height: size + 28 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated data URL
        <img src={src} width={size} height={size} alt={label} className="rounded-xl" />
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  );
}
