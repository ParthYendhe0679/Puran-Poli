"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowRightIcon, CheckIcon, InfoIcon, PlusIcon, ReceiptIcon, ScanIcon, TrashIcon, UploadSimpleIcon, WarningIcon } from "@phosphor-icons/react";
import type { Bill, BillCategory } from "@/types";
import { cn, formatINR, uid } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { splitBill } from "@/lib/calc/bill";
import { downscaleImage } from "@/lib/share";
import { usePlanId } from "@/features/plans/PlanShell";
import { Avatar } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input, Select, Switch } from "@/components/ui/primitives";
import { EmptyState, toast } from "@/components/ui/feedback";

function demoBill(paidBy: string, photo?: string): Bill {
  return {
    id: uid("bill"),
    venue: "Strike Bowl Cafe, Andheri",
    paidBy,
    photo,
    items: [
      { id: uid("bi"), name: "Peri peri fries", qty: 2, price: 398, category: "food", selectedBy: [] },
      { id: uid("bi"), name: "Paneer tikka pizza", qty: 1, price: 549, category: "food", selectedBy: [] },
      { id: uid("bi"), name: "Chicken burger", qty: 2, price: 638, category: "food", selectedBy: [] },
      { id: uid("bi"), name: "Cold coffee", qty: 3, price: 447, category: "drink", selectedBy: [] },
      { id: uid("bi"), name: "Pitcher of beer", qty: 1, price: 899, category: "alcohol", selectedBy: [] },
      { id: uid("bi"), name: "Choco lava cake", qty: 2, price: 358, category: "food", selectedBy: [] },
    ],
    printedSubtotal: 3289,
    gst: 164,
    serviceCharge: 329,
    discount: 0,
    removeServiceCharge: false,
    scannedAt: new Date().toISOString(),
    source: "demo-scan",
  };
}

const CATS: { v: BillCategory; label: string }[] = [
  { v: "food", label: "Food" },
  { v: "drink", label: "Drink" },
  { v: "alcohol", label: "Alcohol" },
];

export default function BillPage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const setBill = useDemo((s) => s.setBill);
  const updateBill = useDemo((s) => s.updateBill);
  const updateItem = useDemo((s) => s.updateBillItem);
  const addItem = useDemo((s) => s.addBillItem);
  const removeItem = useDemo((s) => s.removeBillItem);
  const toggleFor = useDemo((s) => s.toggleItemFor);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | undefined>();
  const [onlyMine, setOnlyMine] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const memberIds = plan?.members.map((m) => m.userId) ?? [];
  const split = plan?.bill ? splitBill(plan.bill, memberIds) : null;
  if (!plan) return null;

  if (!["event_day", "settling", "completed", "confirmed"].includes(plan.status)) {
    return <EmptyState title="Bill split opens after the event" body="Once the plan happens, scan the bill here and everyone picks their own items." mood="think" action={<ButtonLink href={`/p/${plan.id}`} variant="purple">Back to plan</ButtonLink>} />;
  }

  const startScan = async (file?: File) => {
    let photo: string | undefined;
    if (file) {
      if (!file.type.startsWith("image/")) return toast("error", "Please choose a photo of the bill", "JPG, PNG or HEIC images work best.");
      if (file.size > 15 * 1024 * 1024) return toast("error", "That photo is larger than 15 MB");
      try {
        photo = await downscaleImage(file, 720, 0.7);
        setPreview(photo);
      } catch {
        return toast("error", "We couldn't read that image", "Try another photo.");
      }
    }
    setScanning(true);
    setTimeout(() => {
      setBill(plan.id, demoBill(ME, photo));
      setScanning(false);
      toast("ai", "Bill read (demo extraction)", "OCR isn't connected in this prototype — check and edit the items.");
    }, 1800);
  };

  const bill = plan.bill;

  if (!bill || scanning) {
    return (
      <div className="mx-auto max-w-2xl pb-6">
        <Kicker tone="cream">Receipt scanner</Kicker>
        <h2 className="mt-3 text-2xl font-extrabold">Scan the bill</h2>
        <p className="mt-1 text-sm font-medium text-muted">One person uploads the bill. Everyone then ticks what they had on their own phone.</p>
        <div className="mt-6 rounded-[28px] border-2 border-dashed border-ink/25 bg-white p-8 text-center">
          {scanning ? (
            <div role="status" className="space-y-4">
              <div className="relative mx-auto h-48 w-36 overflow-hidden rounded-2xl border-2 border-ink bg-canvas shadow-pop">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                {preview ? <img src={preview} alt="Bill preview" className="h-full w-full object-cover" /> : <ReceiptIcon size={64} weight="duotone" className="mx-auto mt-14 text-faint" />}
                <motion.div className="absolute inset-x-0 h-1 bg-purple shadow-[0_0_12px_#7b5cf0]" initial={{ top: 0 }} animate={{ top: "100%" }} transition={{ duration: 0.9, repeat: Infinity, repeatType: "reverse" }} />
              </div>
              <p className="text-sm font-bold">Reading items, GST and service charge…</p>
              <DemoTag>Demo extraction</DemoTag>
            </div>
          ) : (
            <>
              <ScanIcon size={48} weight="duotone" className="mx-auto text-purple" />
              <p className="mt-3 font-display text-lg font-bold">Upload a photo of the bill</p>
              <p className="mt-1 text-sm font-medium text-muted">We&apos;ll check that the items add up to the printed subtotal.</p>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => startScan(e.target.files?.[0])} />
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="purple" onClick={() => fileRef.current?.click()}>
                  <UploadSimpleIcon size={18} weight="bold" /> Choose photo
                </Button>
                <Button variant="outline" onClick={() => startScan()}>
                  Use demo receipt
                </Button>
              </div>
              <p className="mt-4 text-xs font-medium text-faint">OCR/AI vision is not connected — results are realistic demo data you can edit.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const mineTotal = split?.shares.find((s) => s.userId === ME)?.total ?? 0;
  const items = onlyMine ? bill.items.filter((i) => i.selectedBy.includes(ME)) : bill.items;

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker tone="cream">Item-wise split</Kicker>
            <h2 className="mt-3 text-2xl font-extrabold">{bill.venue}</h2>
            <p className="mt-1 text-sm font-medium text-muted">Tap the faces on each item. Shared items are divided between everyone who picks them.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <Switch checked={onlyMine} onCheckedChange={setOnlyMine} label="Show only my items" /> Only mine
            </label>
          </div>
        </div>

        {split && !split.subtotalMatches && (
          <div role="alert" className="flex items-start gap-3 rounded-[24px] border-2 border-dashed border-danger/40 bg-danger-soft/60 p-4 text-sm font-semibold text-danger">
            <WarningIcon size={20} weight="fill" className="shrink-0" />
            Items add up to {formatINR(split.itemsTotal)} but the bill says {formatINR(bill.printedSubtotal)} ({split.subtotalDiff > 0 ? "+" : ""}
            {formatINR(split.subtotalDiff)}). Check the highlighted prices.
          </div>
        )}
        {split && split.unassigned.length > 0 && (
          <div className="flex items-start gap-3 rounded-[24px] bg-sun-soft p-4 text-sm font-semibold text-sun-deep">
            <InfoIcon size={20} weight="fill" className="shrink-0" /> {split.unassigned.length} item{split.unassigned.length === 1 ? " has" : "s have"} no one selected yet — totals are final once every item is picked.
          </div>
        )}

        <ul className="space-y-3">
          {items.map((item) => {
            const unassigned = item.selectedBy.length === 0;
            return (
              <li key={item.id} className={cn("rounded-[24px] bg-white p-4 shadow-clay-sm", unassigned && "ring-2 ring-sun")}>
                <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_70px_110px_120px_auto] sm:items-center">
                  <label className="col-span-2 sm:col-span-1">
                    <span className="sr-only">Item name</span>
                    <Input value={item.name} onChange={(e) => updateItem(plan.id, item.id, { name: e.target.value })} className="h-10 font-semibold" />
                  </label>
                  <label>
                    <span className="sr-only">Quantity</span>
                    <Input type="number" min={1} value={item.qty} onChange={(e) => updateItem(plan.id, item.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className="h-10 text-center" aria-label={`Quantity of ${item.name}`} />
                  </label>
                  <label>
                    <span className="sr-only">Line price</span>
                    <Input type="number" min={0} value={item.price} onChange={(e) => updateItem(plan.id, item.id, { price: Math.max(0, Number(e.target.value) || 0) })} className={cn("h-10 text-right tabular", split && !split.subtotalMatches && "border-danger/40")} aria-label={`Price of ${item.name}`} />
                  </label>
                  <Select value={item.category} onChange={(e) => updateItem(plan.id, item.id, { category: e.target.value as BillCategory })} aria-label={`Category of ${item.name}`} className="h-10">
                    {CATS.map((c) => (
                      <option key={c.v} value={c.v}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                  <button onClick={() => removeItem(plan.id, item.id)} className="grid h-10 w-10 place-items-center justify-self-end rounded-full text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Remove ${item.name}`}>
                    <TrashIcon size={16} weight="bold" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {memberIds.map((id) => {
                    const on = item.selectedBy.includes(id);
                    return (
                      <button key={id} onClick={() => toggleFor(plan.id, item.id, id)} aria-pressed={on} aria-label={`${people[id]?.name} had ${item.name}`} className={cn("relative rounded-full transition", on ? "scale-100" : "opacity-40 grayscale hover:opacity-80")}>
                        <Avatar person={people[id]} size={32} ring={on} />
                        {on && <CheckIcon size={12} weight="bold" className="absolute -bottom-0.5 -right-0.5 rounded-full bg-success p-0.5 text-white" />}
                      </button>
                    );
                  })}
                  <span className="ml-auto text-xs font-semibold text-muted">{item.selectedBy.length ? `${formatINR(item.price / item.selectedBy.length)} each` : "Nobody yet"}</span>
                  {item.category === "alcohol" && <Badge kind="coral">Only split among drinkers</Badge>}
                </div>
                <button onClick={() => toggleFor(plan.id, item.id, ME)} className={cn("mt-3 h-9 w-full rounded-full text-xs font-bold transition sm:w-auto sm:px-4", item.selectedBy.includes(ME) ? "bg-pill text-white" : "bg-canvas text-ink hover:bg-lavender-soft")}>
                  {item.selectedBy.includes(ME) ? "✓ I had this" : "I had this"}
                </button>
              </li>
            );
          })}
        </ul>
        <Button variant="secondary" onClick={() => addItem(plan.id)}>
          <PlusIcon size={16} weight="bold" /> Add a missing item
        </Button>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
        <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
          <p className="text-sm font-semibold text-muted">Your share</p>
          <p className="tabular font-display text-4xl font-extrabold text-purple-deep">{formatINR(mineTotal)}</p>
          <p className="mt-1 text-xs font-medium text-muted">Includes your part of GST and service charge.</p>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="text-base font-bold">Bill totals</h3>
          <label className="mt-3 block text-xs font-semibold text-muted">
            Paid by
            <Select value={bill.paidBy} onChange={(e) => updateBill(plan.id, { paidBy: e.target.value })} className="mt-1">
              {memberIds.map((id) => (
                <option key={id} value={id}>
                  {id === ME ? "You" : people[id]?.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["printedSubtotal", "Printed subtotal"],
                ["gst", "GST"],
                ["serviceCharge", "Service charge"],
                ["discount", "Discount"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="text-xs font-semibold text-muted">
                {label}
                <Input type="number" min={0} value={bill[k]} onChange={(e) => updateBill(plan.id, { [k]: Math.max(0, Number(e.target.value) || 0) })} className="mt-1 h-10 text-right tabular" />
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-canvas p-3 text-xs font-semibold">
            <span>Remove service charge</span>
            <Switch checked={bill.removeServiceCharge} onCheckedChange={(v) => updateBill(plan.id, { removeServiceCharge: v })} label="Remove service charge" />
          </label>
          <p className="mt-2 text-[11px] font-medium text-muted">Under CCPA guidelines (2022), service charge on restaurant bills in India is voluntary.</p>
          {split && (
            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Items</dt>
                <dd className="tabular font-semibold">{formatINR(split.itemsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Taxes & charges</dt>
                <dd className="tabular font-semibold">{formatINR(split.charges)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5 text-base">
                <dt className="font-bold">Total</dt>
                <dd className="tabular font-display font-extrabold">{formatINR(split.billTotal)}</dd>
              </div>
            </dl>
          )}
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="mb-3 text-base font-bold">Per person</h3>
          <ul className="space-y-2">
            {split?.shares.map((s) => (
              <li key={s.userId} className="flex items-center gap-2.5 text-sm">
                <Avatar person={people[s.userId]} size={28} />
                <span className="min-w-0 flex-1 truncate font-semibold">{s.userId === ME ? "You" : people[s.userId]?.name}</span>
                <span className="tabular font-bold">{formatINR(s.total)}</span>
              </li>
            ))}
          </ul>
          {split && split.roundingAdjustment !== 0 && <p className="mt-2 text-[11px] font-medium text-muted">Rounding difference of {formatINR(Math.abs(split.roundingAdjustment))} assigned to the payer.</p>}
          <ButtonLink href={`/p/${plan.id}/settle`} variant="purple" className="mt-4 w-full">
            Settle up <ArrowRightIcon size={18} weight="bold" />
          </ButtonLink>
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setBill(plan.id, null)}>
            Scan a different bill
          </Button>
        </div>
        <DemoTag>Extraction is demo data · maths is real</DemoTag>
      </aside>
    </div>
  );
}
