/** Centralised, dependency-free form validation. Each validator returns an error message or null. */

export function validateName(name: string): string | null {
  const v = name.trim();
  if (!v) return "Please enter a name your friends will recognise.";
  if (v.length < 2) return "Use at least 2 characters.";
  if (v.length > 30) return "Keep it under 30 characters.";
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(v)) return "Use letters, spaces, dots or hyphens only.";
  return null;
}

export function parsePlanCode(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  const m = v.match(/\/(?:join|p)\/([a-z0-9-]+)/i);
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9-]{3,40}$/i.test(v)) return v.toLowerCase();
  return null;
}

export interface PlanFormValues {
  title: string;
  area: string;
  description: string;
  approxDate: string;
  groupSize: string;
  minMembers: string;
  maxSeats: string;
  totalCost: string;
  ideaDeadline: string;
  voteDeadline: string;
  paymentDeadline: string;
}

export type PlanFormErrors = Partial<Record<keyof PlanFormValues, string>>;

export function validatePlanForm(v: PlanFormValues, now = Date.now()): PlanFormErrors {
  const e: PlanFormErrors = {};
  const int = (s: string) => (s.trim() === "" ? NaN : Number(s));
  if (v.title.trim().length < 3) e.title = "Give the plan a name of at least 3 characters.";
  else if (v.title.trim().length > 48) e.title = "Keep the name under 48 characters.";
  if (!v.area.trim()) e.area = "Add an area so ideas stay nearby (e.g. Andheri).";
  if (!v.approxDate) e.approxDate = "Pick an approximate date.";
  else if (new Date(v.approxDate).getTime() < new Date(new Date(now).toDateString()).getTime()) e.approxDate = "The date can't be in the past.";

  const size = int(v.groupSize);
  const min = int(v.minMembers);
  const max = int(v.maxSeats);
  if (!Number.isInteger(size) || size < 2 || size > 50) e.groupSize = "Expected group size must be between 2 and 50.";
  if (!Number.isInteger(min) || min < 2) e.minMembers = "At least 2 members are needed to confirm.";
  else if (Number.isInteger(size) && min > size) e.minMembers = "The minimum can't be more than the expected group size.";
  if (!Number.isInteger(max) || max < 2 || max > 60) e.maxSeats = "Maximum seats must be between 2 and 60.";
  else if (Number.isInteger(min) && max < min) e.maxSeats = "Maximum seats must be at least the minimum.";

  if (v.totalCost.trim()) {
    const c = Number(v.totalCost);
    if (!Number.isFinite(c) || c < 0) e.totalCost = "Enter a valid amount in rupees.";
    else if (c > 500000) e.totalCost = "That's above the ₹5,00,000 demo limit.";
  }

  const t = (s: string) => (s ? new Date(s).getTime() : NaN);
  const idea = t(v.ideaDeadline);
  const vote = t(v.voteDeadline);
  const pay = t(v.paymentDeadline);
  if (!Number.isFinite(idea) || idea <= now) e.ideaDeadline = "The idea deadline must be in the future.";
  if (!Number.isFinite(vote) || vote <= now) e.voteDeadline = "The voting deadline must be in the future.";
  else if (Number.isFinite(idea) && vote < idea) e.voteDeadline = "Voting should close after ideas close.";
  if (!Number.isFinite(pay) || pay <= now) e.paymentDeadline = "The payment deadline must be in the future.";
  else if (Number.isFinite(vote) && pay < vote) e.paymentDeadline = "Payments should close after voting closes.";
  return e;
}

export function validateIdea(v: { title: string; place: string; cost: string; link: string }) {
  const e: Partial<Record<"title" | "place" | "cost" | "link", string>> = {};
  if (v.title.trim().length < 3) e.title = "Add a short title (3+ characters).";
  if (!v.place.trim()) e.place = "Where is it?";
  const c = Number(v.cost);
  if (v.cost.trim() === "" || !Number.isFinite(c) || c < 0) e.cost = "Enter the cost per person (0 if free).";
  else if (c > 100000) e.cost = "That seems too high for one person.";
  if (v.link.trim() && !/^https?:\/\/\S+\.\S+/i.test(v.link.trim())) e.link = "Links must start with http:// or https://";
  return e;
}
