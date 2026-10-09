"use client";

import Link from "next/link";
import { CalendarBlankIcon, CheckCircleIcon, MapPinIcon } from "@phosphor-icons/react";
import type { Person, Plan } from "@/types";
import { formatDate, formatINR } from "@/lib/format";
import { paymentSummary } from "@/lib/calc/payments";
import { slotLabel } from "@/lib/calc/availability";
import { ME } from "@/lib/store/demo-store";
import { ArtTile, AvatarStack } from "@/components/ui/Art";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/primitives";
import { Countdown } from "@/components/ui/feedback";
import { STATUS_META, currentStep, winnerOf, nextActionFor } from "./plan-meta";
import { Stepper } from "./PlanShell";

export function PlanCard({ plan, people }: { plan: Plan; people: Record<string, Person> }) {
  const meta = STATUS_META[plan.status];
  const pay = paymentSummary(plan);
  const voted = plan.submittedVotes.length;
  const winner = winnerOf(plan);
  const action = nextActionFor(plan);
  const needsMe = action && ((plan.status === "voting" && !plan.submittedVotes.includes(ME)) || (plan.status === "collecting" && !plan.payments.some((p) => p.userId === ME && p.status !== "released")) || plan.status === "settling");
  return (
    <Link href={`/p/${plan.id}`} className="group block h-full min-w-0 rounded-[28px] bg-white p-5 shadow-clay transition-all duration-200 hover:-translate-y-1 hover:shadow-clay-lg">
      <div className="flex items-start gap-3">
        <ArtTile icon={plan.icon} tone={plan.tone} size={48} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-base font-bold tracking-normal text-ink">{plan.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={12} weight="duotone" />
              {plan.area}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarBlankIcon size={12} weight="duotone" />
              {plan.finalSlot ? slotLabel(plan, plan.finalSlot).split(",")[0] : formatDate(plan.approxDate)}
            </span>
          </p>
          <Badge kind={meta.kind} withDot pulse={plan.status === "voting" || plan.status === "collecting"} className="mt-2">
            {meta.label}
          </Badge>
        </div>
      </div>
      <div className="mt-4">
        <Stepper step={currentStep(plan)} compact />
      </div>
      <div className="mt-4 space-y-2">
        {plan.status === "voting" && (
          <>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">
                Votes in: {voted}/{plan.members.length}
              </span>
              <Countdown to={plan.voteDeadline} prefix="closes in" className="text-xs" />
            </div>
            <ProgressBar value={voted / Math.max(1, plan.members.length)} label="Voting progress" />
          </>
        )}
        {(plan.status === "collecting" || plan.status === "confirmed" || plan.status === "not_confirmed") && (
          <>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-muted">
                Paid: {pay.paidCount}/{pay.min} required · {formatINR(pay.reached ? pay.finalShare : pay.heldShare)} each
              </span>
              {plan.status === "collecting" && <Countdown to={plan.paymentDeadline} className="text-xs" />}
            </div>
            <ProgressBar value={pay.progress} tone={pay.reached ? "mint" : plan.status === "not_confirmed" ? "coral" : "purple"} label="Payment progress" />
          </>
        )}
        {winner && plan.status !== "collecting" && plan.status !== "not_confirmed" && (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <CheckCircleIcon size={14} weight="fill" className="text-success" /> {winner.title}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <AvatarStack people={plan.members.map((m) => people[m.userId])} max={5} size={26} />
        {action && <span className={needsMe ? "rounded-full bg-sun px-3 py-1 text-xs font-bold text-ink" : "text-xs font-semibold text-muted"}>{needsMe ? action.cta : action.title}</span>}
      </div>
    </Link>
  );
}
