"use client";

import type { ReactNode } from "react";
import { ChatsCircleIcon, LinkSimpleIcon, LockKeyIcon, MapPinIcon, MicrophoneIcon, ProhibitIcon, SparkleIcon, StorefrontIcon, TrophyIcon } from "@phosphor-icons/react";
import type { Idea, Person, Plan } from "@/types";
import { cn, formatINR } from "@/lib/format";
import { budgetLabel, fitsMyBudget } from "@/lib/calc/budget";
import { ME } from "@/lib/store/demo-store";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge } from "@/components/ui/Badge";

const SOURCE: Record<Idea["source"], { label: string; icon: typeof ChatsCircleIcon } | null> = {
  manual: null,
  chat: { label: "From chat", icon: ChatsCircleIcon },
  voice: { label: "From voice room", icon: MicrophoneIcon },
  ai: { label: "Suggested", icon: SparkleIcon },
  offer: { label: "Venue offer", icon: StorefrontIcon },
};

export function BudgetFitBadge({ plan, idea }: { plan: Plan; idea: Idea }) {
  const label = budgetLabel(plan, idea);
  if (label.kind === "locked") return <Badge kind="neutral">Budget check unlocks at 3 budgets</Badge>;
  if (label.kind === "fits") return <Badge kind="success" withDot>Within everyone&apos;s budget</Badge>;
  return (
    <Badge kind="warning" withDot>
      Above the budget of {label.count} member{label.count === 1 ? "" : "s"}
    </Badge>
  );
}

export function IdeaCard({ plan, idea, people, children, highlight, vetoed }: { plan: Plan; idea: Idea; people: Record<string, Person>; children?: ReactNode; highlight?: boolean; vetoed?: boolean }) {
  const src = SOURCE[idea.source];
  const proposer = people[idea.proposedBy];
  const mine = fitsMyBudget(plan, idea, ME);
  return (
    <article className={cn("relative flex h-full min-w-0 flex-col rounded-[28px] bg-white p-5 shadow-clay transition", highlight && "ring-2 ring-ink shadow-pop-lg", vetoed && "opacity-60")}>
      {highlight && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-[11px] font-bold shadow-pop">
          <TrophyIcon size={12} weight="fill" /> Winner
        </span>
      )}
      <div className="flex items-start gap-3">
        <ArtTile icon={idea.icon} tone={idea.tone} size={52} />
        <div className="min-w-0 flex-1">
          <h3 className={cn("font-sans text-base font-bold leading-snug tracking-normal", vetoed && "line-through")}>{idea.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted">
            <MapPinIcon size={12} weight="duotone" className="shrink-0" />
            <span className="truncate">{idea.place}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-display text-lg font-extrabold leading-none">{formatINR(idea.costPerPerson)}</p>
          <p className="mt-1 text-[11px] font-semibold text-muted">per person</p>
        </div>
      </div>
      {idea.note && <p className="mt-3 text-sm font-medium text-ink-soft">{idea.note}</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge kind="sky">{idea.timeNote}</Badge>
        {vetoed ? (
          <Badge kind="danger">
            <ProhibitIcon size={12} weight="bold" /> Vetoed — removed from vote
          </Badge>
        ) : (
          <BudgetFitBadge plan={plan} idea={idea} />
        )}
        {mine === false && (
          <Badge kind="pink">
            <LockKeyIcon size={11} weight="bold" /> Above your budget (only you see this)
          </Badge>
        )}
        {src && (
          <Badge kind="lavender">
            <src.icon size={12} weight="bold" /> {src.label}
          </Badge>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted">
          {proposer ? <Avatar person={proposer} size={24} /> : <ArtTile icon="sparkle" tone="sun" size={24} />}
          <span className="truncate">
            {idea.proposedBy === ME ? "You" : (proposer?.name ?? idea.proposedBy)}
            {idea.supporters?.length ? ` · ${idea.supporters.length} supported in chat` : ""}
          </span>
        </span>
        {idea.link && (
          <a href={idea.link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-purple-deep hover:underline">
            <LinkSimpleIcon size={14} weight="bold" /> Link
          </a>
        )}
      </div>
      {children && <div className="mt-4 border-t border-line pt-4">{children}</div>}
    </article>
  );
}
