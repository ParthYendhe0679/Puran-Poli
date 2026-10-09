"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRightIcon, CheckCircleIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import type { IdeaIcon, Tone } from "@/types";
import { cn, formatINR, toLocalInput } from "@/lib/format";
import { useDemo } from "@/lib/store/demo-store";
import { validatePlanForm, type PlanFormErrors, type PlanFormValues } from "@/lib/validation";
import { joinUrl, whatsappShareUrl } from "@/lib/share";
import { AppShell, PageHead } from "@/components/layout/AppShell";
import { ArtTile, IDEA_ICONS } from "@/components/ui/Art";
import { Burst, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { CopyButton, QRImage, toast } from "@/components/ui/feedback";
import { TONES } from "@/components/ui/tones";

function defaults(): PlanFormValues {
  const h = 3600_000;
  const now = Date.now();
  const sat = new Date();
  sat.setDate(sat.getDate() + ((6 - sat.getDay() + 7) % 7 || 7));
  return {
    title: "",
    area: "",
    description: "",
    approxDate: sat.toISOString().slice(0, 10),
    groupSize: "8",
    minMembers: "6",
    maxSeats: "10",
    totalCost: "",
    ideaDeadline: toLocalInput(new Date(now + 6 * h).toISOString()),
    voteDeadline: toLocalInput(new Date(now + 24 * h).toISOString()),
    paymentDeadline: toLocalInput(new Date(now + 48 * h).toISOString()),
  };
}

const ICON_CHOICES: IdeaIcon[] = ["party", "bowling", "football", "food", "movie", "mountain", "villa", "beach", "music", "game"];

export default function CreatePlanPage() {
  return (
    <AppShell>
      <CreatePlan />
    </AppShell>
  );
}

function CreatePlan() {
  const createPlan = useDemo((s) => s.createPlan);
  const [v, setV] = useState<PlanFormValues>(defaults);
  const [icon, setIcon] = useState<IdeaIcon>("party");
  const [tone, setTone] = useState<Tone>("lavender");
  const [errors, setErrors] = useState<PlanFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const set = (k: keyof PlanFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...v, [k]: e.target.value };
    setV(next);
    if (submitted) setErrors(validatePlanForm(next));
  };

  const share = useMemo(() => {
    const cost = Number(v.totalCost);
    const min = Number(v.minMembers);
    return cost > 0 && min > 0 ? Math.ceil(cost / min) : null;
  }, [v.totalCost, v.minMembers]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validatePlanForm(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast("error", "Please fix the highlighted fields");
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    const id = createPlan({
      title: v.title,
      area: v.area,
      description: v.description,
      approxDate: new Date(v.approxDate).toISOString(),
      groupSize: Number(v.groupSize),
      minMembers: Number(v.minMembers),
      maxSeats: Number(v.maxSeats),
      totalCost: v.totalCost.trim() ? Number(v.totalCost) : null,
      ideaDeadline: new Date(v.ideaDeadline).toISOString(),
      voteDeadline: new Date(v.voteDeadline).toISOString(),
      paymentDeadline: new Date(v.paymentDeadline).toISOString(),
      icon,
      tone,
    });
    setCreatedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (createdId) {
    const link = joinUrl(createdId);
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 24 }} className="relative rounded-[28px] border-2 border-ink bg-white p-6 text-center shadow-pop-lg sm:p-10">
          <div className="absolute -right-3 -top-6 rotate-12">
            <Burst tone="mint">NEW!</Burst>
          </div>
          <CheckCircleIcon size={48} weight="fill" className="mx-auto text-success" />
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">{v.title} is live</h1>
          <p className="mt-2 text-[15px] font-medium text-muted">Share the link in your WhatsApp group. Friends join with just their name.</p>
          <div className="mx-auto mt-6 w-fit">
            <QRImage value={link} label={`QR code for ${v.title}`} />
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-canvas p-2 pl-4">
            <span className="min-w-0 flex-1 truncate text-left font-mono text-sm">{link}</span>
            <CopyButton text={link} label="Copy link" />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <ButtonLink href={whatsappShareUrl(`Join our plan "${v.title}" — vote on ideas and lock your seat: ${link}`)} external variant="outline">
              <WhatsappLogoIcon size={18} weight="bold" /> Share on WhatsApp
            </ButtonLink>
            <ButtonLink href={`/p/${createdId}?add=1`} variant="purple">
              Add the first idea <ArrowRightIcon size={18} weight="bold" />
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs font-medium text-faint">Demo link — it works in this browser because data is stored locally.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      <PageHead kicker={<Kicker tone="sun">New plan</Kicker>} title="Create a plan" subtitle="Set the rules once. Deadlines and the payment minimum do the chasing for you." />
      <form onSubmit={submit} noValidate className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
            <h2 className="text-lg font-bold">The basics</h2>
            <Field label="Plan name" error={errors.title}>
              {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.title} value={v.title} onChange={set("title")} placeholder="Weekend hangout" maxLength={48} />}
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Area" error={errors.area} hint="Keeps suggestions nearby.">
                {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.area} value={v.area} onChange={set("area")} placeholder="Andheri, Mumbai" />}
              </Field>
              <Field label="Approximate date" error={errors.approxDate}>
                {(id, d) => <Input id={id} type="date" aria-describedby={d} aria-invalid={!!errors.approxDate} value={v.approxDate} onChange={set("approxDate")} />}
              </Field>
            </div>
            <Field label="Note for the group" optional>
              {(id) => <Textarea id={id} value={v.description} onChange={set("description")} placeholder="Something chill this weekend — vote by Friday!" maxLength={160} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold">Look</p>
              <div className="flex flex-wrap gap-2">
                {ICON_CHOICES.map((i) => {
                  const G = IDEA_ICONS[i];
                  return (
                    <button key={i} type="button" onClick={() => setIcon(i)} aria-pressed={icon === i} aria-label={i} className={cn("grid h-11 w-11 place-items-center rounded-2xl transition", icon === i ? "border-2 border-ink bg-sun shadow-pop" : "bg-canvas hover:-translate-y-0.5")}>
                      <G size={22} weight="duotone" />
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button key={t} type="button" onClick={() => setTone(t)} aria-pressed={tone === t} aria-label={`${t} colour`} className={cn("h-9 w-9 rounded-full border-2 transition", tone === t ? "border-ink shadow-pop" : "border-white", { lavender: "bg-lavender", sun: "bg-sun", coral: "bg-coral", mint: "bg-mint", sky: "bg-sky", pink: "bg-pink", cream: "bg-cream", purple: "bg-purple" }[t])} />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
            <div>
              <h2 className="text-lg font-bold">Commitment rules</h2>
              <p className="mt-1 text-sm font-medium text-muted">The plan confirms only when the minimum number of members pay their share.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Expected group" error={errors.groupSize}>
                {(id, d) => <Input id={id} type="number" inputMode="numeric" min={2} aria-describedby={d} aria-invalid={!!errors.groupSize} value={v.groupSize} onChange={set("groupSize")} />}
              </Field>
              <Field label="Minimum to confirm" error={errors.minMembers}>
                {(id, d) => <Input id={id} type="number" inputMode="numeric" min={2} aria-describedby={d} aria-invalid={!!errors.minMembers} value={v.minMembers} onChange={set("minMembers")} />}
              </Field>
              <Field label="Maximum seats" error={errors.maxSeats}>
                {(id, d) => <Input id={id} type="number" inputMode="numeric" min={2} aria-describedby={d} aria-invalid={!!errors.maxSeats} value={v.maxSeats} onChange={set("maxSeats")} />}
              </Field>
            </div>
            <Field label="Total cost (₹)" optional error={errors.totalCost} hint="Leave empty to use the winning idea's cost per person.">
              {(id, d) => <Input id={id} type="number" inputMode="numeric" min={0} aria-describedby={d} aria-invalid={!!errors.totalCost} value={v.totalCost} onChange={set("totalCost")} placeholder="12000" />}
            </Field>
          </section>

          <section className="space-y-5 rounded-[28px] bg-white p-5 shadow-clay sm:p-7">
            <div>
              <h2 className="text-lg font-bold">Deadlines</h2>
              <p className="mt-1 text-sm font-medium text-muted">Every step has a deadline so the plan never stalls.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Ideas close" error={errors.ideaDeadline}>
                {(id, d) => <Input id={id} type="datetime-local" aria-describedby={d} aria-invalid={!!errors.ideaDeadline} value={v.ideaDeadline} onChange={set("ideaDeadline")} />}
              </Field>
              <Field label="Voting closes" error={errors.voteDeadline}>
                {(id, d) => <Input id={id} type="datetime-local" aria-describedby={d} aria-invalid={!!errors.voteDeadline} value={v.voteDeadline} onChange={set("voteDeadline")} />}
              </Field>
              <Field label="Payments close" error={errors.paymentDeadline}>
                {(id, d) => <Input id={id} type="datetime-local" aria-describedby={d} aria-invalid={!!errors.paymentDeadline} value={v.paymentDeadline} onChange={set("paymentDeadline")} />}
              </Field>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Preview</p>
            <div className="mt-3 flex items-center gap-3">
              <ArtTile icon={icon} tone={tone} size={52} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold">{v.title || "Your plan"}</p>
                <p className="truncate text-xs font-medium text-muted">{v.area || "Area"} · ~{v.approxDate}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-2">
              {[
                ["Confirms at", `${v.minMembers || "–"} paid`],
                ["Seats", v.maxSeats || "–"],
                ["Total", v.totalCost ? formatINR(Number(v.totalCost)) : "From idea"],
                ["Held share", share ? formatINR(share) : "—"],
              ].map(([k, val]) => (
                <div key={k} className="rounded-2xl bg-canvas p-3">
                  <dt className="text-[11px] font-semibold text-muted">{k}</dt>
                  <dd className="tabular font-display text-base font-extrabold">{val}</dd>
                </div>
              ))}
            </dl>
            <Button type="submit" variant="purple" size="lg" className="mt-5 w-full">
              Create plan <ArrowRightIcon size={20} weight="bold" />
            </Button>
            <p className="mt-3 text-center text-xs font-medium text-muted">You&apos;ll get a share link and a QR code.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
