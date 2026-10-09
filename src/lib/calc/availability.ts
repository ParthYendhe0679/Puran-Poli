import type { FinalSlot, Plan } from "@/types";
import { formatHour } from "@/lib/format";

export const HOURS = Array.from({ length: 14 }, (_, i) => 9 + i); // 9 am … 10 pm start hours
export const DAYS = 7;

export const slotKey = (day: number, hour: number) => `${day}:${hour}`;

export function dayDate(plan: Plan, day: number): Date {
  const d = new Date(plan.weekStart);
  d.setDate(d.getDate() + day);
  return d;
}

export function dayLabel(plan: Plan, day: number, style: "short" | "long" = "short"): string {
  return dayDate(plan, day).toLocaleDateString("en-IN", style === "short" ? { weekday: "short", day: "numeric" } : { weekday: "long", day: "numeric", month: "short" });
}

export function slotCounts(plan: Plan): Map<string, number> {
  const counts = new Map<string, number>();
  for (const slots of Object.values(plan.availability)) {
    for (const k of slots) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

export interface BestSlot extends FinalSlot {
  free: number;
  total: number;
  freeIds: string[];
}

/**
 * Finds the window (default 3 h) with the most members free for the whole window.
 * Required members must be free in the chosen window (§9 Feature 5, point 4).
 */
export function bestSlot(plan: Plan, windowHours = 3): BestSlot | null {
  const memberIds = plan.members.map((m) => m.userId);
  const required = plan.members.filter((m) => m.isRequired).map((m) => m.userId);
  const sets = new Map(memberIds.map((id) => [id, new Set(plan.availability[id] ?? [])]));
  let best: BestSlot | null = null;
  for (let day = 0; day < DAYS; day++) {
    for (let i = 0; i + windowHours <= HOURS.length; i++) {
      const hours = HOURS.slice(i, i + windowHours);
      const freeIds = memberIds.filter((id) => hours.every((h) => sets.get(id)!.has(slotKey(day, h))));
      if (required.some((r) => !freeIds.includes(r))) continue;
      if (freeIds.length === 0) continue;
      if (!best || freeIds.length > best.free) {
        best = { day, startHour: hours[0], endHour: hours[hours.length - 1] + 1, free: freeIds.length, total: memberIds.length, freeIds };
      }
    }
  }
  return best;
}

export function slotLabel(plan: Plan, slot: FinalSlot): string {
  return `${dayLabel(plan, slot.day, "long")}, ${formatHour(slot.startHour)} – ${formatHour(slot.endHour)}`;
}

export function slotStart(plan: Plan, slot: FinalSlot): Date {
  const d = dayDate(plan, slot.day);
  d.setHours(slot.startHour, 0, 0, 0);
  return d;
}
