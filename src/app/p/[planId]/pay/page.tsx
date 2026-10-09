"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  HandCoinsIcon,
  InfoIcon,
  LockKeyIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { cn, formatDateTime, formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { nextJoinShare, paymentSummary } from "@/lib/calc/payments";
import { usePlanId } from "@/features/plans/PlanShell";
import { MEMBER_STATUS, hasPaid, winnerOf, isOrganiser } from "@/features/plans/plan-meta";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, Burst, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Countdown, EmptyState, toast } from "@/components/ui/feedback";

type PayStep = "review" | "processing" | "success" | "failed";

function AnimatedAmount({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span key={value} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 24 }} className="tabular inline-block">
        {formatINR(value)}
      </motion.span>
    </AnimatePresence>
  );
}

export default function PayPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const joinAndPay = useDemo((s) => s.joinAndPay);
  const simulateMember = useDemo((s) => s.simulateMemberPayment);
  const simulateDeadline = useDemo((s) => s.simulateDeadline);
  const restart = useDemo((s) => s.restartWithRunnerUp);
  const setIntent = useDemo((s) => s.setMyIntent);
  const [sheet, setSheet] = useState(false);
  const [step, setStep] = useState<PayStep>("review");
  const [failNext, setFailNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const prevStatus = useRef(plan?.status);

  useEffect(() => {
    if (plan && prevStatus.current === "collecting" && plan.status === "confirmed") {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 3500);
      prevStatus.current = plan.status;
      return () => clearTimeout(t);
    }
    prevStatus.current = plan?.status;
  }, [plan?.status, plan]);

  if (!plan) return null;
  const winner = winnerOf(plan);
  if (plan.status === "voting" || !winner) {
    return <EmptyState title="Payment opens after the vote" body="Once voting closes, the winning idea's share appears here and members can join by paying." action={<ButtonLink href={`/p/${plan.id}/vote`} variant="purple">Go to voting</ButtonLink>} />;
  }

  const s = paymentSummary(plan);
  const iPaid = hasPaid(plan);
  const myPay = plan.payments.find((p) => p.userId === ME);
  const share = nextJoinShare(plan);
  const canPay = (plan.status === "collecting" || plan.status === "confirmed") && !iPaid && s.seatsLeft > 0;
  const paidIds = new Set(plan.payments.filter((p) => p.status === "held" || p.status === "captured").map((p) => p.userId));
  const failed = plan.status === "not_confirmed";
  const confirmed = ["confirmed", "event_day", "settling", "completed"].includes(plan.status);

  const openPay = () => {
    setStep("review");
    setError(null);
    setSheet(true);
    setIntent(plan.id, "joining");
  };

  const pay = () => {
    setStep("processing");
    setTimeout(() => {
      const res = joinAndPay(plan.id, failNext);
      if (res.ok) {
        setStep("success");
        if (res.confirmedNow) toast("success", "Plan confirmed! 🎉", "You were the last required member.");
      } else {
        setError(res.reason);
        setStep("failed");
      }
      setFailNext(false);
    }, 1400);
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker tone="sun">Plan confirmation by advance payment</Kicker>
            <h2 className="mt-3 text-2xl font-extrabold">{failed ? "This plan was not confirmed" : confirmed ? "Confirmed — everyone's in" : "Join by paying your share"}</h2>
            <p className="mt-1 text-sm font-medium text-muted">{failed ? "Fewer members than required paid before the deadline." : confirmed ? "The minimum was reached, so every held payment was captured (simulated). Extra members still lower the share." : "Your payment is held, not charged, until the minimum is reached."}</p>
          </div>
          <DemoTag>Simulated payments — no real money</DemoTag>
        </div>

        <div className={cn("relative overflow-hidden rounded-[28px] border-2 border-ink bg-white p-5 shadow-pop-lg sm:p-7", celebrate && "animate-wiggle")}>
          <AnimatePresence>
            {celebrate && (
              <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 8 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 420, damping: 18 }} className="absolute right-4 top-4 z-10">
                <Burst tone="mint">YES!</Burst>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3">
            <ArtTile icon={winner.icon} tone={winner.tone} size={56} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold">{winner.title}</p>
              <p className="truncate text-sm font-medium text-muted">{plan.finalPlace ?? winner.place}</p>
            </div>
            <Badge kind={failed ? "danger" : confirmed ? "success" : "sun"} withDot pulse={plan.status === "collecting"} className="ml-auto">
              {failed ? "Not confirmed" : confirmed ? "Confirmed" : "Collecting"}
            </Badge>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Total cost", v: <span className="tabular">{formatINR(s.total)}</span> },
              { k: "Minimum", v: `${s.min} members` },
              { k: "Max seats", v: `${s.maxSeats}` },
              { k: confirmed && s.paidCount > s.min ? "Final share" : "Share per person", v: <AnimatedAmount value={confirmed ? s.finalShare : s.heldShare} /> },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-canvas p-3">
                <dt className="text-[11px] font-semibold text-muted">{x.k}</dt>
                <dd className="font-display text-lg font-extrabold">{x.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-2xl font-extrabold">
                <span className="tabular">{s.paidCount}</span>
                <span className="text-base text-faint"> of {s.min} required paid</span>
              </p>
              {plan.status === "collecting" && <Countdown to={plan.paymentDeadline} prefix="Deadline in" />}
            </div>
            <div className="relative h-5 w-full overflow-hidden rounded-full bg-ink/10 shadow-inner" role="progressbar" aria-label="Members paid towards the minimum" aria-valuenow={s.paidCount} aria-valuemin={0} aria-valuemax={s.maxSeats}>
              <motion.div className={cn("h-full rounded-full", failed ? "bg-gradient-to-r from-pink to-coral" : s.reached ? "bg-gradient-to-r from-mint to-success" : "bg-gradient-to-r from-lavender to-purple")} initial={false} animate={{ width: `${(Math.min(s.paidCount, s.maxSeats) / s.maxSeats) * 100}%` }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
              <span className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${(s.min / s.maxSeats) * 100}%` }} aria-hidden />
            </div>
            <div className="relative mt-1.5 h-4 text-[11px] font-semibold text-muted">
              <span className="absolute left-0">0</span>
              <span className="absolute -translate-x-1/2 text-ink" style={{ left: `${(s.min / s.maxSeats) * 100}%` }}>min {s.min}</span>
              <span className="absolute right-0">max {s.maxSeats}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-soft">
              {failed
                ? `Only ${s.paidCount} of ${s.min} paid by ${formatDateTime(plan.paymentDeadline)}. Every held payment was released (simulated).`
                : s.reached
                  ? s.paidCount > s.min
                    ? `${s.paidCount} paid — the share dropped from ${formatINR(s.heldShare)} to ${formatINR(s.finalShare)}. ${formatINR(s.refundEach)} goes back to each member (simulated).`
                    : `Minimum reached! ${s.seatsLeft} seat${s.seatsLeft === 1 ? "" : "s"} left — each extra member lowers everyone's share.`
                  : `${s.needed} more ${s.needed === 1 ? "member is" : "members are"} needed. Deadline: ${formatDateTime(plan.paymentDeadline)}.`}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {canPay && (
              <Button variant="purple" size="lg" onClick={openPay}>
                <HandCoinsIcon size={20} weight="bold" /> Join and pay {formatINR(share)}
              </Button>
            )}
            {iPaid && (
              <span className="inline-flex h-14 items-center gap-2 rounded-full bg-success-soft px-5 text-sm font-bold text-success">
                <CheckCircleIcon size={20} weight="fill" /> You paid {formatINR(myPay?.amount ?? 0)} · {myPay?.status === "held" ? "held" : "captured"} (simulated)
              </span>
            )}
            {confirmed && (
              <ButtonLink href={`/p/${plan.id}/final`} variant="outline" size="lg">
                Final plan <ArrowRightIcon size={18} weight="bold" />
              </ButtonLink>
            )}
            {failed && isOrganiser(plan) && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  restart(plan.id);
                  toast("info", "Restarted with the runner-up idea");
                }}
              >
                <ArrowCounterClockwiseIcon size={18} weight="bold" /> Try the runner-up idea
              </Button>
            )}
          </div>
          {failed && myPay && (
            <p className="mt-4 flex items-center gap-2 rounded-2xl bg-mint-soft p-3 text-sm font-semibold text-mint-deep">
              <ShieldCheckIcon size={18} weight="fill" /> Your {formatINR(myPay.amount)} was released. Nobody lost money.
            </p>
          )}
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="mb-3 text-base font-bold">Member commitments</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {plan.members.map((m) => {
              const paid = paidIds.has(m.userId);
              const released = plan.payments.some((p) => p.userId === m.userId && p.status === "released");
              const status = paid ? MEMBER_STATUS.paid : MEMBER_STATUS[m.status === "paid" ? "interested" : m.status];
              return (
                <li key={m.userId} className="flex items-center gap-2.5 rounded-2xl bg-canvas p-2.5">
                  <Avatar person={people[m.userId]} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.userId === ME ? "You" : people[m.userId]?.name}</span>
                  {released ? <Badge kind="info">Released</Badge> : <Badge kind={status.kind}>{status.label}</Badge>}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-muted">
            <InfoIcon size={14} className="mt-0.5 shrink-0" /> Reminders go privately to members who haven&apos;t paid — the group never sees who is late.
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="text-base font-bold">How the hold works</h3>
          <ol className="mt-3 space-y-3 text-sm font-medium text-ink-soft">
            {[
              { i: LockKeyIcon, t: `You pay ${formatINR(s.heldShare)} (total ÷ minimum). It is held, not charged.` },
              { i: CheckCircleIcon, t: `When the ${s.min}th member pays, all holds are captured and the plan is confirmed for everyone at once.` },
              { i: UserPlusIcon, t: "Every extra member lowers the share; the difference is returned automatically." },
              { i: ClockCountdownIcon, t: "Deadline missed? Every hold is released — nobody loses money." },
            ].map((x, idx) => (
              <li key={idx} className="flex gap-2.5">
                <x.i size={20} weight="duotone" className="shrink-0 text-purple" /> {x.t}
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-2xl bg-canvas p-3 text-xs font-medium text-muted">Real product: UPI Reserve Pay or Razorpay manual capture. This prototype never contacts a payment provider.</p>
        </div>

        {(plan.status === "collecting" || plan.status === "confirmed") && (
          <div className="rounded-[24px] border-2 border-dashed border-ink/20 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Demo controls</p>
              <DemoTag>Demo</DemoTag>
            </div>
            <p className="mt-1 text-xs font-medium text-muted">Play the other members so the flow can be shown on one screen.</p>
            <div className="mt-3 grid gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={s.seatsLeft <= 0 || plan.members.every((m) => m.userId === ME || paidIds.has(m.userId))}
                onClick={() => {
                  const who = simulateMember(plan.id);
                  if (who) toast("info", `${people[who]?.name} joined and paid`, "Simulated member payment.");
                }}
              >
                <UserPlusIcon size={16} weight="bold" /> Simulate next member paying
              </Button>
              {plan.status === "collecting" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    simulateDeadline(plan.id);
                    toast("warning", "Deadline passed (simulated)");
                  }}
                >
                  <ClockCountdownIcon size={16} weight="bold" /> Simulate deadline passing
                </Button>
              )}
              {!iPaid && canPay && (
                <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                  <input type="checkbox" checked={failNext} onChange={(e) => setFailNext(e.target.checked)} /> Make my next demo payment fail
                </label>
              )}
            </div>
          </div>
        )}
      </aside>

      <Sheet open={sheet} onOpenChange={(o) => step !== "processing" && setSheet(o)} title={step === "success" ? "You're in!" : step === "failed" ? "Payment didn't go through" : "Join and pay (demo)"} description={step === "review" ? "This is a simulated payment. No card or UPI details are collected." : undefined}>
        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted">Your share</span>
                <span className="tabular font-display text-3xl font-extrabold">{formatINR(share)}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-muted">{s.reached ? "The plan is already confirmed — your share is the new lower amount, and everyone else gets the difference back." : `Held until ${s.min} members pay. Released automatically if the deadline (${formatDateTime(plan.paymentDeadline)}) passes first.`}</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-sun-soft p-3 text-sm font-semibold text-sun-deep">
              <WarningCircleIcon size={20} weight="fill" className="shrink-0" /> Demo payment — nothing is charged, held or sent anywhere.
            </div>
            <Button variant="purple" size="lg" className="w-full" onClick={pay}>
              <LockKeyIcon size={20} weight="bold" /> Confirm demo payment
            </Button>
          </div>
        )}
        {step === "processing" && (
          <div className="py-8 text-center" role="status">
            <div className="mx-auto h-3 w-48 overflow-hidden rounded-full bg-ink/10">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-lavender to-purple" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.3, ease: [0.2, 0.8, 0.2, 1] }} />
            </div>
            <p className="mt-4 text-sm font-bold">Authorising a simulated hold…</p>
          </div>
        )}
        {step === "success" && (
          <div className="py-4 text-center">
            <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
              <CheckCircleIcon size={64} weight="fill" className="mx-auto text-success" />
            </motion.div>
            <p className="mt-3 font-display text-xl font-bold">{plan.status === "confirmed" ? "Plan confirmed!" : "Your share is held"}</p>
            <p className="mt-1 text-sm font-medium text-muted">{plan.status === "confirmed" ? "Everyone has been notified at the same time." : `${paymentSummary(plan).needed} more needed to confirm.`}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setSheet(false)}>
                Close
              </Button>
              {plan.status === "confirmed" && (
                <ButtonLink href={`/p/${plan.id}/final`} variant="purple">
                  Open final plan
                </ButtonLink>
              )}
            </div>
          </div>
        )}
        {step === "failed" && (
          <div className="py-4 text-center">
            <XCircleIcon size={64} weight="fill" className="mx-auto text-danger" />
            <p className="mt-3 text-sm font-semibold text-ink-soft">{error}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => setSheet(false)}>
                Close
              </Button>
              <Button variant="purple" onClick={() => setStep("review")}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
