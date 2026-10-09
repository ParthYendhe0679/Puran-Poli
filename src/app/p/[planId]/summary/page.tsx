"use client";

import { useMemo } from "react";
import { CheckCircleIcon, ClockIcon, CurrencyInrIcon, LightbulbIcon, UsersThreeIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { durationLabel, formatDateTime, formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { paymentSummary } from "@/lib/calc/payments";
import { computeBalances, isSettled, minimumTransfers } from "@/lib/calc/settle";
import { billTotal } from "@/lib/calc/bill";
import { rankIdeas } from "@/lib/calc/voting";
import { slotLabel } from "@/lib/calc/availability";
import { planUrl, whatsappShareUrl } from "@/lib/share";
import { usePlanId } from "@/features/plans/PlanShell";
import { winnerOf } from "@/features/plans/plan-meta";
import { SummaryVideo, type Scene } from "@/features/summaries/SummaryVideo";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, Kicker } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { CopyButton, EmptyState } from "@/components/ui/feedback";

export default function SummaryPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);

  const data = useMemo(() => {
    if (!plan) return null;
    const winner = winnerOf(plan);
    const pay = paymentSummary(plan);
    const transfers = minimumTransfers(computeBalances(plan));
    const settled = transfers.filter((t) => isSettled(plan, t)).length;
    const spent = (plan.bill ? billTotal(plan.bill) : 0) + plan.expenses.reduce((s, e) => s + e.amount, 0);
    const top = rankIdeas(plan)[0];
    const votes = Object.values(plan.votes).length;
    const going = plan.payments.filter((p) => p.status === "captured" || p.status === "held").length;
    const scenes: Scene[] = [
      { kicker: plan.title, title: `${plan.ideas.length} ideas on the table`, sub: `Suggested by ${new Set(plan.ideas.map((i) => i.proposedBy)).size} members`, bg: "#ece5fe" },
      { kicker: "The vote", title: winner ? `${winner.title} won` : "Vote complete", sub: `${votes} members voted · score ${top?.finalScore ?? 0}`, bg: "#e3effc" },
      { kicker: "Commitment", title: `${going} paid in advance`, sub: `Confirmed${plan.confirmedAt ? ` in ${durationLabel(plan.createdAt, plan.confirmedAt)}` : ""}`, bg: "#e8f4dc" },
      { kicker: "The day", title: `${plan.photos.length} shared photos`, sub: plan.finalPlace ?? plan.area, bg: "#fef3d6" },
      { kicker: "Split", title: `${formatINR(spent || pay.total)} spent`, sub: `Settled in ${transfers.length} payment${transfers.length === 1 ? "" : "s"}`, bg: "#fde3d9" },
    ];
    return { winner, pay, transfers, settled, spent, scenes, going };
  }, [plan]);

  if (!plan || !data) return null;
  if (!["settling", "completed", "event_day"].includes(plan.status)) {
    return <EmptyState title="The summary appears after the event" body="Come back once the plan has happened." mood="think" action={<ButtonLink href={`/p/${plan.id}`} variant="purple">Back to plan</ButtonLink>} />;
  }
  const { winner, transfers, settled, spent, scenes, going } = data;
  const shareText = `${plan.title} recap: ${winner?.title ?? ""} with ${going} friends, ${formatINR(spent)} split fairly. ${planUrl(plan.id, "/summary")}`;

  return (
    <div className="space-y-6 pb-6">
      <div>
        <Kicker tone="purple">Event summary</Kicker>
        <h2 className="mt-3 text-2xl font-extrabold">{winner?.title ?? plan.title} — the recap</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { i: LightbulbIcon, k: "Ideas", v: String(plan.ideas.length), tone: "lavender" as const },
          { i: UsersThreeIcon, k: "Went", v: `${going} members`, tone: "mint" as const },
          { i: ClockIcon, k: "Decided in", v: plan.confirmedAt ? durationLabel(plan.createdAt, plan.confirmedAt) : "—", tone: "sky" as const },
          { i: CurrencyInrIcon, k: "Total spent", v: formatINR(spent), tone: "sun" as const },
        ].map((s) => (
          <div key={s.k} className="rounded-[24px] bg-white p-4 shadow-clay-sm">
            <ArtTile glyph={s.i} tone={s.tone} size={36} />
            <p className="mt-2 text-xs font-semibold text-muted">{s.k}</p>
            <p className="tabular font-display text-xl font-extrabold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-clay sm:p-6">
        <h3 className="mb-4 text-base font-bold">Summary video</h3>
        <SummaryVideo scenes={scenes} filename={`${plan.id}-summary.webm`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="mb-4 text-base font-bold">Timeline</h3>
          <ol className="relative space-y-4 border-l-2 border-dashed border-ink/15 pl-5">
            {[...plan.activity].reverse().slice(-10).map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-ink bg-sun" aria-hidden />
                <p className="text-sm font-semibold">
                  {a.actor ? `${a.actor === ME ? "You" : people[a.actor]?.name} ` : ""}
                  {a.text}
                </p>
                <p className="text-[11px] font-medium text-faint">{formatDateTime(a.at)}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-5 shadow-clay">
            <h3 className="mb-3 text-base font-bold">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {plan.photos.slice(0, 6).map((ph) =>
                ph.src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local data URL
                  <img key={ph.id} src={ph.src} alt={ph.caption} className="aspect-square w-full rounded-2xl object-cover" />
                ) : (
                  <div key={ph.id} className="grid aspect-square place-items-center rounded-2xl bg-canvas" title={ph.caption}>
                    <ArtTile icon={ph.icon} tone={ph.tone} size={44} />
                  </div>
                ),
              )}
              {plan.photos.length === 0 && <p className="col-span-3 text-sm font-medium text-muted">No photos were shared.</p>}
            </div>
          </div>
          <div className="rounded-[28px] bg-white p-5 shadow-clay">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold">Bill & settlement</h3>
              <Badge kind={settled === transfers.length ? "success" : "warning"}>
                {settled}/{transfers.length} settled
              </Badge>
            </div>
            <ul className="space-y-2">
              {transfers.map((t) => (
                <li key={t.key} className="flex items-center gap-2 text-sm">
                  <Avatar person={people[t.from]} size={24} />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {t.from === ME ? "You" : people[t.from]?.name} → {t.to === ME ? "you" : people[t.to]?.name}
                  </span>
                  <span className="tabular font-bold">{formatINR(t.amount)}</span>
                  {isSettled(plan, t) && <CheckCircleIcon size={16} weight="fill" className="text-success" />}
                </li>
              ))}
            </ul>
            {plan.finalSlot && <p className="mt-3 text-xs font-medium text-muted">{slotLabel(plan, plan.finalSlot)}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={whatsappShareUrl(shareText)} external variant="outline">
              <WhatsappLogoIcon size={18} weight="bold" /> Share summary
            </ButtonLink>
            <CopyButton text={shareText} label="Copy summary text" size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
