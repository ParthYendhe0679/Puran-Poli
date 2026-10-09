"use client";

import { useState } from "react";
import { EyeSlashIcon, LockKeyIcon, ShieldCheckIcon, TrashIcon } from "@phosphor-icons/react";
import { formatINR } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { budgetCount, groupComfortRange, MIN_BUDGETS_FOR_AGGREGATES } from "@/lib/calc/budget";
import { usePlanId } from "@/features/plans/PlanShell";
import { BudgetFitBadge } from "@/features/ideas/IdeaCard";
import { ArtTile } from "@/components/ui/Art";
import { Badge, Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip, Input, Slider } from "@/components/ui/primitives";
import { toast } from "@/components/ui/feedback";

const CONDITIONS = ["Vegetarian food only", "No alcohol", "Home by 10 pm", "Within 45 min of home", "No early mornings", "Wheelchair accessible", "Jain food", "No long drives"];

export default function BudgetPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const saveBudget = useDemo((s) => s.saveBudget);
  const saved = plan?.budgets[ME];
  const [max, setMax] = useState(saved?.max ?? 800);
  const [conditions, setConditions] = useState<string[]>(saved?.conditions ?? []);
  const [editing, setEditing] = useState(!saved);
  if (!plan) return null;
  const range = groupComfortRange(plan);
  const count = budgetCount(plan);

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <div>
          <Kicker tone="pink">Private budget</Kicker>
          <h2 className="mt-3 text-2xl font-extrabold">What can you comfortably spend?</h2>
          <p className="mt-1 text-sm font-medium text-muted">Only you can see this. The group only sees whether an idea fits everyone.</p>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
          {editing ? (
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted">Maximum per person</p>
                  <p className="tabular font-display text-4xl font-extrabold text-purple-deep">{formatINR(max)}</p>
                </div>
                <label className="w-32">
                  <span className="sr-only">Exact amount</span>
                  <Input type="number" inputMode="numeric" min={100} max={10000} step={50} value={max} onChange={(e) => setMax(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))} className="text-right" />
                </label>
              </div>
              <div className="mt-5">
                <Slider value={max} onValueChange={setMax} min={100} max={5000} step={50} label="Maximum spend per person" />
                <div className="mt-1 flex justify-between text-[11px] font-semibold text-muted">
                  <span>₹100</span>
                  <span>₹5,000</span>
                </div>
              </div>
              <div className="mt-7">
                <p className="mb-2 text-sm font-semibold">My conditions</p>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <Chip key={c} tone="pink" size="sm" selected={conditions.includes(c)} onClick={() => setConditions((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]))}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                <Button
                  variant="purple"
                  disabled={max < 100}
                  onClick={() => {
                    saveBudget(plan.id, { max, conditions });
                    setEditing(false);
                    toast("success", "Budget saved privately", "Idea labels have been updated.");
                  }}
                >
                  <LockKeyIcon size={18} weight="bold" /> Save privately
                </Button>
                {saved && (
                  <Button variant="secondary" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
                  <EyeSlashIcon size={16} weight="bold" /> Only visible to you
                </p>
                <p className="tabular mt-1 font-display text-3xl font-extrabold">{formatINR(saved!.max)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {saved!.conditions.length ? saved!.conditions.map((c) => <Badge key={c} kind="pink">{c}</Badge>) : <span className="text-xs font-medium text-muted">No conditions</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    saveBudget(plan.id, null);
                    setEditing(true);
                    toast("info", "Budget removed");
                  }}
                  aria-label="Remove my budget"
                >
                  <TrashIcon size={18} weight="bold" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold">What the group sees</h3>
          <ul className="space-y-2">
            {plan.ideas.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-clay-sm">
                <ArtTile icon={i.icon} tone={i.tone} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{i.title}</span>
                  <span className="text-xs font-medium text-muted">{formatINR(i.costPerPerson)} per person</span>
                </span>
                <BudgetFitBadge plan={plan} idea={i} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-mint-soft p-5">
          <ShieldCheckIcon size={28} weight="duotone" className="text-mint-deep" />
          <h3 className="mt-2 text-base font-bold">How your budget stays private</h3>
          <ul className="mt-3 space-y-2 text-sm font-medium text-ink-soft">
            <li>• Not even the organiser can see your amount.</li>
            <li>• Ideas only show “within everyone&apos;s budget” or “above the budget of N members” — never names.</li>
            <li>• Labels and the group range appear only once {MIN_BUDGETS_FOR_AGGREGATES}+ members set a budget, so nobody can be identified.</li>
            <li>• In this prototype it is stored only in your browser.</li>
          </ul>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <p className="text-sm font-semibold text-muted">{count} member{count === 1 ? "" : "s"} set a budget</p>
          <p className="mt-1 font-display text-lg font-bold">{range ? `Group comfort: ${formatINR(range.low)} – ${formatINR(range.high)}` : `Range unlocks at ${MIN_BUDGETS_FOR_AGGREGATES} budgets`}</p>
          <p className="mt-1 text-xs font-medium text-muted">Rounded to ₹100 so no single budget can be worked out.</p>
        </div>
      </aside>
    </div>
  );
}
