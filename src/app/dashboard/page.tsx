"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarCheckIcon,
  ChatsCircleIcon,
  HandCoinsIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  StackIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useDemo, useMe, ME } from "@/lib/store/demo-store";
import type { PlanStatus, Tone } from "@/types";
import { cn, formatINR, timeAgo } from "@/lib/format";
import { paymentSummary } from "@/lib/calc/payments";
import { planTransfers, isSettled } from "@/lib/calc/settle";
import { slotLabel } from "@/lib/calc/availability";
import { AppShell, PageHead } from "@/components/layout/AppShell";
import { PlanCard } from "@/features/plans/PlanCard";
import { nextActionFor, winnerOf } from "@/features/plans/plan-meta";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker, SectionLabel } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, useNow } from "@/components/ui/feedback";

type Filter = "all" | "deciding" | "paying" | "confirmed" | "done";
const FILTERS: { id: Filter; label: string; match: (s: PlanStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "deciding", label: "Deciding", match: (s) => s === "voting" },
  { id: "paying", label: "Paying", match: (s) => s === "collecting" },
  { id: "confirmed", label: "Confirmed", match: (s) => s === "confirmed" || s === "event_day" },
  { id: "done", label: "Done", match: (s) => s === "settling" || s === "completed" || s === "not_confirmed" },
];

function StatCard({ label, value, hint, icon: I, tone }: { label: string; value: string; hint: string; icon: Icon; tone: Tone }) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-clay-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-muted">{label}</p>
        <ArtTile glyph={I} tone={tone} size={36} />
      </div>
      <p className="tabular mt-1 font-display text-[1.6rem] font-extrabold leading-none tracking-[-0.02em] sm:text-[1.75rem]">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-muted">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const me = useMe();
  const plansMap = useDemo((s) => s.plans);
  const order = useDemo((s) => s.planOrder);
  const people = useDemo((s) => s.people);
  const notifications = useDemo((s) => s.notifications);
  const now = useNow(60_000);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const plans = useMemo(() => order.map((id) => plansMap[id]).filter(Boolean), [order, plansMap]);
  const mine = plans.filter((p) => p.members.some((m) => m.userId === ME));

  const stats = useMemo(() => {
    const active = mine.filter((p) => ["voting", "collecting", "confirmed", "event_day"].includes(p.status));
    const waiting = mine.filter((p) => (p.status === "voting" && !p.submittedVotes.includes(ME)) || (p.status === "collecting" && !p.payments.some((x) => x.userId === ME && x.status === "held")) || p.status === "settling");
    const held = mine.reduce((s, p) => s + p.payments.filter((x) => x.userId === ME && x.status === "held").reduce((a, x) => a + x.amount, 0), 0);
    let owedToMe = 0;
    let iOwe = 0;
    mine
      .filter((p) => p.status === "settling" || p.status === "completed")
      .forEach((p) =>
        planTransfers(p)
          .filter((t) => !isSettled(p, t))
          .forEach((t) => {
            if (t.to === ME) owedToMe += t.amount;
            if (t.from === ME) iOwe += t.amount;
          }),
      );
    return { active: active.length, waiting, held, owedToMe, iOwe };
  }, [mine]);

  const filtered = mine.filter((p) => FILTERS.find((f) => f.id === filter)!.match(p.status) && (q.trim() === "" || `${p.title} ${p.area}`.toLowerCase().includes(q.trim().toLowerCase())));
  const upcoming = mine.filter((p) => (p.status === "confirmed" || p.status === "event_day") && p.finalSlot);
  const completed = mine.filter((p) => p.status === "completed" || p.status === "settling");
  const activity = mine
    .flatMap((p) => p.activity.map((a) => ({ ...a, plan: p })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);
  const hour = new Date(now).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-6 sm:py-10">
      <PageHead
        kicker={<Kicker tone="mint">Your plans</Kicker>}
        title={
          <>
            {greet}, {me?.name} 👋
          </>
        }
        subtitle={stats.waiting.length ? `${stats.waiting.length} plan${stats.waiting.length === 1 ? " needs" : "s need"} you. Everything else is moving on its own.` : "Nothing needs you right now. Every plan is moving on its own."}
        actions={
          <>
            <ButtonLink href="/import" variant="outline">
              <ChatsCircleIcon size={18} weight="bold" /> Import chat
            </ButtonLink>
            <ButtonLink href="/create" variant="purple">
              <PlusCircleIcon size={18} weight="bold" /> Create plan
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active plans" value={String(stats.active)} hint="Deciding, paying or confirmed" icon={StackIcon} tone="lavender" />
        <StatCard label="Waiting on you" value={String(stats.waiting.length)} hint="Votes, payments or bill items" icon={LightningIcon} tone="sun" />
        <StatCard label="Held for you" value={formatINR(stats.held)} hint="Simulated holds, not charged" icon={HandCoinsIcon} tone="mint" />
        <StatCard label="Settle up" value={stats.iOwe ? `−${formatINR(stats.iOwe)}` : formatINR(stats.owedToMe)} hint={stats.iOwe ? `You owe · ${formatINR(stats.owedToMe)} owed to you` : "Owed to you"} icon={WalletIcon} tone="coral" />
      </div>

      {stats.waiting.length > 0 && (
        <section aria-labelledby="todo">
          <SectionLabel className="mb-3">
            <span id="todo">Needs your attention</span>
          </SectionLabel>
          <div className="grid gap-3 md:grid-cols-3">
            {stats.waiting.map((p) => {
              const a = nextActionFor(p)!;
              return (
                <Link key={p.id} href={a.href} className="flex items-center gap-3 rounded-[24px] border-2 border-ink bg-white p-4 shadow-pop transition hover:-translate-y-0.5">
                  <ArtTile icon={p.icon} tone={p.tone} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{a.title}</p>
                    <p className="truncate text-xs font-medium text-muted">{p.title}</p>
                  </div>
                  <ArrowRightIcon size={18} weight="bold" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="plans-h" className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="plans-h" className="text-xl font-bold">
              All plans
            </h2>
            <label className="relative block sm:w-64">
              <span className="sr-only">Search plans</span>
              <MagnifyingGlassIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plans" className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm font-medium shadow-clay-sm outline-none focus:ring-2 focus:ring-purple" />
            </label>
          </div>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter plans">
            {FILTERS.map((f) => {
              const count = mine.filter((p) => f.match(p.status)).length;
              return (
                <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition", filter === f.id ? "bg-pill text-white" : "bg-white text-ink-soft shadow-clay-sm hover:-translate-y-0.5")}>
                  {f.label}
                  <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.id ? "bg-white/20" : "bg-canvas")}>{count}</span>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 ? (
            <EmptyState title={q ? "No plans match your search" : "No plans here yet"} body={q ? "Try a different word or clear the filter." : "Create a plan and share the link in your group chat."} mood="think" action={<ButtonLink href="/create" variant="purple">Create a plan</ButtonLink>} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((p) => (
                <PlanCard key={p.id} plan={p} people={people} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-clay">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Upcoming</h2>
              <CalendarCheckIcon size={20} weight="duotone" className="text-purple" />
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm font-medium text-muted">No confirmed events yet. Confirm one by paying a share!</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((p) => (
                  <li key={p.id}>
                    <Link href={p.status === "event_day" ? `/p/${p.id}/event` : `/p/${p.id}/final`} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-canvas">
                      <ArtTile icon={p.icon} tone={p.tone} size={38} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{winnerOf(p)?.title ?? p.title}</p>
                        <p className="truncate text-xs font-medium text-muted">{slotLabel(p, p.finalSlot!)}</p>
                      </div>
                      {p.status === "event_day" && <Badge kind="coral" withDot pulse>Today</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-clay">
            <h2 className="mb-3 text-base font-bold">Recently completed</h2>
            <ul className="space-y-2">
              {completed.map((p) => {
                const s = paymentSummary(p);
                return (
                  <li key={p.id}>
                    <Link href={p.status === "completed" ? `/p/${p.id}/summary` : `/p/${p.id}/settle`} className="flex items-center justify-between gap-2 rounded-2xl p-2 text-sm transition hover:bg-canvas">
                      <span className="min-w-0 truncate font-semibold">{p.title}</span>
                      <span className="tabular shrink-0 text-xs font-bold text-muted">{formatINR(s.finalShare)}/person</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-clay">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Activity</h2>
              <Link href="/notifications" className="inline-flex items-center gap-1 text-xs font-bold text-purple-deep hover:underline">
                <BellIcon size={14} weight="bold" /> {notifications.filter((n) => !n.read).length} new
              </Link>
            </div>
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={`${a.plan.id}-${a.id}`} className="flex gap-2.5">
                  {a.actor ? <Avatar person={people[a.actor]} size={28} /> : <ArtTile icon={a.plan.icon} tone={a.plan.tone} size={28} />}
                  <p className="min-w-0 text-[13px] font-medium leading-snug text-ink-soft">
                    {a.actor && <span className="font-bold text-ink">{a.actor === ME ? "You" : people[a.actor]?.name} </span>}
                    {a.text}
                    <span className="block text-[11px] text-faint">
                      {a.plan.title} · {timeAgo(a.at, now)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <DemoTag>All data is local demo data</DemoTag>
        </aside>
      </div>
    </div>
  );
}
