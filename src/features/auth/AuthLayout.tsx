"use client";

import type { ReactNode } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/layout/AppShell";
import { ArtTile, Mascot } from "@/components/ui/Art";
import { Badge } from "@/components/ui/Badge";

/** DESIGN.md §6.2.3 split authentication shell. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden border-r-2 border-ink bg-lavender p-10 lg:flex lg:flex-col">
        <Logo href="/" />
        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute left-6 top-16 w-64 -rotate-2 rounded-[24px] border-2 border-ink bg-white p-4 shadow-pop-lg">
            <div className="flex items-center gap-3">
              <ArtTile icon="bowling" tone="lavender" size={40} />
              <div>
                <p className="text-sm font-bold">Bowling night</p>
                <p className="text-xs font-medium text-muted">₹600 · Sat 6 pm</p>
              </div>
            </div>
            <Badge kind="success" className="mt-3">
              Within everyone&apos;s budget
            </Badge>
          </div>
          <div className="absolute bottom-16 right-4 w-60 rotate-[5deg] rounded-[24px] border-2 border-ink bg-white p-4 shadow-pop-lg">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Advance payment</p>
            <p className="mt-1 font-display text-2xl font-extrabold">6 / 6 paid</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-bold text-success">
              <CheckCircleIcon size={18} weight="fill" /> Confirmed
            </p>
          </div>
          <Mascot size={180} />
        </div>
        <p className="max-w-sm font-display text-2xl font-extrabold leading-tight text-ink">Stop asking “so are we going or not?”</p>
      </aside>
      <main className="flex flex-col px-4 py-8 sm:px-6">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">{children}</div>
      </main>
    </div>
  );
}
