import type { Plan } from "@/types";

/**
 * Advance-payment confirmation — project document §9 Feature 1:
 *  - held share = total ÷ minimum members
 *  - when more members pay than the minimum, the final share = total ÷ paid members
 *    and the difference is returned to every member.
 */
export interface PaymentSummary {
  total: number;
  min: number;
  maxSeats: number;
  paidCount: number;
  needed: number;
  heldShare: number;
  finalShare: number;
  refundEach: number;
  seatsLeft: number;
  progress: number; // 0..1 towards minimum
  reached: boolean;
}

export function planTotalCost(plan: Plan): number {
  if (plan.totalCost && plan.totalCost > 0) return plan.totalCost;
  const winner = plan.ideas.find((i) => i.id === plan.winnerIdeaId);
  return (winner?.costPerPerson ?? 0) * plan.minMembers;
}

export function paymentSummary(plan: Plan): PaymentSummary {
  const total = planTotalCost(plan);
  const min = plan.minMembers;
  const paidCount = plan.payments.filter((p) => p.status === "held" || p.status === "captured").length;
  const heldShare = Math.ceil(total / min);
  const finalShare = Math.round(total / Math.max(min, paidCount));
  const refundEach = paidCount > min ? heldShare - finalShare : 0;
  return {
    total,
    min,
    maxSeats: plan.maxSeats,
    paidCount,
    needed: Math.max(0, min - paidCount),
    heldShare,
    finalShare,
    refundEach,
    seatsLeft: Math.max(0, plan.maxSeats - paidCount),
    progress: Math.min(1, paidCount / min),
    reached: paidCount >= min,
  };
}

/** Share the next member would pay right now. */
export function nextJoinShare(plan: Plan): number {
  const s = paymentSummary(plan);
  return s.reached ? Math.round(s.total / (s.paidCount + 1)) : s.heldShare;
}
