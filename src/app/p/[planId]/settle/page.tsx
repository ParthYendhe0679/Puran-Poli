"use client";

import { useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircleIcon, PlusIcon, QrCodeIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { cn, formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { computeBalances, isSettled, minimumTransfers, naivePaymentCount, type Transfer } from "@/lib/calc/settle";
import { upiLink } from "@/lib/share";
import { usePlanId } from "@/features/plans/PlanShell";
import { Avatar } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { CopyButton, EmptyState, QRImage, toast } from "@/components/ui/feedback";

export default function SettlePage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const markSettlement = useDemo((s) => s.markSettlement);
  const addExpense = useDemo((s) => s.addExpense);
  const removeExpense = useDemo((s) => s.removeExpense);
  const completePlan = useDemo((s) => s.completePlan);
  const [upiFor, setUpiFor] = useState<Transfer | null>(null);
  const [expOpen, setExpOpen] = useState(false);
  const [exp, setExp] = useState({ note: "", amount: "", paidBy: ME });
  const [expErr, setExpErr] = useState<string | null>(null);

  const balances = useMemo(() => (plan ? computeBalances(plan) : []), [plan]);
  const transfers = useMemo(() => minimumTransfers(balances), [balances]);
  if (!plan) return null;
  if (!plan.bill && plan.expenses.length === 0) {
    return <EmptyState title="Nothing to settle yet" body="Scan the bill or add an expense first." action={<ButtonLink href={`/p/${plan.id}/bill`} variant="purple">Go to bill split</ButtonLink>} />;
  }
  const name = (id: string) => (id === ME ? "You" : (people[id]?.name ?? "?"));
  const done = transfers.filter((t) => isSettled(plan, t)).length;
  const allDone = transfers.length > 0 && done === transfers.length;
  const naive = naivePaymentCount(balances.filter((b) => b.net !== 0));

  const submitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(exp.amount);
    if (!exp.note.trim()) return setExpErr("What was it for?");
    if (!Number.isFinite(amount) || amount <= 0) return setExpErr("Enter an amount above ₹0.");
    addExpense(plan.id, { note: exp.note.trim(), amount: Math.round(amount), paidBy: exp.paidBy, splitAmong: plan.members.map((m) => m.userId) });
    setExp({ note: "", amount: "", paidBy: ME });
    setExpErr(null);
    setExpOpen(false);
    toast("success", "Expense added", "Split equally between all members.");
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker tone="mint">Settle up</Kicker>
            <h2 className="mt-3 text-2xl font-extrabold">{transfers.length === 0 ? "Everyone is even" : `${transfers.length} payment${transfers.length === 1 ? "" : "s"} settle everything`}</h2>
            <p className="mt-1 text-sm font-medium text-muted">Balances are netted so the group pays in the fewest steps{naive > transfers.length ? ` — ${transfers.length} instead of up to ${naive}` : ""}.</p>
          </div>
          <DemoTag>Demo UPI handles · no money moves</DemoTag>
        </div>

        <ul className="space-y-3">
          {transfers.map((t) => {
            const paid = isSettled(plan, t);
            const mine = t.from === ME;
            return (
              <li key={t.key} className={cn("flex flex-wrap items-center gap-3 rounded-[24px] bg-white p-4 shadow-clay-sm", mine && !paid && "ring-2 ring-ink shadow-pop")}>
                <div className="flex items-center gap-2">
                  <Avatar person={people[t.from]} size={36} />
                  <ArrowRightIcon size={16} weight="bold" className="text-muted" />
                  <Avatar person={people[t.to]} size={36} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {name(t.from)} {mine ? "pay" : "pays"} {name(t.to)}
                  </p>
                  <p className="tabular font-display text-lg font-extrabold">{formatINR(t.amount)}</p>
                </div>
                {paid ? (
                  <div className="flex items-center gap-2">
                    <Badge kind="success">
                      <CheckCircleIcon size={12} weight="fill" /> Settled
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => markSettlement(plan.id, t.key, false)}>
                      Undo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mine && (
                      <Button size="sm" variant="purple" onClick={() => setUpiFor(t)}>
                        Pay {formatINR(t.amount)} to {name(t.to)}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        markSettlement(plan.id, t.key, true);
                        toast("success", "Marked as settled", "This records the payment — it doesn't send money.");
                      }}
                    >
                      Mark paid
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {allDone && plan.status === "settling" && (
          <div className="flex flex-col items-start gap-3 rounded-[24px] border-2 border-ink bg-mint p-5 shadow-pop sm:flex-row sm:items-center">
            <p className="flex-1 font-display text-lg font-bold">All settled! 🎉</p>
            <Button
              variant="primary"
              onClick={() => {
                completePlan(plan.id);
                toast("success", "Plan completed", "Your event summary is ready.");
              }}
            >
              Complete plan & see summary
            </Button>
          </div>
        )}
        {plan.status === "completed" && (
          <ButtonLink href={`/p/${plan.id}/summary`} variant="purple">
            View event summary <ArrowRightIcon size={18} weight="bold" />
          </ButtonLink>
        )}

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold">Expenses</h3>
            <Button size="sm" variant="soft" onClick={() => setExpOpen(true)}>
              <PlusIcon size={16} weight="bold" /> Add expense
            </Button>
          </div>
          <ul className="divide-y divide-line text-sm">
            {plan.bill && (
              <li className="flex items-center justify-between gap-2 py-2.5">
                <span className="font-semibold">Bill · {plan.bill.venue}</span>
                <span className="text-xs font-medium text-muted">paid by {name(plan.bill.paidBy)} · item-wise</span>
              </li>
            )}
            {plan.expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{e.note}</span>
                  <span className="text-xs font-medium text-muted">
                    {name(e.paidBy)} paid · split between {e.splitAmong.length}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular font-bold">{formatINR(e.amount)}</span>
                  <button onClick={() => removeExpense(plan.id, e.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${e.note}`}>
                    <TrashIcon size={14} weight="bold" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="text-base font-bold">How we got here</h3>
          <p className="mt-1 text-xs font-medium text-muted">balance = paid − owed</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] font-bold uppercase tracking-wider text-muted">
                <tr>
                  <th className="py-1.5">Member</th>
                  <th className="py-1.5 text-right">Paid</th>
                  <th className="py-1.5 text-right">Owed</th>
                  <th className="py-1.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.userId} className="border-t border-line">
                    <td className="py-2 font-semibold">{name(b.userId)}</td>
                    <td className="tabular py-2 text-right">{formatINR(b.paid)}</td>
                    <td className="tabular py-2 text-right">{formatINR(b.owed)}</td>
                    <td className={cn("tabular py-2 text-right font-bold", b.net > 0 ? "text-success" : b.net < 0 ? "text-coral-deep" : "")}>{b.net > 0 ? "+" : ""}{formatINR(b.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] font-medium text-muted">The biggest debtor pays the biggest creditor first; repeat. At most n − 1 payments.</p>
        </div>
        <div className="flex items-start gap-2 rounded-[24px] bg-sky-soft p-4 text-xs font-medium text-sky-deep">
          <WarningCircleIcon size={18} weight="fill" className="shrink-0" /> Since Oct 2025, UPI doesn&apos;t allow person-to-person collect requests, so the person who owes starts the payment from a pre-filled link.
        </div>
      </aside>

      <Sheet open={!!upiFor} onOpenChange={(o) => !o && setUpiFor(null)} title={upiFor ? `Pay ${formatINR(upiFor.amount)} to ${name(upiFor.to)}` : ""} description="Opens your UPI app with the amount filled in. You approve the payment there.">
        {upiFor && (() => {
          const to = people[upiFor.to];
          const link = upiLink({ vpa: to?.upiId ?? "demo@demo-upi", name: to?.name ?? "Friend", amount: upiFor.amount, note: plan.title });
          return (
            <div className="space-y-4 text-center">
              <div className="mx-auto w-fit">
                <QRImage value={link} label={`UPI QR for ${formatINR(upiFor.amount)}`} />
              </div>
              <p className="text-xs font-semibold text-muted">
                <QrCodeIcon size={14} className="mr-1 inline" /> On a laptop? Scan this with your phone.
              </p>
              <div className="rounded-2xl bg-white p-3 text-left shadow-clay-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">UPI link</p>
                <p className="mt-1 break-all font-mono text-xs">{link}</p>
              </div>
              <p className="rounded-2xl bg-sun-soft p-3 text-xs font-semibold text-sun-deep">Demo handle ({to?.upiId}) — UPI apps will reject it, so no money can move. Set your real UPI ID in Settings for the full product.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <CopyButton text={`${to?.upiId} · ${formatINR(upiFor.amount)} · ${plan.title}`} label="Copy UPI ID & amount" />
                <ButtonLink href={link} variant="outline" size="sm">
                  Open UPI app
                </ButtonLink>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    markSettlement(plan.id, upiFor.key, true);
                    setUpiFor(null);
                    toast("success", "Marked as paid", `${name(upiFor.to)} will see it as settled.`);
                  }}
                >
                  I&apos;ve paid — mark settled
                </Button>
              </div>
            </div>
          );
        })()}
      </Sheet>

      <Sheet open={expOpen} onOpenChange={setExpOpen} title="Add an expense" description="Split equally between all members of the plan.">
        <form onSubmit={submitExpense} noValidate className="space-y-4">
          <Field label="What for?" error={expErr ?? undefined}>
            {(id, d) => <Input id={id} aria-describedby={d} value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} placeholder="Cab back home" autoFocus />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (₹)">{(id) => <Input id={id} type="number" min={1} inputMode="numeric" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} placeholder="480" />}</Field>
            <Field label="Paid by">
              {(id) => (
                <Select id={id} value={exp.paidBy} onChange={(e) => setExp({ ...exp, paidBy: e.target.value })} className="h-12">
                  {plan.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {name(m.userId)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setExpOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="purple">
              Add expense
            </Button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
