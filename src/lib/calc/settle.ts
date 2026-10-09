import type { Plan } from "@/types";
import { splitBill } from "./bill";

export interface Transfer {
  key: string;
  from: string;
  to: string;
  amount: number;
}

export interface Balance {
  userId: string;
  paid: number;
  owed: number;
  net: number; // + receives, − pays
}

export function participantIds(plan: Plan): string[] {
  return plan.members.map((m) => m.userId);
}

/** balance = amount paid − amount owed (§13.5 step 1), from the bill + logged expenses. */
export function computeBalances(plan: Plan): Balance[] {
  const ids = participantIds(plan);
  const map = new Map(ids.map((id) => [id, { paid: 0, owed: 0 }]));
  const bump = (id: string, key: "paid" | "owed", n: number) => {
    if (!map.has(id)) map.set(id, { paid: 0, owed: 0 });
    map.get(id)![key] += n;
  };

  if (plan.bill) {
    const split = splitBill(plan.bill, ids);
    const assignedTotal = split.shares.reduce((s, x) => s + x.total, 0);
    bump(plan.bill.paidBy, "paid", assignedTotal);
    split.shares.forEach((s) => bump(s.userId, "owed", s.total));
  }
  for (const e of plan.expenses) {
    bump(e.paidBy, "paid", e.amount);
    const each = e.amount / Math.max(1, e.splitAmong.length);
    e.splitAmong.forEach((id) => bump(id, "owed", each));
  }
  return [...map.entries()].map(([userId, v]) => ({ userId, paid: Math.round(v.paid), owed: Math.round(v.owed), net: Math.round(v.paid - v.owed) }));
}

/**
 * Minimum number of payments (§13.5): repeatedly match the largest debtor with the largest
 * creditor; the payment is the smaller of the two. Needs at most (n − 1) payments.
 */
export function minimumTransfers(balances: Balance[]): Transfer[] {
  const debtors = balances.filter((b) => b.net < 0).map((b) => ({ id: b.userId, amt: -b.net }));
  const creditors = balances.filter((b) => b.net > 0).map((b) => ({ id: b.userId, amt: b.net }));
  const out: Transfer[] = [];
  let guard = 0;
  while (debtors.length && creditors.length && guard++ < 100) {
    debtors.sort((a, b) => b.amt - a.amt);
    creditors.sort((a, b) => b.amt - a.amt);
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.amt, c.amt);
    if (amount > 0) out.push({ key: `${d.id}->${c.id}`, from: d.id, to: c.id, amount });
    d.amt -= amount;
    c.amt -= amount;
    if (d.amt <= 0) debtors.shift();
    if (c.amt <= 0) creditors.shift();
  }
  return out;
}

export function naivePaymentCount(balances: Balance[]): number {
  // Without netting, every debtor pays every payer they owe — bounded by n × (n − 1) / 2.
  const n = balances.length;
  return Math.max(0, (n * (n - 1)) / 2);
}

export function planTransfers(plan: Plan): Transfer[] {
  return minimumTransfers(computeBalances(plan));
}

export function isSettled(plan: Plan, t: Transfer): boolean {
  return plan.settlementsPaid.some((s) => s.key === t.key);
}
