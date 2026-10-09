"use client";

import { CalendarPlusIcon, CheckCircleIcon, ClockIcon, DownloadSimpleIcon, MapPinIcon, TimerIcon, UsersThreeIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { durationLabel, formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { paymentSummary } from "@/lib/calc/payments";
import { slotLabel } from "@/lib/calc/availability";
import { buildIcs, downloadText, finalPlanText, googleCalendarUrl, planUrl, whatsappShareUrl } from "@/lib/share";
import { usePlanId } from "@/features/plans/PlanShell";
import { winnerOf, isOrganiser } from "@/features/plans/plan-meta";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, Burst, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CopyButton, EmptyState, toast } from "@/components/ui/feedback";

export default function FinalPlanPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const startEventDay = useDemo((s) => s.startEventDay);
  if (!plan) return null;
  const winner = winnerOf(plan);
  const confirmedish = ["confirmed", "event_day", "settling", "completed"].includes(plan.status);
  if (!winner || !confirmedish) {
    return (
      <EmptyState
        title={plan.status === "not_confirmed" ? "This plan wasn't confirmed" : "Not confirmed yet"}
        body={plan.status === "not_confirmed" ? "Fewer members than required paid in time." : "The final plan appears once enough members pay their share."}
        action={<ButtonLink href={`/p/${plan.id}/pay`} variant="purple">See payment progress</ButtonLink>}
      />
    );
  }
  const s = paymentSummary(plan);
  const going = plan.payments.filter((p) => p.status === "held" || p.status === "captured").map((p) => p.userId);
  const decidedIn = plan.confirmedAt ? durationLabel(plan.createdAt, plan.confirmedAt) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <div className="relative rounded-[28px] border-2 border-ink bg-white p-6 shadow-pop-lg sm:p-8">
        <div className="absolute -right-3 -top-7 rotate-12">
          <Burst tone="mint">GO!</Burst>
        </div>
        <Kicker tone="mint">
          <CheckCircleIcon size={14} weight="fill" /> Plan confirmed
        </Kicker>
        <div className="mt-5 flex items-center gap-4">
          <ArtTile icon={winner.icon} tone={winner.tone} size={68} />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{winner.title}</h2>
            <p className="mt-1 text-sm font-medium text-muted">{plan.title}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { i: ClockIcon, k: "When", v: plan.finalSlot ? slotLabel(plan, plan.finalSlot) : "To be announced" },
            { i: MapPinIcon, k: "Where", v: plan.finalPlace ?? winner.place },
            { i: UsersThreeIcon, k: "Going", v: `${going.length} members (min ${plan.minMembers})` },
            { i: DownloadSimpleIcon, k: "Cost per person", v: `${formatINR(s.finalShare)}${s.refundEach > 0 ? ` · ${formatINR(s.refundEach)} returned to each` : ""}` },
          ].map((x) => (
            <div key={x.k} className="flex items-start gap-3 rounded-2xl bg-canvas p-3.5">
              <x.i size={22} weight="duotone" className="mt-0.5 shrink-0 text-purple" />
              <div>
                <dt className="text-xs font-semibold text-muted">{x.k}</dt>
                <dd className="text-[15px] font-bold">{x.v}</dd>
              </div>
            </div>
          ))}
        </dl>
        {decidedIn && (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-lavender-soft p-3 text-sm font-bold text-purple-deep">
            <TimerIcon size={18} weight="fill" /> This plan was decided in {decidedIn} with {going.length} members.
          </p>
        )}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
            variant="purple"
            onClick={() => {
              downloadText(`${plan.id}.ics`, buildIcs(plan), "text/calendar");
              toast("success", "Calendar invite downloaded", "Open the .ics file to add it to any calendar.");
            }}
          >
            <CalendarPlusIcon size={18} weight="bold" /> Add to calendar (.ics)
          </Button>
          <ButtonLink href={googleCalendarUrl(plan)} external variant="outline">
            <CalendarPlusIcon size={18} weight="bold" /> Google Calendar
          </ButtonLink>
          <ButtonLink href={whatsappShareUrl(finalPlanText(plan))} external variant="outline">
            <WhatsappLogoIcon size={18} weight="bold" /> Share to WhatsApp
          </ButtonLink>
          <CopyButton text={planUrl(plan.id, "/final")} label="Copy plan link" variant="secondary" size="md" />
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-clay">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">Who&apos;s going</h3>
          <DemoTag>Payments captured (simulated)</DemoTag>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {going.map((id) => {
            const p = plan.payments.find((x) => x.userId === id)!;
            return (
              <li key={id} className="flex items-center gap-2.5 rounded-2xl bg-canvas p-2.5">
                <Avatar person={people[id]} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{id === ME ? "You" : people[id]?.name}</span>
                <Badge kind="success">Paid {formatINR(Math.min(p.amount, s.finalShare))}</Badge>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-clay">
        <h3 className="text-base font-bold">Next steps</h3>
        <ol className="mt-3 space-y-2 text-sm font-medium text-ink-soft">
          <li className="rounded-2xl bg-canvas p-3">1. Add the invite to your calendar — a reminder fires 2 hours before.</li>
          <li className="rounded-2xl bg-canvas p-3">2. On the day, open Event day to see who is on the way.</li>
          <li className="rounded-2xl bg-canvas p-3">3. Afterwards, scan the bill and settle up in as few payments as possible.</li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {plan.status === "confirmed" ? (
            <Button
              variant="primary"
              onClick={() => {
                startEventDay(plan.id);
                toast("info", "Event day started (demo)");
              }}
              disabled={!isOrganiser(plan) && false}
            >
              Start event day (demo)
            </Button>
          ) : (
            <ButtonLink href={`/p/${plan.id}/event`}>Open event day</ButtonLink>
          )}
          <ButtonLink href={`/p/${plan.id}/bill`} variant="secondary">
            Bill split
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
