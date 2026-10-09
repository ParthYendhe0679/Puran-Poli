"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, CrownSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { cn, formatHour } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { DAYS, HOURS, bestSlot, dayLabel, slotCounts, slotKey, slotLabel } from "@/lib/calc/availability";
import { usePlanId } from "@/features/plans/PlanShell";
import { isOrganiser } from "@/features/plans/plan-meta";
import { Avatar } from "@/components/ui/Art";
import { Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/feedback";

// Heat scale from canvas → lavender → purple (DESIGN.md palette only).
function heat(count: number, total: number) {
  if (count === 0 || total === 0) return "bg-white";
  const r = count / total;
  if (r < 0.25) return "bg-lavender-soft";
  if (r < 0.5) return "bg-lavender/60";
  if (r < 0.75) return "bg-lavender";
  if (r < 1) return "bg-purple/70 text-white";
  return "bg-purple text-white";
}

export default function WhenPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const toggleSlot = useDemo((s) => s.toggleSlot);
  const setSlots = useDemo((s) => s.setSlots);
  const toggleRequired = useDemo((s) => s.toggleRequired);
  const [day, setDay] = useState(0);
  const drag = useRef<{ on: boolean } | null>(null);

  useEffect(() => {
    const up = () => (drag.current = null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const counts = useMemo(() => (plan ? slotCounts(plan) : new Map<string, number>()), [plan]);
  const best = useMemo(() => (plan ? bestSlot(plan) : null), [plan]);
  if (!plan) return null;

  const mine = new Set(plan.availability[ME] ?? []);
  const total = plan.members.length;
  const editable = plan.status === "voting" || plan.status === "collecting";
  const inBest = (d: number, h: number) => !!best && best.day === d && h >= best.startHour && h < best.endHour;
  const organiser = isOrganiser(plan);

  const start = (k: string) => {
    if (!editable) return;
    const on = !mine.has(k);
    drag.current = { on };
    toggleSlot(plan.id, k, on);
  };
  const enter = (k: string) => {
    if (drag.current) toggleSlot(plan.id, k, drag.current.on);
  };

  const renderCell = (d: number, h: number, big?: boolean) => {
    const k = slotKey(d, h);
    const c = counts.get(k) ?? 0;
    const selected = mine.has(k);
    return (
      <button
        key={k}
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          start(k);
        }}
        onPointerEnter={() => enter(k)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleSlot(plan.id, k);
          }
        }}
        aria-pressed={selected}
        aria-label={`${dayLabel(plan, d, "long")} ${formatHour(h)}: ${c} of ${total} free${selected ? ", you are free" : ""}`}
        disabled={!editable}
        className={cn("relative flex touch-none select-none items-center justify-center rounded-lg text-[11px] font-bold transition", big ? "h-12 rounded-2xl" : "h-9", heat(c, total), selected && "ring-2 ring-ink ring-inset", inBest(d, h) && "outline-2 outline-offset-1 outline-sun")}
      >
        {big ? (
          <span className="flex w-full items-center justify-between px-4">
            <span>{formatHour(h)}</span>
            <span className="flex items-center gap-2">
              {c}/{total}
              {selected && <CheckIcon size={16} weight="bold" />}
            </span>
          </span>
        ) : (
          <>{c > 0 ? c : ""}</>
        )}
      </button>
    );
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <Kicker tone="sky">Availability</Kicker>
        <h2 className="mt-3 text-2xl font-extrabold">When are you free?</h2>
        <p className="mt-1 text-sm font-medium text-muted">{editable ? "Tap or drag across the hours you can make it. Darker = more people free." : "Availability is locked for this plan."}</p>

        {best && (
          <div className="mt-4 flex items-center gap-3 rounded-[24px] border-2 border-ink bg-sun p-4 shadow-pop">
            <SparkleIcon size={24} weight="fill" className="shrink-0" />
            <p className="text-sm font-bold">
              Best slot: {slotLabel(plan, best)} — {best.free} of {best.total} members free
              {plan.members.some((m) => m.isRequired) && " (all required members included)"}
            </p>
          </div>
        )}

        {/* Mobile: one day at a time with large cells */}
        <div className="mt-5 md:hidden">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2" role="tablist" aria-label="Day">
            {Array.from({ length: DAYS }).map((_, d) => (
              <button key={d} role="tab" aria-selected={day === d} onClick={() => setDay(d)} className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-semibold", day === d ? "bg-pill text-white" : "bg-white shadow-clay-sm")}>
                {dayLabel(plan, d)}
                {best?.day === d && " ★"}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2">
            {HOURS.map((h) => renderCell(day, h, true))}
          </div>
        </div>

        {/* Desktop: full week grid */}
        <div className="mt-5 hidden rounded-[28px] bg-white p-4 shadow-clay md:block">
          <div className="grid gap-1" style={{ gridTemplateColumns: `56px repeat(${DAYS}, minmax(0,1fr))` }} onPointerLeave={() => (drag.current = null)}>
            <span />
            {Array.from({ length: DAYS }).map((_, d) => (
              <span key={d} className={cn("pb-1 text-center text-xs font-bold", best?.day === d ? "text-purple-deep" : "text-muted")}>
                {dayLabel(plan, d)}
              </span>
            ))}
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <span className="flex items-center justify-end pr-2 text-[11px] font-semibold text-muted">{formatHour(h)}</span>
                {Array.from({ length: DAYS }).map((_, d) => renderCell(d, h))}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
            <span>Fewer free</span>
            {["bg-lavender-soft", "bg-lavender/60", "bg-lavender", "bg-purple/70", "bg-purple"].map((c) => (
              <span key={c} className={cn("h-4 w-8 rounded", c)} aria-hidden />
            ))}
            <span>Everyone free</span>
            <span className="ml-auto inline-flex items-center gap-1.5">
              <span className="h-4 w-4 rounded ring-2 ring-ink ring-inset" /> Your hours
            </span>
          </div>
        </div>
        {editable && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="purple"
              onClick={() => {
                setSlots(plan.id, [...mine]);
                toast("success", "Free hours saved", `${mine.size} hours marked. The best slot updates live.`);
              }}
            >
              Save my hours
            </Button>
            <Button variant="secondary" onClick={() => setSlots(plan.id, [])} disabled={mine.size === 0}>
              Clear mine
            </Button>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="text-base font-bold">Who&apos;s marked hours</h3>
          <p className="mt-1 text-xs font-medium text-muted">{organiser ? "Mark someone as required — e.g. whose birthday it is. The best slot will always include them." : "The organiser can mark required members."}</p>
          <ul className="mt-3 space-y-2">
            {plan.members.map((m) => {
              const n = plan.availability[m.userId]?.length ?? 0;
              return (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <Avatar person={people[m.userId]} size={30} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {m.userId === ME ? "You" : people[m.userId]?.name}
                    <span className="block text-[11px] font-medium text-muted">{n ? `${n} hours` : "Not yet"}</span>
                  </span>
                  <button
                    disabled={!organiser || !editable}
                    onClick={() => toggleRequired(plan.id, m.userId)}
                    aria-pressed={m.isRequired}
                    className={cn("inline-flex h-8 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition disabled:cursor-default", m.isRequired ? "border-2 border-ink bg-coral text-ink shadow-pop" : "bg-canvas text-muted enabled:hover:bg-white enabled:hover:shadow-clay-sm")}
                  >
                    <CrownSimpleIcon size={12} weight={m.isRequired ? "fill" : "bold"} /> {m.isRequired ? "Required" : "Optional"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
