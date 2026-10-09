"use client";

import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { CompassIcon, PaperPlaneRightIcon, XIcon } from "@phosphor-icons/react";
import { useDemo, ME } from "@/lib/store/demo-store";
import type { Person, Plan } from "@/types";
import { formatINR, plural } from "@/lib/format";
import { paymentSummary } from "@/lib/calc/payments";
import { planTransfers, isSettled } from "@/lib/calc/settle";
import { slotLabel, bestSlot } from "@/lib/calc/availability";
import { rankIdeas } from "@/lib/calc/voting";
import { STATUS_META, winnerOf, nextActionFor } from "@/features/plans/plan-meta";
import { DemoTag } from "@/components/ui/Badge";

interface Msg {
  from: "bot" | "me";
  text: string;
}

const PROMPTS = ["What is the plan?", "How much do I owe?", "Where do we meet?", "What should I do next?"];

/** Answers questions from the plan's own data with simple rules (no AI is called). */
function answer(q: string, plan: Plan | undefined, people: Record<string, Person>, plans: Plan[]): string {
  const t = q.toLowerCase();
  const name = (id: string) => (id === ME ? "you" : (people[id]?.name ?? "someone"));
  if (!plan) {
    const active = plans.filter((p) => !["completed", "not_confirmed"].includes(p.status));
    if (/next|todo|do/.test(t)) {
      const todo = active.map((p) => ({ p, a: nextActionFor(p) })).filter((x) => x.a);
      return todo.length ? todo.slice(0, 3).map((x) => `• ${x.p.title}: ${x.a!.title}`).join("\n") : "Nothing needs you right now. 🎉";
    }
    return `You have ${plural(active.length, "active plan")}: ${active.map((p) => `${p.title} (${STATUS_META[p.status].label})`).join(", ")}. Open a plan and ask me about it.`;
  }
  const winner = winnerOf(plan);
  if (/owe|pay|share|money|cost/.test(t)) {
    if (plan.status === "settling" || plan.status === "completed") {
      const mine = planTransfers(plan).filter((x) => x.from === ME && !isSettled(plan, x));
      const owedToMe = planTransfers(plan).filter((x) => x.to === ME && !isSettled(plan, x));
      if (!mine.length && !owedToMe.length) return "You're all settled on this plan. ✅";
      return [...mine.map((x) => `You owe ${name(x.to)} ${formatINR(x.amount)}.`), ...owedToMe.map((x) => `${name(x.from)} owes you ${formatINR(x.amount)}.`)].join("\n");
    }
    const s = paymentSummary(plan);
    if (s.total === 0) return "The cost isn't fixed yet — it depends on which idea wins the vote.";
    return `The share is ${formatINR(s.reached ? s.finalShare : s.heldShare)} per person (${formatINR(s.total)} total, ${s.paidCount} of ${s.min} required members paid).`;
  }
  if (/where|meet|place|location/.test(t)) return plan.finalPlace ? `We meet at ${plan.finalPlace}.` : winner ? `Likely at ${winner.place} — not final yet.` : `Somewhere around ${plan.area}. The vote decides the place.`;
  if (/when|time|date/.test(t)) {
    if (plan.finalSlot) return `It's on ${slotLabel(plan, plan.finalSlot)}.`;
    const b = bestSlot(plan);
    return b ? `The best slot so far is ${slotLabel(plan, b)} — ${b.free} of ${b.total} members are free.` : "Not enough people have marked their free hours yet.";
  }
  if (/next|todo|do/.test(t)) {
    const a = nextActionFor(plan);
    return a ? `${a.title}: ${a.body}` : "Nothing to do right now.";
  }
  if (/who|going|members/.test(t)) {
    const paid = plan.payments.filter((p) => p.status !== "released" && p.status !== "failed").map((p) => name(p.userId));
    return paid.length ? `Paid so far: ${paid.join(", ")}.` : `${plan.members.length} members have joined. Nobody has paid yet.`;
  }
  // default: "what is the plan"
  if (winner) return `${plan.title}: ${winner.title} at ${winner.place}. Status: ${STATUS_META[plan.status].label}.`;
  const lead = rankIdeas(plan)[0];
  const leadIdea = plan.ideas.find((i) => i.id === lead?.ideaId);
  return `${plan.title} is still being decided. ${plural(plan.ideas.length, "idea")} so far${leadIdea && plan.submittedVotes.includes(ME) ? `, ${leadIdea.title} is leading` : ""}. Voting closes soon.`;
}

export function AssistantWidget() {
  const params = useParams<{ planId?: string }>();
  const plan = useDemo((s) => (params.planId ? s.plans[params.planId] : undefined));
  const people = useDemo((s) => s.people);
  const allPlans = useDemo((s) => s.plans);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const ask = (q: string) => {
    if (!q.trim()) return;
    const reply = answer(q, plan, people, Object.values(allPlans));
    setMsgs((m) => [...m, { from: "me", text: q }, { from: "bot", text: reply }]);
    setInput("");
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 30);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="group fixed bottom-24 right-4 z-50 grid h-14 w-14 place-items-center rounded-full border-2 border-ink bg-sun text-ink shadow-pop transition hover:-translate-y-1 hover:shadow-pop-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none md:bottom-6 md:right-6"
        aria-label={open ? "Close plan assistant" : "Ask about this plan"}
        aria-expanded={open}
      >
        {open ? <XIcon size={24} weight="bold" /> : <CompassIcon size={26} weight="duotone" className="transition-transform duration-300 group-hover:rotate-45" />}
        {!open && <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-ink bg-mint" aria-hidden />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed bottom-40 right-4 z-50 flex h-[520px] max-h-[calc(100dvh-12rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[32px] border-2 border-ink bg-canvas shadow-[8px_8px_0_#1c1b2b] sm:w-[400px] md:bottom-24 md:right-6"
            role="dialog"
            aria-label="Plan question box"
          >
            <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-white px-4 py-3">
              <div>
                <p className="font-display text-sm font-bold">Ask the plan</p>
                <p className="text-xs font-medium text-muted">{plan ? plan.title : "All your plans"}</p>
              </div>
              <DemoTag>Rule-based · no AI</DemoTag>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="max-w-[85%] rounded-[24px] rounded-tl-sm border-2 border-ink bg-white p-3.5 text-sm font-medium shadow-pop">Hi! I answer from this plan&apos;s data — try a question below.</div>
              {msgs.map((m, i) => (
                <div key={i} className={m.from === "me" ? "ml-auto max-w-[85%] whitespace-pre-line rounded-[24px] rounded-tr-sm border-2 border-ink bg-ink p-3.5 text-sm font-semibold text-white shadow-pop" : "max-w-[85%] whitespace-pre-line rounded-[24px] rounded-tl-sm border-2 border-ink bg-white p-3.5 text-sm font-medium shadow-pop"}>
                  {m.text}
                </div>
              ))}
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2">
              {PROMPTS.map((p) => (
                <button key={p} onClick={() => ask(p)} className="shrink-0 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold shadow-[2px_2px_0_#1c1b2b] transition hover:bg-sun hover:shadow-pop">
                  {p}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2 border-t-2 border-ink bg-white p-3"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="How much do I owe?" className="h-11 flex-1 rounded-full bg-canvas px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple" aria-label="Your question" maxLength={140} />
              <button type="submit" className="grid h-11 w-11 place-items-center rounded-full bg-pill text-white" aria-label="Send">
                <PaperPlaneRightIcon size={18} weight="fill" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
