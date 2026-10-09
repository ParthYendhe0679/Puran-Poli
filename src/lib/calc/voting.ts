import type { Idea, Plan } from "@/types";
import { budgetFitRatio } from "./budget";

/**
 * Fair Voting score — project document §13.2:
 *   points      = (Love it × 2) + (Okay × 1)   (priority voters' Love it counts × 1.5)
 *   budget_fit  = members whose budget fits / members who entered a budget
 *   final_score = points × (0.5 + 0.5 × budget_fit)
 *   vetoed idea = removed from the vote
 *   tie         = top two within 5% → tie-breaker
 */
export interface IdeaScore {
  ideaId: string;
  love: number;
  okay: number;
  no: number;
  voters: number;
  points: number;
  budgetFit: number;
  finalScore: number;
  vetoed: boolean;
  vetoCount: number;
}

export function scoreIdeas(plan: Plan): IdeaScore[] {
  const vetoCounts = new Map<string, number>();
  Object.values(plan.vetoes).forEach((ideaId) => vetoCounts.set(ideaId, (vetoCounts.get(ideaId) ?? 0) + 1));

  return plan.ideas.map((idea) => {
    let love = 0;
    let okay = 0;
    let no = 0;
    let points = 0;
    for (const [userId, ballot] of Object.entries(plan.votes)) {
      const v = ballot[idea.id];
      if (v === undefined) continue;
      if (v === 2) {
        love++;
        points += plan.priorityVoters.includes(userId) ? 3 : 2;
      } else if (v === 1) {
        okay++;
        points += 1;
      } else no++;
    }
    const fit = budgetFitRatio(plan, idea);
    const vetoCount = vetoCounts.get(idea.id) ?? 0;
    const finalScore = vetoCount > 0 ? 0 : round2(points * (0.5 + 0.5 * fit));
    return { ideaId: idea.id, love, okay, no, voters: love + okay + no, points, budgetFit: fit, finalScore, vetoed: vetoCount > 0, vetoCount };
  });
}

export interface WinnerResult {
  winner: Idea | null;
  runnerUp: Idea | null;
  tie: boolean;
  method: "score" | "rule" | "random";
  reason: string;
  ranking: IdeaScore[];
}

export function rankIdeas(plan: Plan): IdeaScore[] {
  return scoreIdeas(plan)
    .filter((s) => !s.vetoed)
    .sort((a, b) => b.finalScore - a.finalScore || b.budgetFit - a.budgetFit || a.no - b.no);
}

export function pickWinner(plan: Plan, mode: "rule" | "random" = "rule", seed = 7): WinnerResult {
  const ranking = rankIdeas(plan);
  const byId = (id?: string) => plan.ideas.find((i) => i.id === id) ?? null;
  if (ranking.length === 0) {
    return { winner: null, runnerUp: null, tie: false, method: "score", reason: "No ideas are left in the vote.", ranking };
  }
  const [a, b] = ranking;
  const ideaA = byId(a.ideaId)!;
  if (!b) {
    return { winner: ideaA, runnerUp: null, tie: false, method: "score", reason: `${ideaA.title} is the only idea left in the vote.`, ranking };
  }
  const ideaB = byId(b.ideaId)!;
  const tie = a.finalScore > 0 && (a.finalScore - b.finalScore) / a.finalScore <= 0.05;
  if (!tie) {
    return {
      winner: ideaA,
      runnerUp: ideaB,
      tie: false,
      method: "score",
      reason: `${ideaA.title} has the highest score (${a.finalScore} vs ${b.finalScore} for ${ideaB.title}).`,
      ranking,
    };
  }
  if (mode === "random") {
    const pick = seededRandom(seed + a.finalScore * 100 + b.finalScore) < 0.5 ? [ideaA, ideaB] : [ideaB, ideaA];
    return {
      winner: pick[0],
      runnerUp: pick[1],
      tie: true,
      method: "random",
      reason: `The top two ideas were within 5%. The group chose a random pick, and it selected ${pick[0].title}.`,
      ranking,
    };
  }
  // Transparent, deterministic tie-breaker: budget fit → fewer "No" votes → lower cost.
  const order = [
    { s: a, i: ideaA },
    { s: b, i: ideaB },
  ].sort((x, y) => y.s.budgetFit - x.s.budgetFit || x.s.no - y.s.no || x.i.costPerPerson - y.i.costPerPerson);
  const w = order[0];
  const l = order[1];
  let why: string;
  if (w.s.budgetFit !== l.s.budgetFit) why = w.s.budgetFit === 1 ? "it is within everyone's budget" : "it fits more members' budgets";
  else if (w.s.no !== l.s.no) why = `it has fewer "No" votes (${w.s.no} vs ${l.s.no})`;
  else why = `it costs less per person (₹${w.i.costPerPerson} vs ₹${l.i.costPerPerson})`;
  return {
    winner: w.i,
    runnerUp: l.i,
    tie: true,
    method: "rule",
    reason: `${w.i.title} and ${l.i.title} were within 5% of each other. ${w.i.title} is selected because ${why}.`,
    ranking,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
