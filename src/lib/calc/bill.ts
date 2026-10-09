import type { Bill } from "@/types";

/**
 * Item-wise bill split — project document §13.6:
 *   member_food   = Σ item price ÷ members who selected it (food + soft drinks)
 *   member_tax    = member_food ÷ total food × (GST + service charge − discount)
 *   member_drinks = alcoholic items, split only between those who selected them
 *   member_total  = food + drinks + tax, rounded to whole rupees; the rounding
 *                   difference is assigned to the payer.
 */
export interface MemberShare {
  userId: string;
  food: number;
  alcohol: number;
  tax: number;
  total: number;
}

export interface BillSplit {
  shares: MemberShare[];
  itemsTotal: number;
  foodTotal: number;
  charges: number;
  billTotal: number;
  unassigned: string[];
  subtotalMatches: boolean;
  subtotalDiff: number;
  roundingAdjustment: number;
}

export function billTotal(bill: Bill): number {
  const items = bill.items.reduce((s, i) => s + i.price, 0);
  return items + bill.gst + (bill.removeServiceCharge ? 0 : bill.serviceCharge) - bill.discount;
}

export function splitBill(bill: Bill, memberIds: string[]): BillSplit {
  const raw = new Map<string, { food: number; alcohol: number }>(memberIds.map((id) => [id, { food: 0, alcohol: 0 }]));
  const unassigned: string[] = [];
  let foodTotal = 0;
  let itemsTotal = 0;

  for (const item of bill.items) {
    itemsTotal += item.price;
    const takers = item.selectedBy.filter((id) => raw.has(id));
    if (takers.length === 0) {
      unassigned.push(item.id);
      continue;
    }
    const each = item.price / takers.length;
    for (const id of takers) {
      const r = raw.get(id)!;
      if (item.category === "alcohol") r.alcohol += each;
      else r.food += each;
    }
    if (item.category !== "alcohol") foodTotal += item.price;
  }

  const charges = bill.gst + (bill.removeServiceCharge ? 0 : bill.serviceCharge) - bill.discount;
  const total = itemsTotal + charges;

  const shares: MemberShare[] = memberIds.map((id) => {
    const r = raw.get(id)!;
    const tax = foodTotal > 0 ? (r.food / foodTotal) * charges : 0;
    return { userId: id, food: r.food, alcohol: r.alcohol, tax, total: Math.round(r.food + r.alcohol + tax) };
  });

  // Rounding difference (only meaningful once everything is assigned) goes to the payer.
  let roundingAdjustment = 0;
  if (unassigned.length === 0) {
    const assigned = shares.reduce((s, x) => s + x.total, 0);
    roundingAdjustment = Math.round(total) - assigned;
    const payer = shares.find((s) => s.userId === bill.paidBy);
    if (payer && roundingAdjustment !== 0) payer.total += roundingAdjustment;
  }

  const diff = Math.round(itemsTotal - bill.printedSubtotal);
  return {
    shares,
    itemsTotal,
    foodTotal,
    charges,
    billTotal: total,
    unassigned,
    subtotalMatches: diff === 0,
    subtotalDiff: diff,
    roundingAdjustment,
  };
}
