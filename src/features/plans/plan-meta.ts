import type { MemberStatus, Plan, PlanStatus } from "@/types";
import { ME } from "@/lib/mock-data/seed";

export const STATUS_META: Record<PlanStatus, { label: string; kind: "purple" | "sun" | "success" | "danger" | "sky" | "coral" | "neutral" }> = {
  voting: { label: "Deciding", kind: "purple" },
  collecting: { label: "Collecting payments", kind: "sun" },
  confirmed: { label: "Confirmed", kind: "success" },
  not_confirmed: { label: "Not confirmed", kind: "danger" },
  event_day: { label: "Event day", kind: "coral" },
  settling: { label: "Splitting the bill", kind: "sky" },
  completed: { label: "Completed", kind: "neutral" },
};

export const MEMBER_STATUS: Record<MemberStatus, { label: string; kind: "neutral" | "sun" | "success" }> = {
  interested: { label: "Interested", kind: "neutral" },
  joining: { label: "Joining", kind: "sun" },
  paid: { label: "Paid", kind: "success" },
};

export const STEPS = ["Propose", "Decide", "Pay", "Confirm", "Event day", "Split", "Summary"] as const;

export function currentStep(plan: Plan): number {
  switch (plan.status) {
    case "voting":
      return plan.ideas.length < 2 ? 0 : 1;
    case "collecting":
    case "not_confirmed":
      return 2;
    case "confirmed":
      return 3;
    case "event_day":
      return 4;
    case "settling":
      return 5;
    case "completed":
      return 6;
  }
}

export const isMember = (plan: Plan, userId = ME) => plan.members.some((m) => m.userId === userId);
export const isOrganiser = (plan: Plan, userId = ME) => plan.organiserId === userId;
export const winnerOf = (plan: Plan) => plan.ideas.find((i) => i.id === plan.winnerIdeaId) ?? null;
export const myPayment = (plan: Plan) => plan.payments.find((p) => p.userId === ME);
export const hasPaid = (plan: Plan, userId = ME) => plan.payments.some((p) => p.userId === userId && (p.status === "held" || p.status === "captured"));

export interface NextAction {
  title: string;
  body: string;
  href: string;
  cta: string;
}

/** "Each screen clearly shows what the member needs to do next" (§23.3). */
export function nextActionFor(plan: Plan): NextAction | null {
  const base = `/p/${plan.id}`;
  if (!isMember(plan)) return { title: "Join this plan", body: "Add your name to vote and see the plan.", href: `/join/${plan.id}`, cta: "Join plan" };
  switch (plan.status) {
    case "voting": {
      if (plan.ideas.length < 2) return { title: "Add ideas", body: "A vote needs at least two ideas. Add one or import your WhatsApp chat.", href: `${base}?add=1`, cta: "Add an idea" };
      if (!plan.submittedVotes.includes(ME)) return { title: "Vote on the ideas", body: "Results stay hidden until you vote, so nobody is influenced.", href: `${base}/vote`, cta: "Vote now" };
      if (!(plan.availability[ME]?.length > 0)) return { title: "Mark when you're free", body: "Tap the hours you can make it. The best slot updates live.", href: `${base}/when`, cta: "Pick times" };
      if (!plan.budgets[ME]) return { title: "Set a private budget", body: "Nobody sees your number — the group only sees which ideas fit.", href: `${base}/budget`, cta: "Set budget" };
      return { title: "You're all set", body: "Waiting for the voting deadline. You can still change your votes.", href: `${base}/vote`, cta: "See results" };
    }
    case "collecting":
      if (!hasPaid(plan)) return { title: "Pay your share to join", body: "The payment is held, not charged, until enough members pay.", href: `${base}/pay`, cta: "Join and pay" };
      return { title: "Waiting for others to pay", body: "The plan confirms automatically when the minimum is reached.", href: `${base}/pay`, cta: "See progress" };
    case "confirmed":
      return { title: "Plan confirmed 🎉", body: "Add it to your calendar and share the final plan.", href: `${base}/final`, cta: "Open final plan" };
    case "not_confirmed":
      return { title: "Plan not confirmed", body: "Not enough members paid in time. All held payments were released.", href: `${base}/pay`, cta: "See what happened" };
    case "event_day":
      return { title: "It's event day!", body: "Check the schedule and let everyone know when you'll arrive.", href: `${base}/event`, cta: "Open event day" };
    case "settling":
      return { title: "Split the bill", body: "Pick the items you had, then settle up with UPI.", href: `${base}/bill`, cta: "Select my items" };
    case "completed":
      return { title: "All done", body: "Relive the plan with the event summary.", href: `${base}/summary`, cta: "View summary" };
  }
}
