"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { useDemo, useHydration, ME } from "@/lib/store/demo-store";
import { validateName } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { STATUS_META } from "@/features/plans/plan-meta";
import { ArtTile, AvatarStack } from "@/components/ui/Art";
import { Badge, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Chip, Field, Input } from "@/components/ui/primitives";
import { ErrorState, Skeleton, toast } from "@/components/ui/feedback";

// "5 optional interest questions" (screen 3) — used for suggested ideas later.
const QUESTIONS: { q: string; options: string[] }[] = [
  { q: "Your kind of outing?", options: ["Active & sporty", "Chill & cosy", "Food first", "Adventure"] },
  { q: "Best time for you?", options: ["Weekday evenings", "Weekend days", "Weekend nights"] },
  { q: "How far will you travel?", options: ["< 30 min", "< 1 hour", "Day trips OK"] },
  { q: "Food preference?", options: ["Veg", "Non-veg", "Jain", "Anything"] },
  { q: "Group size you enjoy?", options: ["Small (4–6)", "Medium (7–10)", "The more the merrier"] },
];

export default function JoinPlanPage() {
  const { planId } = useParams<{ planId: string }>();
  const router = useRouter();
  const hydrated = useHydration((s) => s.hydrated);
  const plan = useDemo((s) => s.plans[planId]);
  const people = useDemo((s) => s.people);
  const session = useDemo((s) => s.session);
  const signIn = useDemo((s) => s.signIn);
  const joinPlan = useDemo((s) => s.joinPlan);
  const updateProfile = useDemo((s) => s.updateProfile);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  if (!hydrated) {
    return (
      <AuthLayout>
        <Skeleton className="h-64 rounded-[28px]" />
      </AuthLayout>
    );
  }
  if (!plan) {
    return (
      <AuthLayout>
        <ErrorState title="This plan link doesn't work" body="The plan may have been removed or the demo data was reset." action={<ButtonLink href="/join">Try another link</ButtonLink>} />
      </AuthLayout>
    );
  }

  const already = plan.members.some((m) => m.userId === ME) && session.signedIn;
  const organiser = people[plan.organiserId];
  const nameValue = session.signedIn ? people[ME].name : name;
  const error = touched && !session.signedIn ? validateName(name) : null;
  const closed = plan.status === "completed" || plan.status === "not_confirmed";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!session.signedIn) {
      if (validateName(name)) return;
      signIn(name);
    }
    joinPlan(plan.id, answers);
    if (answers.length) updateProfile({ interests: answers });
    toast("success", `You joined ${plan.title}`, "Vote, mark your free hours and set a private budget.");
    router.push(`/p/${plan.id}`);
  };

  return (
    <AuthLayout>
      <Kicker tone="sun">You&apos;re invited</Kicker>
      <div className="mt-5 rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
        <div className="flex items-center gap-3">
          <ArtTile icon={plan.icon} tone={plan.tone} size={52} />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{plan.title}</h1>
            <p className="text-sm font-medium text-muted">
              by {organiser?.name ?? "the organiser"} · {plan.area} · ~{formatDate(plan.approxDate)}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <AvatarStack people={plan.members.map((m) => people[m.userId])} max={6} size={28} />
          <Badge kind={STATUS_META[plan.status].kind} withDot>
            {STATUS_META[plan.status].label}
          </Badge>
        </div>
        {plan.description && <p className="mt-3 text-sm font-medium text-ink-soft">{plan.description}</p>}
      </div>

      {already ? (
        <div className="mt-6 space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-success">
            <CheckCircleIcon size={20} weight="fill" /> You&apos;re already in this plan.
          </p>
          <ButtonLink href={`/p/${plan.id}`} variant="purple" size="lg" className="w-full">
            Open plan <ArrowRightIcon size={20} weight="bold" />
          </ButtonLink>
        </div>
      ) : closed ? (
        <div className="mt-6">
          <ErrorState title="This plan is closed" body="It is no longer accepting new members." action={<ButtonLink href="/dashboard">Go to dashboard</ButtonLink>} />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-6">
          <Field label="Your name" error={error ?? undefined} hint={session.signedIn ? "From your demo profile." : "No password needed."}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!error} value={nameValue} disabled={session.signedIn} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="e.g. Sanket" maxLength={30} autoFocus={!session.signedIn} />}
          </Field>
          <details className="rounded-2xl bg-white p-4 shadow-clay-sm">
            <summary className="cursor-pointer text-sm font-bold">5 quick questions (optional) — helps suggest ideas</summary>
            <div className="mt-4 space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.q}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-muted">{q.q}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <Chip key={o} size="sm" selected={answers.includes(o)} onClick={() => setAnswers((a) => (a.includes(o) ? a.filter((x) => x !== o) : [...a, o]))}>
                        {o}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
          <Button type="submit" variant="purple" size="lg" className="w-full">
            Join plan <ArrowRightIcon size={20} weight="bold" />
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
