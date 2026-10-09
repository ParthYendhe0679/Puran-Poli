"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EyeSlashIcon, HeartIcon, ProhibitIcon, QuestionIcon, ScalesIcon, ThumbsDownIcon, ThumbsUpIcon, TrophyIcon } from "@phosphor-icons/react";
import type { VoteValue } from "@/types";
import { cn, formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { pickWinner, scoreIdeas } from "@/lib/calc/voting";
import { usePlanId } from "@/features/plans/PlanShell";
import { isOrganiser, winnerOf } from "@/features/plans/plan-meta";
import { IdeaCard } from "@/features/ideas/IdeaCard";
import { ArtTile } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Countdown, EmptyState, toast } from "@/components/ui/feedback";

const OPTIONS: { v: VoteValue; label: string; icon: typeof HeartIcon; on: string }[] = [
  { v: 2, label: "Love it", icon: HeartIcon, on: "bg-pink border-ink shadow-pop" },
  { v: 1, label: "Okay", icon: ThumbsUpIcon, on: "bg-sky border-ink shadow-pop" },
  { v: 0, label: "No", icon: ThumbsDownIcon, on: "bg-cream border-ink shadow-pop" },
];

export default function VotePage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const castVote = useDemo((s) => s.castVote);
  const submitVotes = useDemo((s) => s.submitVotes);
  const setVeto = useDemo((s) => s.setVeto);
  const closeVoting = useDemo((s) => s.closeVoting);
  const [whyOpen, setWhyOpen] = useState(false);
  const [vetoTarget, setVetoTarget] = useState<string | null>(null);
  const [mode, setMode] = useState<"rule" | "random">("rule");

  const scores = useMemo(() => (plan ? scoreIdeas(plan) : []), [plan]);
  const result = useMemo(() => (plan ? pickWinner(plan, mode) : null), [plan, mode]);
  if (!plan || !result) return null;

  const open = plan.status === "voting";
  const myBallot = plan.votes[ME] ?? {};
  const myVeto = plan.vetoes[ME];
  const submitted = plan.submittedVotes.includes(ME);
  const activeIdeas = plan.ideas.filter((i) => !Object.values(plan.vetoes).includes(i.id));
  const allVoted = activeIdeas.every((i) => myBallot[i.id] !== undefined);
  const showResults = submitted || !open;
  const maxScore = Math.max(1, ...scores.map((s) => s.finalScore));
  const winner = winnerOf(plan);

  if (plan.ideas.length === 0) {
    return <EmptyState title="Nothing to vote on yet" body="Add at least two ideas first." action={<ButtonLink href={`/p/${plan.id}?add=1`} variant="purple">Add an idea</ButtonLink>} />;
  }

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Kicker tone="lavender">Fair voting</Kicker>
            <h2 className="mt-3 text-2xl font-extrabold">{open ? "How do you feel about each idea?" : "Voting is closed"}</h2>
            <p className="mt-1 text-sm font-medium text-muted">Love it = 2 points · Okay = 1 · No = 0. You get one veto per plan.</p>
          </div>
          {open && <Countdown to={plan.voteDeadline} prefix="Closes in" />}
        </div>
        {plan.priorityVoters.length > 0 && (
          <div className="flex items-start gap-3 rounded-[24px] bg-lavender-soft p-4 text-sm font-medium text-purple-deep">
            <ScalesIcon size={22} weight="duotone" className="shrink-0" />
            <p>
              <b>Turn-based fairness:</b> {plan.priorityVoters.map((id) => people[id]?.name).join(", ")}&apos;s first choice was not selected in the last two plans, so their “Love it” counts 1.5× this time.
            </p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {plan.ideas.map((idea) => {
            const vetoedByAnyone = Object.values(plan.vetoes).includes(idea.id);
            const mine = myBallot[idea.id];
            return (
              <IdeaCard key={idea.id} plan={plan} idea={idea} people={people} vetoed={vetoedByAnyone} highlight={!open && winner?.id === idea.id}>
                {vetoedByAnyone && myVeto !== idea.id ? (
                  <p className="text-xs font-semibold text-muted">A member used their veto. This idea is out of the vote.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={`Your vote for ${idea.title}`}>
                      {OPTIONS.map((o) => (
                        <button
                          key={o.v}
                          role="radio"
                          aria-checked={mine === o.v}
                          disabled={!open || myVeto === idea.id}
                          onClick={() => castVote(plan.id, idea.id, o.v)}
                          className={cn("flex h-12 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-[12px] font-bold transition active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50", mine === o.v ? o.on : "border-transparent bg-canvas text-ink-soft hover:bg-white hover:shadow-clay-sm")}
                        >
                          <o.icon size={18} weight={mine === o.v ? "fill" : "bold"} />
                          {o.label}
                        </button>
                      ))}
                    </div>
                    {open && (
                      <button
                        onClick={() => (myVeto === idea.id ? setVeto(plan.id, null) : setVetoTarget(idea.id))}
                        disabled={!!myVeto && myVeto !== idea.id}
                        className={cn("mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-xs font-bold transition disabled:opacity-40", myVeto === idea.id ? "bg-danger text-white" : "text-danger hover:bg-danger-soft")}
                      >
                        <ProhibitIcon size={14} weight="bold" />
                        {myVeto === idea.id ? "Your veto — tap to undo" : myVeto ? "Veto already used" : "I won't join if this is chosen"}
                      </button>
                    )}
                  </>
                )}
              </IdeaCard>
            );
          })}
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        {open && (
          <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
            <p className="text-sm font-bold">
              {Object.keys(myBallot).filter((k) => activeIdeas.some((i) => i.id === k)).length} of {activeIdeas.length} ideas voted
            </p>
            <Button
              variant="purple"
              size="lg"
              className="mt-3 w-full"
              disabled={!allVoted}
              onClick={() => {
                submitVotes(plan.id);
                toast("success", submitted ? "Votes updated" : "Votes submitted", submitted ? undefined : "Results are now visible to you.");
              }}
            >
              {submitted ? "Update my votes" : "Submit my votes"}
            </Button>
            {!allVoted && <p className="mt-2 text-xs font-medium text-muted">Vote on every idea to submit.</p>}
          </div>
        )}

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-bold">Results</h3>
            <Badge kind="neutral">{plan.submittedVotes.length}/{plan.members.length} voted</Badge>
          </div>
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl bg-canvas p-5 text-center">
                <EyeSlashIcon size={32} weight="duotone" className="mx-auto text-purple" />
                <p className="mt-2 text-sm font-bold">Hidden until you vote</p>
                <p className="mt-1 text-xs font-medium text-muted">So early votes can&apos;t influence you (the anchoring effect).</p>
              </motion.div>
            ) : (
              <motion.ul key="shown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {result.ranking.map((s, idx) => {
                  const idea = plan.ideas.find((i) => i.id === s.ideaId)!;
                  return (
                    <li key={s.ideaId}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2 font-semibold">
                          {idx === 0 && <TrophyIcon size={16} weight="fill" className="shrink-0 text-star" />}
                          <span className="truncate">{idea.title}</span>
                        </span>
                        <span className="tabular shrink-0 font-display text-sm font-extrabold">{s.finalScore}</span>
                      </div>
                      <div className="mt-1.5 h-2.5 rounded-full bg-ink/10">
                        <motion.div className={cn("h-full rounded-full", idx === 0 ? "bg-purple" : "bg-lavender")} initial={{ width: 0 }} animate={{ width: `${(s.finalScore / maxScore) * 100}%` }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-muted">
                        ❤ {s.love} · 👍 {s.okay} · ✕ {s.no} · budget fit {Math.round(s.budgetFit * 100)}%
                      </p>
                    </li>
                  );
                })}
                {scores.filter((s) => s.vetoed).map((s) => (
                  <li key={s.ideaId} className="text-xs font-semibold text-danger">
                    {plan.ideas.find((i) => i.id === s.ideaId)?.title} — vetoed
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {showResults && (
            <>
              <div className="mt-4 rounded-2xl bg-sun-soft p-3 text-[13px] font-medium text-ink-soft">
                {result.tie && <Badge kind="sun" className="mb-1.5">Tie-breaker</Badge>}
                <p>{open ? `If voting closed now: ${result.reason}` : (plan.winnerReason ?? result.reason)}</p>
              </div>
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setWhyOpen(true)}>
                <QuestionIcon size={16} weight="bold" /> Why does this idea win?
              </Button>
            </>
          )}
        </div>

        {open && isOrganiser(plan) && (
          <div className="rounded-[24px] border-2 border-dashed border-ink/20 bg-white/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Organiser controls</p>
              <DemoTag>Demo</DemoTag>
            </div>
            <p className="mt-1 text-xs font-medium text-muted">Voting closes automatically at the deadline. For the demo you can close it now.</p>
            <div className="mt-3 flex gap-2 text-xs font-semibold">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="tb" checked={mode === "rule"} onChange={() => setMode("rule")} /> Rule-based tie-breaker
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="tb" checked={mode === "random"} onChange={() => setMode("random")} /> Random pick
              </label>
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => {
                closeVoting(plan.id, mode);
                toast("success", "Voting closed", "The winner moves to advance payment.");
              }}
            >
              Close voting & pick winner
            </Button>
          </div>
        )}
        {!open && winner && (
          <ButtonLink href={`/p/${plan.id}/pay`} variant="purple" size="lg" className="w-full">
            Go to advance payment
          </ButtonLink>
        )}
      </aside>

      <Sheet open={whyOpen} onOpenChange={setWhyOpen} title="How the winner is calculated" description="The same formula runs for every idea. Our code makes the decision — no AI." wide>
        <div className="rounded-2xl bg-white p-4 font-mono text-xs leading-relaxed shadow-clay-sm">
          points = Love it × 2 + Okay × 1 (priority Love it × 3)
          <br />
          budget_fit = members whose budget fits ÷ members with a budget
          <br />
          final = points × (0.5 + 0.5 × budget_fit)
          <br />
          tie = top two within 5% → budget fit, then fewer No votes, then lower cost
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-clay-sm">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-canvas text-left text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2">Idea</th>
                <th className="px-3 py-2">Points</th>
                <th className="px-3 py-2">Budget fit</th>
                <th className="px-3 py-2">Final</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => {
                const idea = plan.ideas.find((i) => i.id === s.ideaId)!;
                return (
                  <tr key={s.ideaId} className="border-t border-line">
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 font-semibold">
                        <ArtTile icon={idea.icon} tone={idea.tone} size={26} /> {idea.title}
                      </span>
                      <span className="text-[11px] text-muted">{formatINR(idea.costPerPerson)}/person</span>
                    </td>
                    <td className="tabular px-3 py-2.5">{s.vetoed ? "—" : s.points}</td>
                    <td className="tabular px-3 py-2.5">{s.vetoed ? "—" : `${Math.round(s.budgetFit * 100)}%`}</td>
                    <td className="tabular px-3 py-2.5 font-bold">{s.vetoed ? "Vetoed" : s.finalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm font-medium text-muted">{result.reason}</p>
      </Sheet>

      <Sheet
        open={!!vetoTarget}
        onOpenChange={(o) => !o && setVetoTarget(null)}
        title="Use your one veto?"
        description="This removes the idea from the vote for everyone. You only get one veto per plan, so keep it for serious reasons."
        footer={
          <>
            <Button variant="secondary" onClick={() => setVetoTarget(null)}>
              Keep my veto
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (vetoTarget) setVeto(plan.id, vetoTarget);
                setVetoTarget(null);
                toast("warning", "Veto used", "The idea is removed. Your name is not shown to the group.");
              }}
            >
              <ProhibitIcon size={18} weight="bold" /> Veto this idea
            </Button>
          </>
        }
      >
        <p className="rounded-2xl bg-white p-4 text-sm font-semibold shadow-clay-sm">{plan.ideas.find((i) => i.id === vetoTarget)?.title}</p>
      </Sheet>
    </div>
  );
}
