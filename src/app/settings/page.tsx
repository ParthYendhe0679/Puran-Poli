"use client";

import { useState } from "react";
import { ArrowCounterClockwiseIcon, ShieldCheckIcon, StorefrontIcon } from "@phosphor-icons/react";
import type { Preferences } from "@/types";
import { useDemo, useMe, STORAGE_KEY } from "@/lib/store/demo-store";
import { validateName } from "@/lib/validation";
import { timeAgo } from "@/lib/format";
import { AppShell, PageHead, ResetDemoDialog } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Art";
import { DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Chip, Field, Input, Switch } from "@/components/ui/primitives";
import { toast } from "@/components/ui/feedback";

const INTERESTS = ["Active & sporty", "Chill & cosy", "Food first", "Adventure", "Movies", "Music", "Gaming", "Day trips"];
const PREFS: { key: keyof Preferences; label: string; hint: string }[] = [
  { key: "voteAlerts", label: "Voting reminders", hint: "Before a voting deadline if you haven't voted." },
  { key: "paymentAlerts", label: "Payment updates", hint: "When a plan confirms, or a hold is released." },
  { key: "reminders", label: "Event reminders", hint: "2 hours before a confirmed plan." },
  { key: "vibration", label: "Vibrate on confirmation", hint: "Uses your phone's vibration when supported." },
  { key: "weeklyDigest", label: "Weekly digest", hint: "A Sunday summary of open plans." },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <Settings />
    </AppShell>
  );
}

function Settings() {
  const me = useMe();
  const session = useDemo((s) => s.session);
  const seededAt = useDemo((s) => s.seededAt);
  const updateProfile = useDemo((s) => s.updateProfile);
  const setPref = useDemo((s) => s.setPref);
  const [name, setName] = useState(me?.name ?? "");
  const [upi, setUpi] = useState(me?.upiId ?? "");
  const [interests, setInterests] = useState<string[]>(session.interests);
  const [errors, setErrors] = useState<{ name?: string; upi?: string }>({});
  const [resetOpen, setResetOpen] = useState(false);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = validateName(name);
    const u = upi.trim() && !/^[\w.-]{2,}@[a-z][\w-]{1,}$/i.test(upi.trim()) ? "A UPI ID looks like name@bank." : undefined;
    setErrors({ name: n ?? undefined, upi: u });
    if (n || u) return;
    updateProfile({ name, upiId: upi.trim(), interests });
    toast("success", "Profile saved");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
      <PageHead kicker={<Kicker tone="lavender">Settings</Kicker>} title="Profile & preferences" />

      <form onSubmit={save} noValidate className="space-y-5 rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
        <div className="flex items-center gap-4">
          <Avatar person={me} size={64} ring />
          <div>
            <p className="font-display text-lg font-bold">{me?.name}</p>
            <p className="text-xs font-medium text-muted">Demo profile — no password or account</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" error={errors.name}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.name} value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />}
          </Field>
          <Field label="UPI ID" optional error={errors.upi} hint="Used in links when friends pay you back. Demo handles can't receive money.">
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.upi} value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" />}
          </Field>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Interests (for suggested ideas)</p>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <Chip key={i} size="sm" tone="lavender" selected={interests.includes(i)} onClick={() => setInterests((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))}>
                {i}
              </Chip>
            ))}
          </div>
        </div>
        <Button type="submit" variant="purple">
          Save profile
        </Button>
      </form>

      <section className="rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
        <h2 className="text-lg font-bold">Notifications</h2>
        <ul className="mt-4 divide-y divide-line">
          {PREFS.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 py-3.5">
              <label htmlFor={`pref-${p.key}`} className="min-w-0">
                <span className="block text-sm font-bold">{p.label}</span>
                <span className="block text-xs font-medium text-muted">{p.hint}</span>
              </label>
              <Switch id={`pref-${p.key}`} checked={session.prefs[p.key]} onCheckedChange={(v) => setPref(p.key, v)} label={p.label} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs font-medium text-muted">In-app only in this prototype; browser push notifications need the backend.</p>
      </section>

      <section className="rounded-[28px] bg-mint-soft p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShieldCheckIcon size={22} weight="duotone" className="text-mint-deep" /> Privacy
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm font-medium text-ink-soft">
          <li>• Private budgets are never shown to other members or the organiser.</li>
          <li>• Chat imports are processed in your browser and the text is not stored.</li>
          <li>• All demo data is stored only in this browser (localStorage key <code className="font-mono text-xs">{STORAGE_KEY}</code>).</li>
        </ul>
      </section>

      <section className="rounded-[28px] border-2 border-dashed border-ink/20 bg-white/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Demo data</h2>
            <p className="text-sm font-medium text-muted">Seeded {timeAgo(seededAt)}. Reset before judging to replay the same scenario.</p>
          </div>
          <DemoTag>Prototype</DemoTag>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <ArrowCounterClockwiseIcon size={18} weight="bold" /> Reset demo data
          </Button>
          <ButtonLink href="/venues" variant="outline">
            <StorefrontIcon size={18} weight="bold" /> Open venue console
          </ButtonLink>
        </div>
      </section>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </div>
  );
}
