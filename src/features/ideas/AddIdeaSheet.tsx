"use client";

import { useState } from "react";
import type { IdeaIcon, Tone } from "@/types";
import { cn } from "@/lib/format";
import { useDemo } from "@/lib/store/demo-store";
import { validateIdea } from "@/lib/validation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/primitives";
import { IDEA_ICONS } from "@/components/ui/Art";
import { toast } from "@/components/ui/feedback";

const ICONS: { icon: IdeaIcon; tone: Tone }[] = [
  { icon: "bowling", tone: "lavender" },
  { icon: "football", tone: "mint" },
  { icon: "movie", tone: "sky" },
  { icon: "food", tone: "coral" },
  { icon: "coffee", tone: "cream" },
  { icon: "mountain", tone: "sun" },
  { icon: "beach", tone: "sky" },
  { icon: "music", tone: "pink" },
  { icon: "game", tone: "purple" },
  { icon: "kart", tone: "coral" },
];

export function AddIdeaSheet({ planId, open, onOpenChange }: { planId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const addIdea = useDemo((s) => s.addIdea);
  const [f, setF] = useState({ title: "", place: "", cost: "", time: "", link: "", note: "" });
  const [pick, setPick] = useState(0);
  const [errors, setErrors] = useState<ReturnType<typeof validateIdea>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateIdea(f);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    addIdea(planId, {
      title: f.title.trim(),
      place: f.place.trim(),
      costPerPerson: Math.round(Number(f.cost)),
      timeNote: f.time.trim() || "Flexible",
      link: f.link.trim() || undefined,
      note: f.note.trim() || undefined,
      icon: ICONS[pick].icon,
      tone: ICONS[pick].tone,
    });
    toast("success", "Idea added", `${f.title.trim()} is now on the plan.`);
    setF({ title: "", place: "", cost: "", time: "", link: "", note: "" });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add an idea" description="Every idea needs a place and a cost per person so the group can compare.">
      <form id="add-idea" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Idea" error={errors.title}>
          {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.title} value={f.title} onChange={set("title")} placeholder="Bowling night" autoFocus maxLength={48} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Place" error={errors.place}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.place} value={f.place} onChange={set("place")} placeholder="Infiniti Mall, Andheri" />}
          </Field>
          <Field label="Cost per person (₹)" error={errors.cost}>
            {(id, d) => <Input id={id} type="number" inputMode="numeric" min={0} aria-describedby={d} aria-invalid={!!errors.cost} value={f.cost} onChange={set("cost")} placeholder="600" />}
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When" optional>
            {(id) => <Input id={id} value={f.time} onChange={set("time")} placeholder="Saturday evening" />}
          </Field>
          <Field label="Link" optional error={errors.link}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.link} value={f.link} onChange={set("link")} placeholder="https://maps.google.com/…" inputMode="url" />}
          </Field>
        </div>
        <Field label="Short note" optional>
          {(id) => <Textarea id={id} value={f.note} onChange={set("note")} placeholder="Shoes included, food court next door" maxLength={140} className="min-h-20" />}
        </Field>
        <div>
          <p className="mb-2 text-sm font-semibold">Picture</p>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((x, i) => {
              const G = IDEA_ICONS[x.icon];
              return (
                <button key={x.icon} type="button" aria-label={x.icon} aria-pressed={pick === i} onClick={() => setPick(i)} className={cn("grid h-11 w-11 place-items-center rounded-2xl transition", pick === i ? "border-2 border-ink bg-sun shadow-pop" : "bg-white shadow-clay-sm hover:-translate-y-0.5")}>
                  <G size={22} weight="duotone" />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="purple">
            Add idea
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
