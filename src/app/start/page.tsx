"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon, CompassIcon, LinkIcon, PlusCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/format";
import { useDemo, useHydration } from "@/lib/store/demo-store";
import { validateName } from "@/lib/validation";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/primitives";
import { toast } from "@/components/ui/feedback";

type Goal = "explore" | "create" | "join";

function StartForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const hydrated = useHydration((s) => s.hydrated);
  const current = useDemo((s) => s.people["u-me"]?.name);
  const signedIn = useDemo((s) => s.session.signedIn);
  const signIn = useDemo((s) => s.signIn);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [goal, setGoal] = useState<Goal>(params.get("demo") ? "explore" : "explore");
  const error = touched ? validateName(name) : null;

  const options: { id: Goal; title: string; body: string; icon: typeof CompassIcon }[] = [
    { id: "explore", title: "Explore the demo plans", body: "Six ready-made plans in every stage.", icon: CompassIcon },
    { id: "create", title: "Create a new plan", body: "Set the minimum, seats and deadlines.", icon: PlusCircleIcon },
    { id: "join", title: "Join with a plan link", body: "Paste the link from your group chat.", icon: LinkIcon },
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const err = validateName(name);
    if (err) return;
    signIn(name);
    toast("success", `Welcome, ${name.trim()}!`, "You're in demo mode — data stays in this browser.");
    if (next && next.startsWith("/")) return router.push(next);
    router.push(goal === "create" ? "/create" : goal === "join" ? "/join" : "/dashboard");
  };

  return (
    <>
      <Kicker tone="mint">Demo sign-in · no password</Kicker>
      <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-[2.4rem]">What should your friends call you?</h1>
      <p className="mt-3 text-[15px] font-medium text-muted">Members join plans with just a name — exactly like opening a link from WhatsApp. No account is created.</p>

      {hydrated && signedIn && current && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-clay-sm">
          <p className="text-sm font-semibold">
            Continue as <span className="text-purple-deep">{current}</span>?
          </p>
          <Button size="sm" onClick={() => router.push(next && next.startsWith("/") ? next : "/dashboard")}>
            Continue <ArrowRightIcon size={16} weight="bold" />
          </Button>
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-7 space-y-6">
        <Field label="Your display name" error={error ?? undefined} hint="Shown to people in your plans.">
          {(id, describedBy) => <Input id={id} aria-describedby={describedBy} aria-invalid={!!error} autoComplete="nickname" autoFocus placeholder="e.g. Sanket" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} maxLength={30} />}
        </Field>
        {!next && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">What would you like to do?</legend>
            <div className="space-y-2">
              {options.map((o) => (
                <label key={o.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white p-3.5 transition", goal === o.id ? "border-ink shadow-pop" : "border-transparent shadow-clay-sm hover:-translate-y-0.5")}>
                  <input type="radio" name="goal" value={o.id} checked={goal === o.id} onChange={() => setGoal(o.id)} className="sr-only" />
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", goal === o.id ? "bg-sun" : "bg-canvas")}>
                    <o.icon size={20} weight="duotone" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{o.title}</span>
                    <span className="block text-xs font-medium text-muted">{o.body}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Button type="submit" variant="purple" size="lg" className="w-full">
          {next ? "Continue" : "Let's go"} <ArrowRightIcon size={20} weight="bold" />
        </Button>
        <p className="text-center text-xs font-medium text-muted">This is a prototype: there is no real account or authentication.</p>
      </form>
    </>
  );
}

export default function StartPage() {
  return (
    <AuthLayout>
      <Suspense>
        <StartForm />
      </Suspense>
    </AuthLayout>
  );
}
