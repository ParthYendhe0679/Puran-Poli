"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { CaretLeftIcon, CheckIcon, MapPinIcon, ShareNetworkIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { cn, formatDate } from "@/lib/format";
import { usePeople, usePlan } from "@/lib/store/demo-store";
import { AppShell } from "@/components/layout/AppShell";
import { ArtTile, AvatarStack } from "@/components/ui/Art";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ErrorState, CopyButton } from "@/components/ui/feedback";
import { joinUrl } from "@/lib/share";
import { STATUS_META, STEPS, currentStep, isMember } from "./plan-meta";

const TABS = [
  { seg: "", label: "Overview" },
  { seg: "/vote", label: "Vote" },
  { seg: "/when", label: "When" },
  { seg: "/budget", label: "Budget" },
  { seg: "/voice", label: "Voice room" },
  { seg: "/pay", label: "Pay" },
  { seg: "/final", label: "Final plan" },
  { seg: "/event", label: "Event day" },
  { seg: "/bill", label: "Bill split" },
  { seg: "/settle", label: "Settle" },
  { seg: "/summary", label: "Summary" },
];

export function usePlanId(): string {
  const params = useParams<{ planId: string }>();
  return params.planId;
}

function SubTabs({ planId }: { planId: string }) {
  const pathname = usePathname();
  const base = `/p/${planId}`;
  return (
    <div className="sticky top-16 z-30 border-b border-ink/5 bg-canvas/85 backdrop-blur-md">
      <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 sm:px-6" aria-label="Plan sections">
        {TABS.map((t) => {
          const href = base + t.seg;
          const active = t.seg === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link key={t.seg} href={href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors", active ? "text-white" : "text-ink-soft hover:bg-white hover:text-ink")}>
              {active && <motion.span layoutId="plan-tab" className="absolute inset-0 rounded-full bg-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Stepper({ step, compact }: { step: number; compact?: boolean }) {
  return (
    <ol className="flex items-center gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-1">
            <span className={cn("grid shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold", compact ? "h-5 w-5" : "h-7 w-7", done ? "border-ink bg-mint text-ink" : active ? "border-ink bg-sun text-ink shadow-pop" : "border-ink/15 bg-white text-faint")} aria-current={active ? "step" : undefined}>
              {done ? <CheckIcon size={compact ? 10 : 12} weight="bold" /> : i + 1}
            </span>
            {!compact && <span className={cn("hidden truncate text-xs font-semibold lg:inline", active ? "text-ink" : "text-muted")}>{s}</span>}
            {i < STEPS.length - 1 && <span className={cn("h-0.5 min-w-2 flex-1 rounded-full", done ? "bg-ink" : "bg-ink/10")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export function PlanShell({ children }: { children: ReactNode }) {
  const planId = usePlanId();
  return (
    <AppShell sub={<SubTabs planId={planId} />}>
      <PlanGate planId={planId}>{children}</PlanGate>
    </AppShell>
  );
}

function PlanGate({ planId, children }: { planId: string; children: ReactNode }) {
  const plan = usePlan(planId);
  const people = usePeople();
  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <ErrorState title="We couldn't find this plan" body="The link may be wrong, or the demo data was reset. Check the link or go back to your plans." action={<ButtonLink href="/dashboard">Back to dashboard</ButtonLink>} />
      </div>
    );
  }
  const meta = STATUS_META[plan.status];
  const step = currentStep(plan);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-7">
      <div className="mb-5 flex flex-col gap-4 rounded-[28px] bg-white p-4 shadow-clay sm:p-5">
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <Link href="/dashboard" className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-canvas text-ink transition hover:-translate-x-0.5 sm:grid" aria-label="Back to dashboard">
            <CaretLeftIcon size={18} weight="bold" />
          </Link>
          <ArtTile icon={plan.icon} tone={plan.tone} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-extrabold tracking-tight text-ink sm:text-2xl">{plan.title}</h1>
              <Badge kind={meta.kind} withDot pulse={plan.status === "voting" || plan.status === "collecting"}>
                {meta.label}
              </Badge>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPinIcon size={14} weight="duotone" /> {plan.area}
              </span>
              <span>~ {formatDate(plan.approxDate)}</span>
              <span className="inline-flex items-center gap-1">
                <UsersThreeIcon size={14} weight="duotone" /> {plan.members.length} members · min {plan.minMembers}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AvatarStack people={plan.members.map((m) => people[m.userId])} max={4} size={30} />
            <CopyButton text={joinUrl(plan.id)} label="Invite" toastTitle="Invite link copied" />
            {!isMember(plan) && (
              <ButtonLink href={`/join/${plan.id}`} size="sm" variant="purple">
                <ShareNetworkIcon size={16} weight="bold" /> Join
              </ButtonLink>
            )}
          </div>
        </div>
        <Stepper step={step} />
      </div>
      {children}
    </div>
  );
}
