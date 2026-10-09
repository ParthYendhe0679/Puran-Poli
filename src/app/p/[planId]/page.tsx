"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  ChatsCircleIcon,
  ClockIcon,
  CrownSimpleIcon,
  GridFourIcon,
  HandCoinsIcon,
  LockKeyIcon,
  MicrophoneIcon,
  PlusIcon,
  ReceiptIcon,
  StarIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { formatINR, timeAgo } from "@/lib/format";
import { bestSlot, slotLabel } from "@/lib/calc/availability";
import { budgetCount, groupComfortRange } from "@/lib/calc/budget";
import { paymentSummary } from "@/lib/calc/payments";
import { usePlanId } from "@/features/plans/PlanShell";
import { MEMBER_STATUS, nextActionFor, isOrganiser, winnerOf } from "@/features/plans/plan-meta";
import { IdeaCard } from "@/features/ideas/IdeaCard";
import { AddIdeaSheet } from "@/features/ideas/AddIdeaSheet";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, SectionLabel } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Countdown, EmptyState, useNow } from "@/components/ui/feedback";

function Overview() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const router = useRouter();
  const params = useSearchParams();
  const [adding, setAdding] = useState(() => params.get("add") === "1");
  const now = useNow(30_000);

  useEffect(() => {
    if (params.get("add") === "1") {
      router.replace(`/p/${planId}`, { scroll: false });
    }
  }, [params, planId, router]);

  if (!plan) return null;
  const action = nextActionFor(plan);
  const best = bestSlot(plan);
  const slot = plan.finalSlot ?? best;
  const pay = paymentSummary(plan);
  const range = groupComfortRange(plan);
  const winner = winnerOf(plan);
  const canAdd = plan.status === "voting" && new Date(plan.ideaDeadline).getTime() > now;
  const vetoed = new Set(Object.values(plan.vetoes));

  const deadlines = [
    { label: "Ideas close", at: plan.ideaDeadline },
    { label: "Voting closes", at: plan.voteDeadline },
    { label: "Payments close", at: plan.paymentDeadline },
  ];

  const tools: { href: string; label: string; body: string; icon: Icon; tone: Parameters<typeof ArtTile>[0]["tone"] }[] = [
    { href: `/p/${plan.id}/vote`, label: "Fair voting", body: `${plan.submittedVotes.length}/${plan.members.length} voted`, icon: StarIcon, tone: "lavender" },
    { href: `/p/${plan.id}/when`, label: "Availability", body: slot ? slotLabel(plan, slot).split(",")[0] : "Mark free hours", icon: GridFourIcon, tone: "sky" },
    { href: `/p/${plan.id}/budget`, label: "Private budget", body: plan.budgets[ME] ? "Saved privately" : "Not set", icon: LockKeyIcon, tone: "pink" },
    { href: `/p/${plan.id}/pay`, label: "Advance payment", body: pay.total ? `${pay.paidCount}/${pay.min} paid` : "After the vote", icon: HandCoinsIcon, tone: "sun" },
    { href: `/import?plan=${plan.id}`, label: "Import WhatsApp", body: "Find ideas in the chat", icon: ChatsCircleIcon, tone: "mint" },
    { href: `/p/${plan.id}/voice`, label: "Voice room", body: "5-minute discussion", icon: MicrophoneIcon, tone: "coral" },
    { href: `/p/${plan.id}/bill`, label: "Bill split", body: plan.bill ? "Bill scanned" : "After the event", icon: ReceiptIcon, tone: "cream" },
  ];

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        {action && (
          <div className="flex flex-col gap-4 rounded-[24px] border-2 border-ink bg-sun-soft p-5 shadow-pop-lg sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <SectionLabel>Your next step</SectionLabel>
              <p className="mt-1 font-display text-xl font-bold">{action.title}</p>
              <p className="mt-1 text-sm font-medium text-ink-soft">{action.body}</p>
            </div>
            {action.href.includes("?add=1") ? (
              <Button variant="purple" onClick={() => setAdding(true)}>
                {action.cta} <ArrowRightIcon size={18} weight="bold" />
              </Button>
            ) : (
              <ButtonLink href={action.href} variant="purple">
                {action.cta} <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
            )}
          </div>
        )}

        <section aria-labelledby="ideas-h">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="ideas-h" className="text-xl font-bold">
                Ideas <span className="text-faint">({plan.ideas.length})</span>
              </h2>
              {plan.status === "voting" && <Countdown to={plan.ideaDeadline} prefix="Ideas close in" className="text-xs" />}
            </div>
            <div className="flex gap-2">
              <ButtonLink href={`/import?plan=${plan.id}`} variant="secondary" size="sm">
                <ChatsCircleIcon size={16} weight="bold" /> From chat
              </ButtonLink>
              <Button variant="primary" size="sm" onClick={() => setAdding(true)} disabled={!canAdd} title={canAdd ? undefined : "The idea deadline has passed"}>
                <PlusIcon size={16} weight="bold" /> Add idea
              </Button>
            </div>
          </div>
          {plan.ideas.length === 0 ? (
            <EmptyState title="No ideas yet" body="Add the first idea or import your WhatsApp group chat to pull out ideas automatically." action={<Button variant="purple" onClick={() => setAdding(true)}>Add an idea</Button>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.ideas.map((idea) => (
                <IdeaCard key={idea.id} plan={plan} idea={idea} people={people} highlight={winner?.id === idea.id} vetoed={vetoed.has(idea.id)} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="tools-h">
          <h2 id="tools-h" className="mb-4 text-xl font-bold">
            Plan tools
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tools.map((t) => (
              <Link key={t.label} href={t.href} className="rounded-[24px] bg-white p-4 shadow-clay-sm transition hover:-translate-y-1 hover:shadow-clay">
                <ArtTile glyph={t.icon} tone={t.tone} size={40} />
                <p className="mt-3 text-sm font-bold">{t.label}</p>
                <p className="truncate text-xs font-medium text-muted">{t.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
            <ClockIcon size={20} weight="duotone" className="text-purple" /> Deadlines
          </h2>
          <ul className="space-y-2.5">
            {deadlines.map((d) => (
              <li key={d.label} className="flex items-center justify-between gap-2 rounded-2xl bg-canvas px-3 py-2.5 text-sm">
                <span className="font-semibold">{d.label}</span>
                <Countdown to={d.at} className="text-xs" />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
            <CalendarBlankIcon size={20} weight="duotone" className="text-purple" /> {plan.finalSlot ? "Final time" : "Best time so far"}
          </h2>
          {slot ? (
            <>
              <p className="font-display text-base font-bold">{slotLabel(plan, slot)}</p>
              {!plan.finalSlot && best && <p className="mt-1 text-xs font-semibold text-muted">{best.free} of {best.total} members free</p>}
            </>
          ) : (
            <p className="text-sm font-medium text-muted">Waiting for free hours.</p>
          )}
          <div className="mt-4 rounded-2xl bg-canvas p-3">
            <p className="text-xs font-semibold text-muted">Group budget ({budgetCount(plan)} set privately)</p>
            <p className="mt-0.5 text-sm font-bold">{range ? `Comfortable: ${formatINR(range.low)} – ${formatINR(range.high)}` : "Shown once 3 members set a budget"}</p>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h2 className="mb-3 text-base font-bold">Members ({plan.members.length})</h2>
          <ul className="space-y-2">
            {plan.members.map((m) => {
              const p = people[m.userId];
              const st = MEMBER_STATUS[m.status];
              return (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <Avatar person={p} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {m.userId === ME ? `${p?.name} (you)` : p?.name}
                    {isOrganiser(plan, m.userId) && <CrownSimpleIcon size={14} weight="fill" className="ml-1 inline text-sun-deep" aria-label="Organiser" />}
                  </span>
                  {m.isRequired && <Badge kind="coral">Required</Badge>}
                  <Badge kind={st.kind}>{st.label}</Badge>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h2 className="mb-3 text-base font-bold">Activity</h2>
          <ul className="space-y-3">
            {plan.activity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex gap-2.5 text-[13px] font-medium text-ink-soft">
                {a.actor ? <Avatar person={people[a.actor]} size={24} /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-purple" aria-hidden />}
                <p className="min-w-0">
                  {a.actor && <span className="font-bold text-ink">{a.actor === ME ? "You" : people[a.actor]?.name} </span>}
                  {a.text}
                  <span className="block text-[11px] text-faint">{timeAgo(a.at, now)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <AddIdeaSheet planId={plan.id} open={adding} onOpenChange={setAdding} />
    </div>
  );
}

export default function PlanOverviewPage() {
  return (
    <Suspense>
      <Overview />
    </Suspense>
  );
}
