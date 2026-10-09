"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useDemo, useHydration } from "@/lib/store/demo-store";
import { parsePlanCode } from "@/lib/validation";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/primitives";
import { ArtTile } from "@/components/ui/Art";

export default function JoinCodePage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const hydrated = useHydration((s) => s.hydrated);
  const plans = useDemo((s) => s.plans);
  const open = Object.values(plans).filter((p) => p.status === "voting" || p.status === "collecting");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parsePlanCode(value);
    if (!id) return setError("Paste the full plan link (…/join/plan-name) or just the plan code.");
    if (hydrated && !plans[id]) return setError("No plan with that code exists in this demo. Check the link, or pick one below.");
    router.push(`/join/${id}`);
  };

  return (
    <AuthLayout>
      <Kicker tone="sky">Join a plan</Kicker>
      <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.08] sm:text-[2.4rem]">Got a link from the group chat?</h1>
      <p className="mt-3 text-[15px] font-medium text-muted">Paste it here. You&apos;ll only need your name.</p>
      <form onSubmit={submit} noValidate className="mt-7 space-y-4">
        <Field label="Plan link or code" error={error ?? undefined}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!error} placeholder="https://…/join/andheri-weekend" value={value} onChange={(e) => { setValue(e.target.value); setError(null); }} autoFocus />}
        </Field>
        <Button type="submit" variant="purple" size="lg" className="w-full">
          Open plan <ArrowRightIcon size={20} weight="bold" />
        </Button>
      </form>
      {hydrated && open.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">Demo links you can try</p>
          <ul className="space-y-2">
            {open.map((p) => (
              <li key={p.id}>
                <Link href={`/join/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-clay-sm transition hover:-translate-y-0.5">
                  <ArtTile icon={p.icon} tone={p.tone} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{p.title}</span>
                    <span className="block font-mono text-xs text-muted">/join/{p.id}</span>
                  </span>
                  <ArrowRightIcon size={16} weight="bold" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AuthLayout>
  );
}
