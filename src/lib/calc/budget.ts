import type { Idea, Plan } from "@/types";

/**
 * Private budgets — project document §13.3.
 * These selectors are the ONLY way UI code reads budgets. They never return another
 * member's amount: just "fits / above N members" and an anonymous range (≥ 3 budgets).
 */
export const MIN_BUDGETS_FOR_AGGREGATES = 3;

export type BudgetLabel =
  | { kind: "fits" }
  | { kind: "above"; count: number }
  | { kind: "locked"; entered: number };

export function budgetLabel(plan: Plan, idea: Idea): BudgetLabel {
  const budgets = Object.values(plan.budgets);
  if (budgets.length < MIN_BUDGETS_FOR_AGGREGATES) return { kind: "locked", entered: budgets.length };
  const above = budgets.filter((b) => b.max < idea.costPerPerson).length;
  return above === 0 ? { kind: "fits" } : { kind: "above", count: above };
}

/** Used by the scoring formula. With no budgets entered nothing is penalised. */
export function budgetFitRatio(plan: Plan, idea: Idea): number {
  const budgets = Object.values(plan.budgets);
  if (budgets.length === 0) return 1;
  return budgets.filter((b) => b.max >= idea.costPerPerson).length / budgets.length;
}

export function groupComfortRange(plan: Plan): { low: number; high: number; entered: number } | null {
  const values = Object.values(plan.budgets)
    .map((b) => b.max)
    .sort((a, b) => a - b);
  if (values.length < MIN_BUDGETS_FOR_AGGREGATES) return null;
  const median = values[Math.floor(values.length / 2)];
  // Rounded to ₹100 so a single entry can't be read back exactly.
  return { low: Math.floor(values[0] / 100) * 100, high: Math.round(median / 100) * 100, entered: values.length };
}

export function budgetCount(plan: Plan): number {
  return Object.keys(plan.budgets).length;
}

/** Private to the current member only. */
export function fitsMyBudget(plan: Plan, idea: Idea, userId: string): boolean | null {
  const mine = plan.budgets[userId];
  if (!mine) return null;
  return mine.max >= idea.costPerPerson;
}
