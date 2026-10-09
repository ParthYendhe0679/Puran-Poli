"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { XIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** "modal" = centered on desktop, "drawer" = right side drawer on desktop. Always a bottom sheet on phones. */
  mode?: "modal" | "drawer";
  wide?: boolean;
}

/** DESIGN.md §11.2 adaptive modal / sheet. */
export function Sheet({ open, onOpenChange, title, description, children, footer, mode = "modal", wide }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className={cn(
                  "fixed z-[61] flex max-h-[92dvh] flex-col bg-canvas outline-none",
                  "inset-x-0 bottom-0 rounded-t-[32px] border-t-2 border-ink",
                  mode === "drawer"
                    ? "sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:w-[460px] sm:rounded-[32px] sm:border-2 sm:shadow-float"
                    : cn("sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[86dvh] sm:rounded-[32px] sm:border-2 sm:shadow-pop-lg", wide ? "sm:w-[640px]" : "sm:w-[500px]"),
                )}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              >
                <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-ink/15 sm:hidden" aria-hidden />
                <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
                  <div className="min-w-0">
                    <Dialog.Title className="font-display text-lg font-bold leading-tight tracking-tight text-ink sm:text-xl">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-1 text-sm font-medium text-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
                  </div>
                  <Dialog.Close className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-clay-sm transition hover:rotate-90" aria-label="Close">
                    <XIcon size={18} weight="bold" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
