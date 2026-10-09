"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, ChartBarIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon, StorefrontIcon, UsersThreeIcon, WalletIcon, type Icon } from "@phosphor-icons/react";
import type { Plan, Tone } from "@/types";
import { cn, formatDate, formatINR } from "@/lib/format";
import { useDemo, useHydration } from "@/lib/store/demo-store";
import { groupComfortRange } from "@/lib/calc/budget";
import { bestSlot, dayLabel } from "@/lib/calc/availability";
import { Logo } from "@/components/layout/AppShell";
import { ArtTile } from "@/components/ui/Art";
import { Badge, DemoTag } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { PageSkeleton, toast } from "@/components/ui/feedback";

function StatCard({ label, value, hint, icon: I, tone }: { label: string; value: string; hint: string; icon: Icon; tone: Tone }) {
  return (
    <div className="rounded-[24px] bg-white p-5 shadow-clay-sm">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-semibold text-muted">{label}</p>
        <ArtTile glyph={I} tone={tone} size={34} />
      </div>
      <p className="tabular mt-1 font-display text-[1.75rem] font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-muted">{hint}</p>
    </div>
  );
}

/** Anonymous request derived from a plan: no names, no individual budgets. */
function requestOf(plan: Plan) {
  const slot = bestSlot(plan);
  const range = groupComfortRange(plan);
  return {
    plan,
    people: plan.groupSize,
    when: slot ? dayLabel(plan, slot.day, "long") : formatDate(plan.approxDate),
    area: plan.area.split(",")[0],
    budget: range ? `${formatINR(range.low)} – ${formatINR(range.high)}` : "Not shared yet",
    offers: plan.ideas.filter((i) => i.source === "offer").length,
  };
}

export default function VenueConsole() {
  const hydrated = useHydration((s) => s.hydrated);
  const plans = useDemo((s) => s.plans);
  const offers = useDemo((s) => s.offers);
  const sendOffer = useDemo((s) => s.sendOffer);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "new" | "offered">("all");
  const [selected, setSelected] = useState<Plan | null>(null);
  const [form, setForm] = useState({ venue: "Strike Bowl, Andheri", text: "Group bowling — 2 lanes + fries", price: "550" });
  const [err, setErr] = useState<string | null>(null);

  const requests = useMemo(() => Object.values(plans).filter((p) => p.status === "voting").map(requestOf), [plans]);
  const list = requests.filter((r) => (filter === "new" ? r.offers === 0 : filter === "offered" ? r.offers > 0 : true) && `${r.area} ${r.when}`.toLowerCase().includes(q.toLowerCase()));

  if (!hydrated) return <PageSkeleton />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.venue.trim() || !form.text.trim()) return setErr("Add your venue name and the offer.");
    if (!Number.isFinite(price) || price <= 0) return setErr("Enter a price per person.");
    if (!selected) return;
    sendOffer({ planId: selected.id, venue: form.venue.trim(), text: form.text.trim(), pricePerPerson: Math.round(price) });
    toast("success", "Offer sent", "It appears in the group's plan as an idea card marked “Venue offer”.");
    setSelected(null);
    setErr(null);
  };

  return (
    <div className="min-h-dvh bg-dots-cool pb-16">
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-canvas-cool/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/venues" compact />
            <Badge kind="info">Venue console</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-soft sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-purple" /> Live requests
            </span>
            <Link href="/dashboard" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold shadow-soft hover:-translate-y-0.5">
              <ArrowLeftIcon size={16} weight="bold" /> Back to friends app
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Strike Bowl · Andheri (demo venue)</p>
            <h1 className="mt-1 text-[1.75rem] font-extrabold sm:text-[2.25rem]">Anonymous group requests</h1>
            <p className="mt-1 text-sm font-medium text-muted">Groups that are still deciding. You see size, day, area and the anonymous budget range — never names.</p>
          </div>
          <DemoTag>Demo data</DemoTag>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Open requests" value={String(requests.length)} hint="Groups deciding now" icon={UsersThreeIcon} tone="sky" />
          <StatCard label="People" value={String(requests.reduce((s, r) => s + r.people, 0))} hint="Across all requests" icon={ChartBarIcon} tone="lavender" />
          <StatCard label="Offers sent" value={String(offers.length)} hint="This session" icon={PaperPlaneTiltIcon} tone="mint" />
          <StatCard label="Pre-paid bookings" value="100%" hint="Groups pay before confirming" icon={WalletIcon} tone="sun" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(["all", "new", "offered"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("h-9 rounded-full px-4 text-[13px] font-semibold capitalize", filter === f ? "bg-pill text-white" : "bg-white text-ink-soft shadow-soft")}>
                {f === "new" ? "No offer yet" : f}
              </button>
            ))}
          </div>
          <label className="relative sm:w-72">
            <span className="sr-only">Search requests</span>
            <MagnifyingGlassIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area or day" className="h-11 w-full rounded-full bg-white pl-11 pr-4 text-sm font-medium shadow-soft outline-none focus:ring-2 focus:ring-purple" />
          </label>
        </div>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-clay">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-canvas text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Budget range</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.plan.id} onClick={() => setSelected(r.plan)} className="cursor-pointer border-t border-line transition-colors hover:bg-canvas/60" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(r.plan)}>
                    <td className="px-4 py-3 font-mono text-xs">REQ-{r.plan.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3 font-semibold">{r.people} people</td>
                    <td className="px-4 py-3">{r.when}</td>
                    <td className="px-4 py-3">{r.area}</td>
                    <td className="tabular px-4 py-3">{r.budget}</td>
                    <td className="px-4 py-3">{r.offers ? <Badge kind="success">{r.offers} offer sent</Badge> : <Badge kind="warning" withDot>Open</Badge>}</td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-medium text-muted">
                      No requests match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)} mode="drawer" title={selected ? `REQ-${selected.id.slice(0, 6).toUpperCase()}` : ""} description="Anonymous group request">
        {selected && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-2">
              {Object.entries({ Group: `${selected.groupSize} people`, When: requestOf(selected).when, Area: requestOf(selected).area, Budget: requestOf(selected).budget }).map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-white p-3 shadow-clay-sm">
                  <dt className="text-[11px] font-semibold text-muted">{k}</dt>
                  <dd className="text-sm font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <form onSubmit={submit} noValidate className="space-y-4">
              <Field label="Venue name">{(id) => <Input id={id} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />}</Field>
              <Field label="Offer" error={err ?? undefined}>
                {(id, d) => <Textarea id={id} aria-describedby={d} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="min-h-20" maxLength={80} />}
              </Field>
              <Field label="Price per person (₹)">{(id) => <Input id={id} type="number" min={1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />}</Field>
              <Button type="submit" variant="purple" className="w-full">
                <StorefrontIcon size={18} weight="bold" /> Send group offer
              </Button>
            </form>
          </div>
        )}
      </Sheet>
    </div>
  );
}
