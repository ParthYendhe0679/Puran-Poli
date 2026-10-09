"use client";

import { useRef, useState } from "react";
import { CameraIcon, CheckCircleIcon, ClockIcon, MapPinIcon, NavigationArrowIcon, PersonSimpleRunIcon, PlayCircleIcon, TrashIcon, VideoCameraIcon } from "@phosphor-icons/react";
import type { ArrivalState } from "@/types";
import { cn } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { downscaleImage } from "@/lib/share";
import { usePlanId } from "@/features/plans/PlanShell";
import { winnerOf } from "@/features/plans/plan-meta";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState, toast } from "@/components/ui/feedback";

const ARRIVAL: Record<ArrivalState, { label: string; kind: "neutral" | "info" | "success" | "warning" }> = {
  not_started: { label: "Not left yet", kind: "neutral" },
  on_the_way: { label: "On the way", kind: "info" },
  arrived: { label: "Arrived", kind: "success" },
  late: { label: "Running late", kind: "warning" },
};

function shift(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + minutes;
  const hh = Math.floor(t / 60) % 24;
  const mm = t % 60;
  const d = new Date();
  d.setHours(hh, mm);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function EventDayPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const setArrival = useDemo((s) => s.setArrival);
  const reportLate = useDemo((s) => s.reportLate);
  const simulateArrivals = useDemo((s) => s.simulateArrivals);
  const addPhoto = useDemo((s) => s.addPhoto);
  const removePhoto = useDemo((s) => s.removePhoto);
  const finishEvent = useDemo((s) => s.finishEvent);
  const startEventDay = useDemo((s) => s.startEventDay);
  const [lateOpen, setLateOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!plan) return null;

  if (plan.status === "confirmed") {
    return <EmptyState title="Event day hasn't started" body="It opens on the day of the plan. For the demo you can start it now." action={<Button variant="purple" onClick={() => startEventDay(plan.id)}>Start event day (demo)</Button>} />;
  }
  if (!["event_day", "settling", "completed"].includes(plan.status)) {
    return <EmptyState title="Event day comes after confirmation" body="Once the plan is confirmed, the schedule and arrivals appear here." mood="think" action={<ButtonLink href={`/p/${plan.id}/pay`} variant="purple">See payment progress</ButtonLink>} />;
  }

  const winner = winnerOf(plan);
  const me = plan.arrivals[ME];
  const lateBy = Math.max(0, ...Object.values(plan.arrivals).map((a) => (a.state === "late" ? (a.lateBy ?? 0) : 0)));
  const active = plan.status === "event_day";

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    for (const f of Array.from(files).slice(0, 4)) {
      if (!f.type.startsWith("image/")) {
        toast("error", `${f.name} isn't an image`, "Videos are previewed only in the full product.");
        continue;
      }
      if (f.size > 15 * 1024 * 1024) {
        toast("error", `${f.name} is too large`, "Pick a photo under 15 MB.");
        continue;
      }
      try {
        const src = await downscaleImage(f, 480, 0.7);
        addPhoto(plan.id, { userId: ME, src, caption: f.name.replace(/\.[^.]+$/, "").slice(0, 40), tone: "lavender", icon: "sparkle" });
      } catch (e) {
        toast("error", "Couldn't read that photo", (e as Error).message);
      }
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <div>
          <Kicker tone="coral">{active ? "Today" : "Event day recap"}</Kicker>
          <h2 className="mt-3 text-2xl font-extrabold">{winner?.title ?? plan.title}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-muted">
            <MapPinIcon size={16} weight="duotone" /> {plan.finalPlace}
          </p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <ClockIcon size={20} weight="duotone" className="text-purple" /> Schedule
            </h3>
            {lateBy > 0 && <Badge kind="warning">Shifted +{lateBy} min</Badge>}
          </div>
          <ol className="relative space-y-4 border-l-2 border-dashed border-ink/15 pl-6">
            {plan.schedule.map((s, i) => (
              <li key={s.id} className="relative">
                <span className={cn("absolute -left-[33px] top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-ink", i === 0 ? "bg-sun" : "bg-white")} aria-hidden />
                <p className="tabular text-sm font-bold">
                  {lateBy > 0 && i > 0 ? (
                    <>
                      <span className="mr-1.5 text-faint line-through">{shift(s.time, 0)}</span>
                      {shift(s.time, lateBy)}
                    </>
                  ) : (
                    shift(s.time, 0)
                  )}
                </p>
                <p className="text-[15px] font-semibold">{s.title}</p>
                {s.place && <p className="text-xs font-medium text-muted">{s.place}</p>}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold">Shared photos</h3>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" id="photo-input" onChange={(e) => onFiles(e.target.files)} />
              <Button size="sm" variant="primary" loading={busy} onClick={() => fileRef.current?.click()}>
                <CameraIcon size={16} weight="bold" /> Add photos
              </Button>
            </div>
          </div>
          {plan.photos.length === 0 ? (
            <p className="rounded-2xl bg-canvas p-6 text-center text-sm font-medium text-muted">No photos yet — add the first one.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {plan.photos.map((ph) => (
                <figure key={ph.id} className="group relative overflow-hidden rounded-[20px] bg-canvas shadow-clay-sm">
                  {ph.src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local data URL from the user's device
                    <img src={ph.src} alt={ph.caption} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="grid aspect-square place-items-center bg-dots">
                      <ArtTile icon={ph.icon} tone={ph.tone} size={64} />
                    </div>
                  )}
                  <figcaption className="flex items-center gap-1.5 p-2 text-xs font-semibold">
                    <Avatar person={people[ph.userId]} size={20} />
                    <span className="truncate">{ph.caption}</span>
                  </figcaption>
                  {ph.userId === ME && (
                    <button onClick={() => removePhoto(plan.id, ph.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 opacity-0 shadow-clay-sm transition group-hover:opacity-100 focus:opacity-100" aria-label={`Remove ${ph.caption}`}>
                      <TrashIcon size={14} weight="bold" />
                    </button>
                  )}
                </figure>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs font-medium text-muted">Photos are resized and kept only in this browser.</p>
        </div>
      </div>

      <aside className="space-y-4">
        {active && (
          <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
            <p className="text-sm font-bold">Your status</p>
            <div className="mt-3 grid gap-2">
              <Button variant={me?.state === "on_the_way" ? "purple" : "outline"} onClick={() => setArrival(plan.id, ME, { state: "on_the_way", etaMinutes: 15 })}>
                <NavigationArrowIcon size={18} weight="bold" /> I&apos;m on my way
              </Button>
              <Button variant={me?.state === "arrived" ? "success" : "secondary"} onClick={() => setArrival(plan.id, ME, { state: "arrived" })}>
                <CheckCircleIcon size={18} weight="bold" /> I&apos;ve arrived
              </Button>
              <Button variant="soft" onClick={() => setLateOpen(true)}>
                <ClockIcon size={18} weight="bold" /> I will be late
              </Button>
            </div>
            <p className="mt-3 text-[11px] font-medium text-muted">Live location sharing is simulated — no location is read.</p>
          </div>
        )}

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold">Who&apos;s on the way</h3>
            {active && (
              <Button size="sm" variant="ghost" onClick={() => simulateArrivals(plan.id)}>
                <PersonSimpleRunIcon size={16} weight="bold" /> Simulate
              </Button>
            )}
          </div>
          <ul className="space-y-2">
            {plan.members.map((m) => {
              const a = plan.arrivals[m.userId] ?? { state: "not_started" as const };
              const meta = ARRIVAL[a.state];
              return (
                <li key={m.userId} className="flex items-center gap-2.5">
                  <Avatar person={people[m.userId]} size={30} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.userId === ME ? "You" : people[m.userId]?.name}</span>
                  <Badge kind={meta.kind}>{a.state === "on_the_way" && a.etaMinutes ? `${a.etaMinutes} min away` : a.state === "late" ? `${a.lateBy} min late` : meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-[28px] bg-ink p-5 text-white">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <VideoCameraIcon size={20} weight="duotone" /> Live for those who missed it
            </h3>
          </div>
          {live ? (
            <div className="mt-3 grid aspect-video place-items-center rounded-2xl border-2 border-white/20 bg-white/5 text-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-0.5 text-[11px] font-bold">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE (demo)
                </span>
                <p className="mt-2 text-xs text-white/70">Live video is simulated in this prototype.</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/70">Stream a moment (like the cake cutting) to members who couldn&apos;t come.</p>
          )}
          <Button variant="sun" size="sm" className="mt-3" onClick={() => setLive((v) => !v)} disabled={!active}>
            <PlayCircleIcon size={16} weight="bold" /> {live ? "End live (demo)" : "Go live (demo)"}
          </Button>
        </div>

        {active ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => {
              finishEvent(plan.id);
              toast("success", "Event finished", "Time to split the bill.");
            }}
          >
            Event over → split the bill
          </Button>
        ) : (
          <ButtonLink href={`/p/${plan.id}/bill`} className="w-full">
            Go to bill split
          </ButtonLink>
        )}
        <DemoTag>Arrivals & live video simulated</DemoTag>
      </aside>

      <Sheet open={lateOpen} onOpenChange={setLateOpen} title="How late will you be?" description="The schedule shifts for everyone and they get a polite heads-up.">
        <div className="grid grid-cols-3 gap-2">
          {[10, 20, 30].map((m) => (
            <Button
              key={m}
              variant="outline"
              size="lg"
              onClick={() => {
                reportLate(plan.id, m);
                setLateOpen(false);
                toast("info", `Everyone knows you're ${m} min late`);
              }}
            >
              {m} min
            </Button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
