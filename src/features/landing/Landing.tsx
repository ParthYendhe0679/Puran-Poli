"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  BellRingingIcon,
  CalendarCheckIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  ConfettiIcon,
  FilmSlateIcon,
  GridFourIcon,
  HandCoinsIcon,
  LockKeyIcon,
  MicrophoneIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  StorefrontIcon,
  UsersThreeIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react";
import { APP_NAME, cn } from "@/lib/format";
import { useDemo, useHydration } from "@/lib/store/demo-store";
import { Logo } from "@/components/layout/AppShell";
import { ArtTile, Avatar } from "@/components/ui/Art";
import { Badge, Burst, DemoTag, Highlight, Kicker } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/primitives";
import { PEOPLE } from "@/lib/mock-data/seed";
import type { Tone } from "@/types";

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

function SectionHead({ kicker, title, sub, tone = "sun", light }: { kicker: string; title: ReactNode; sub?: string; tone?: Tone; light?: boolean }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <Kicker tone={tone}>{kicker}</Kicker>
      <h2 className={cn("mt-5 text-[1.875rem] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[2.5rem]", light ? "text-white" : "text-ink")}>{title}</h2>
      {sub && <p className={cn("mt-3 text-[17px] leading-relaxed", light ? "text-white/70" : "text-muted")}>{sub}</p>}
    </div>
  );
}

function useEntryHref() {
  const hydrated = useHydration((s) => s.hydrated);
  const signedIn = useDemo((s) => s.session.signedIn);
  return hydrated && signedIn ? "/dashboard" : "/start";
}

// ── Header ─────────────────────────────────────────────────────────────────────────────
function PublicHeader() {
  const href = useEntryHref();
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#features", label: "Features" },
    { href: "#trust", label: "Trust" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo href="/" />
        <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-clay-sm md:flex" aria-label="Sections">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-ink-soft transition-colors hover:bg-canvas hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/join" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Join a plan
          </ButtonLink>
          <ButtonLink href={href} size="sm">
            {href === "/dashboard" ? "Open my plans" : "Get started"}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

// ── Hero showcase: a working mini version of the USP ───────────────────────────────────
function PaymentShowcase() {
  const [paid, setPaid] = useState(5);
  const min = 6;
  const confirmed = paid >= min;
  const share = Math.round(12000 / Math.max(min, paid));
  const names = PEOPLE.slice(1, 8);
  return (
    <div className="relative">
      <div className="absolute -right-2 -top-6 z-10 rotate-12 sm:-right-6">
        <Burst tone={confirmed ? "mint" : "sun"}>{confirmed ? "YES!" : "ZAP!"}</Burst>
      </div>
      <div className="rotate-1 rounded-[28px] border-2 border-ink bg-white p-5 shadow-pop-lg sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ArtTile icon="villa" tone="sun" size={48} />
            <div>
              <p className="font-display text-base font-bold leading-tight">Lonavala Villa</p>
              <p className="text-xs font-medium text-muted">₹12,000 total · min 6 · max 10</p>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.span key={String(confirmed)} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
              <Badge kind={confirmed ? "success" : "sun"} withDot pulse={!confirmed}>
                {confirmed ? "Confirmed" : "Collecting"}
              </Badge>
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Paid</p>
            <p className="tabular font-display text-3xl font-extrabold">
              {paid}
              <span className="text-lg text-faint"> / {min}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Share</p>
            <motion.p key={share} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular font-display text-3xl font-extrabold text-purple-deep">
              ₹{share.toLocaleString("en-IN")}
            </motion.p>
          </div>
        </div>
        <ProgressBar className="mt-3" value={paid / min} tone={confirmed ? "mint" : "purple"} label="Members paid" />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {names.map((p, i) => (
            <span key={p.id} className={cn("inline-flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-2 text-[11px] font-bold", i < paid ? "bg-success-soft text-success" : "bg-canvas text-muted")}>
              <Avatar person={p} size={20} />
              {i < paid ? "Paid" : "Interested"}
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant={confirmed ? "secondary" : "purple"} className="flex-1" onClick={() => setPaid((p) => (p >= 7 ? 5 : p + 1))}>
            {paid === 5 ? "Pay the last share" : paid === 6 ? "One more joins → share drops" : "Replay"}
          </Button>
        </div>
        <p className="mt-3 text-center text-[11px] font-semibold text-muted">Interactive preview · simulated payment</p>
      </div>
    </div>
  );
}

function Hero() {
  const href = useEntryHref();
  const proofs: { icon: Icon; text: string }[] = [
    { icon: UsersThreeIcon, text: "Join with a link and a name. No app, no password." },
    { icon: HandCoinsIcon, text: "Shares are held, not charged, until the plan confirms." },
    { icon: LockKeyIcon, text: "Private budgets — nobody sees your number." },
  ];
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-24">
      <div>
        <Kicker tone="sun">No more 300-message group chats</Kicker>
        <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[3.4rem] lg:text-[4.1rem]">
          Group plans that <Highlight>actually happen.</Highlight>
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-soft sm:text-lg">Propose ideas, vote fairly, find a time and pay your share in advance. The plan confirms itself the moment enough friends commit — and if they don&apos;t, everyone&apos;s money is released.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href={href} variant="purple" size="lg">
            Start planning <ArrowRightIcon size={20} weight="bold" />
          </ButtonLink>
          <ButtonLink href="/start?demo=1" variant="outline" size="lg">
            Explore the demo
          </ButtonLink>
        </div>
        <ul className="mt-9 grid gap-3 sm:grid-cols-3">
          {proofs.map((p) => (
            <li key={p.text} className="flex items-start gap-2.5 text-sm font-medium text-ink-soft">
              <p.icon size={22} weight="duotone" className="mt-0.5 shrink-0 text-purple" />
              {p.text}
            </li>
          ))}
        </ul>
      </div>
      <Reveal delay={0.1}>
        <PaymentShowcase />
      </Reveal>
    </section>
  );
}

function Marquee() {
  const items: { t: string; icon: Parameters<typeof ArtTile>[0]["icon"]; tone: Tone }[] = [
    { t: "Bowling at Andheri · ₹600", icon: "bowling", tone: "lavender" },
    { t: "Turf football · ₹350", icon: "football", tone: "mint" },
    { t: "Lonavala villa · ₹2,000", icon: "villa", tone: "sun" },
    { t: "Movie at PVR Juhu · ₹450", icon: "movie", tone: "sky" },
    { t: "Go-karting · ₹1,200", icon: "kart", tone: "coral" },
    { t: "Karaoke night · ₹700", icon: "music", tone: "pink" },
    { t: "Juhu sunset · ₹300", icon: "beach", tone: "cream" },
  ];
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-white py-5" aria-label="Example plan ideas">
      <div className="flex w-max animate-marquee gap-4 motion-reduce:animate-none">
        {row.map((it, i) => (
          <div key={i} className="flex shrink-0 items-center gap-3 rounded-[28px] border-2 border-ink bg-canvas px-4 py-2.5 shadow-pop" aria-hidden={i >= items.length}>
            <ArtTile icon={it.icon} tone={it.tone} size={34} />
            <span className="text-sm font-bold">{it.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Propose", d: "Anyone adds idea cards — or drops in the exported WhatsApp chat and we find the ideas already discussed.", icon: ChatsCircleIcon, tone: "lavender" as Tone },
    { n: "02", t: "Decide", d: "Fair voting with hidden results, one veto each, a heatmap for time and private budgets.", icon: GridFourIcon, tone: "sky" as Tone },
    { n: "03", t: "Pay", d: "Members join by paying their share. It is held, not charged. More members → lower share.", icon: WalletIcon, tone: "sun" as Tone },
    { n: "04", t: "Confirm", d: "Minimum reached? Confirmed for everyone at once. Missed the deadline? Everyone is released.", icon: CalendarCheckIcon, tone: "mint" as Tone },
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionHead kicker="How it works" title="One link. Four steps. Zero follow-ups." sub="Every step has a deadline, so the plan always moves forward." />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.06}>
            <div className="relative h-full overflow-hidden rounded-[28px] bg-white p-6 shadow-clay">
              <span className="absolute -right-2 -top-5 font-display text-7xl font-extrabold text-ink/5" aria-hidden>
                {s.n}
              </span>
              <ArtTile glyph={s.icon} tone={s.tone} size={52} />
              <h3 className="mt-5 text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const JOURNEY = [
  { t: "Propose", d: "6 ideas from the group chat become cards with who suggested them.", stat: "212 messages → 4 ideas" },
  { t: "Decide", d: "Votes stay hidden until you vote. The tie-breaker explains itself.", stat: "Bowling 10.2 · Movie 10.0" },
  { t: "Pay", d: "Join by paying ₹2,000 — held, not charged.", stat: "5 of 6 paid" },
  { t: "Confirm", d: "The 6th payment confirms the plan on every screen at once.", stat: "Confirmed in 2 h" },
  { t: "Remind", d: "Calendar invite + polite reminders. Nobody has to chase anyone.", stat: ".ics + Google Calendar" },
  { t: "Event day", d: "Schedule, who is on the way, “I'll be late” and shared photos.", stat: "Aman · 12 min away" },
  { t: "Split", d: "Scan the bill, everyone ticks their items, GST split fairly.", stat: "3 payments, not 9" },
  { t: "Summary", d: "A short recap of the plan and the event to share.", stat: "Made in your browser" },
];

function DarkShowcase() {
  const [i, setI] = useState(2);
  const step = JOURNEY[i];
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead kicker="The whole journey" title="From “kuch plan karte hai?” to settled up." sub="Tap through the eight steps of a plan." tone="lavender" light />
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" role="tablist" aria-label="Journey steps">
          {JOURNEY.map((s, idx) => (
            <button key={s.t} role="tab" aria-selected={idx === i} onClick={() => setI(idx)} className={cn("relative h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition", idx === i ? "text-ink" : "text-white/70 hover:text-white")}>
              {idx === i && <motion.span layoutId="journey-pill" className="absolute inset-0 rounded-full border-2 border-white bg-sun" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">
                {idx + 1}. {s.t}
              </span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }} className="mx-auto mt-8 grid max-w-3xl items-center gap-6 rounded-[32px] border-2 border-white/20 bg-white/5 p-6 sm:grid-cols-[1.3fr_1fr] sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sun">Step {i + 1} of 8</p>
              <h3 className="mt-2 text-2xl font-bold">{step.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/75">{step.d}</p>
            </div>
            <div className="rounded-[24px] border-2 border-ink bg-white p-5 text-center text-ink shadow-[5px_5px_0_#c6b5f6]">
              <p className="tabular font-display text-xl font-extrabold">{step.stat}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => setI((x) => (x + 7) % 8)}>
            Back
          </Button>
          <Button variant="sun" onClick={() => setI((x) => (x + 1) % 8)}>
            Next step <ArrowRightIcon size={18} weight="bold" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function TwoSided() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead kicker="Built for both sides" title="Fun for friends. Calm for organisers and venues." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[32px] bg-lavender-soft p-6 sm:p-8">
            <Badge kind="purple">For friend groups</Badge>
            <h3 className="mt-4 text-2xl font-bold">Decide in an hour, not a week</h3>
            <ul className="mt-5 space-y-3">
              {["Love it / Okay / No voting with one veto each", "“Above the budget of 2 members” — never who", "Your share drops when more friends join", "Item-wise bill split with UPI links"].map((t) => (
                <li key={t} className="flex items-start gap-2.5 rounded-2xl bg-white p-3 text-sm font-semibold shadow-clay-sm">
                  <CheckCircleIcon size={20} weight="fill" className="shrink-0 text-purple" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="h-full rounded-[32px] border border-line-cool bg-dots-cool p-6 shadow-soft sm:p-8">
            <Badge kind="info">For venues & college clubs</Badge>
            <h3 className="mt-4 text-2xl font-bold">Group bookings that already paid</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                { l: "Open requests", v: "12" },
                { l: "Avg. group", v: "8 ppl" },
                { l: "Pre-paid", v: "100%" },
                { l: "No-shows", v: "↓ low" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-line-cool bg-white p-4 shadow-soft">
                  <p className="text-xs font-semibold text-muted">{s.l}</p>
                  <p className="tabular mt-1 font-display text-2xl font-extrabold">{s.v}</p>
                </div>
              ))}
            </div>
            <Link href="/venues" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-info hover:underline">
              <StorefrontIcon size={18} weight="duotone" /> Peek at the venue console
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features: { t: string; d: string; icon: Icon; tone: Tone; big?: boolean }[] = [
    { t: "Confirm by advance payment", d: "The plan locks only when the minimum number of members pay. Otherwise every hold is released.", icon: HandCoinsIcon, tone: "sun", big: true },
    { t: "WhatsApp chat import", d: "Upload the exported .txt. Ideas, supporters and open questions are pulled out in your browser.", icon: ChatsCircleIcon, tone: "mint" },
    { t: "Fair voting", d: "Hidden results, one veto, turn-based fairness and an explained tie-breaker.", icon: ConfettiIcon, tone: "lavender" },
    { t: "Availability heatmap", d: "Tap your free hours. The best slot always includes required members.", icon: GridFourIcon, tone: "sky" },
    { t: "Private budgets", d: "Ideas show “fits everyone” or “above N members”. Amounts stay private.", icon: LockKeyIcon, tone: "pink" },
    { t: "Voice discussion room", d: "Talk for five minutes; ideas, votes and times land on the plan.", icon: MicrophoneIcon, tone: "coral" },
    { t: "Receipt scan & item split", d: "Everyone ticks their items. GST and service charge split in proportion.", icon: ReceiptIcon, tone: "cream" },
    { t: "Event day & summary", d: "Schedule, arrivals, “I'll be late”, shared photos and a recap video.", icon: FilmSlateIcon, tone: "purple", big: true },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
      <SectionHead kicker="Features" title="Everything a group plan needs — in one link" tone="mint" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <Reveal key={f.t} delay={(i % 4) * 0.05} className={f.big ? "sm:col-span-2" : ""}>
            <div className="h-full rounded-[28px] bg-white p-6 shadow-clay transition-all duration-200 hover:-translate-y-1 hover:shadow-clay-lg">
              <ArtTile glyph={f.icon} tone={f.tone} size={52} />
              <h3 className="mt-5 text-lg font-bold">{f.t}</h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{f.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section id="trust" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 sm:px-6">
      <div className="grid gap-8 rounded-[40px] bg-white p-6 shadow-clay sm:p-10 lg:grid-cols-2">
        <div>
          <Kicker tone="coral">Why this matters</Kicker>
          <h2 className="mt-5 text-[1.875rem] font-extrabold leading-[1.1] sm:text-[2.25rem]">Group chats don&apos;t make decisions. Commitments do.</h2>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { v: "42%", l: "say group chats feel like a part-time job" },
              { v: "75%", l: "had friends cancel plans on them" },
              { v: "76%", l: "of Gen Z payers weren't fully paid back" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl bg-canvas p-3 sm:p-4">
                <p className="tabular font-display text-2xl font-extrabold text-coral-deep sm:text-3xl">{s.v}</p>
                <p className="mt-1 text-xs font-medium text-muted">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs font-medium text-faint">Sources: Secure Data Recovery, Ipsos (2024), Zelle via Rethinking65 (2026) — see project document §3.</p>
        </div>
        <div className="space-y-3">
          {[
            { icon: ShieldCheckIcon, t: "Payments are held, not charged", d: "Released automatically if the plan isn't confirmed. (Simulated in this prototype.)" },
            { icon: LockKeyIcon, t: "Budgets are never shown", d: "Not even the organiser sees amounts. Aggregates need 3+ budgets." },
            { icon: ChatsCircleIcon, t: "Chats are read in your browser", d: "The .txt file never leaves your device in this prototype." },
            { icon: BellRingingIcon, t: "Polite reminders, no public shaming", d: "Members who haven't paid are never highlighted to the group." },
          ].map((x) => (
            <div key={x.t} className="flex items-start gap-3 rounded-2xl border border-line p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint-soft text-mint-deep">
                <x.icon size={22} weight="duotone" />
              </span>
              <div>
                <p className="text-[15px] font-bold">{x.t}</p>
                <p className="text-sm font-medium text-muted">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  const href = useEntryHref();
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="relative overflow-hidden rounded-[32px] border-2 border-ink bg-sun p-8 text-center shadow-pop-lg sm:p-14">
        <div className="bg-speed absolute inset-0" aria-hidden />
        <div className="relative">
          <h2 className="text-[1.875rem] font-extrabold leading-[1.1] sm:text-[2.5rem]">Your next plan is one link away.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[17px] font-medium text-ink-soft">Try the full demo: vote, pay a simulated share and watch the plan confirm.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href={href} size="lg">
              Start planning <ArrowRightIcon size={20} weight="bold" />
            </ButtonLink>
            <ButtonLink href="/join" variant="outline" size="lg">
              I have a plan link
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden bg-ink pb-28 pt-14 text-white md:pb-14">
      <span className="pointer-events-none absolute -bottom-[4vw] left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[18vw] font-extrabold leading-none text-white/5" aria-hidden>
        PLAN IT
      </span>
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-extrabold">{APP_NAME}</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">CodeAstra 2.0 · Round 1 frontend prototype. All data lives in your browser; payments, AI and voice are clearly-labelled simulations.</p>
          <DemoTag className="mt-4">Prototype — no real money moves</DemoTag>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Try it</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li><Link href="/start" className="hover:text-sun">Get started</Link></li>
            <li><Link href="/join" className="hover:text-sun">Join with a link</Link></li>
            <li><Link href="/import" className="hover:text-sun">Import a WhatsApp chat</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">Explore</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold">
            <li><a href="#how" className="hover:text-sun">How it works</a></li>
            <li><a href="#features" className="hover:text-sun">Features</a></li>
            <li><Link href="/venues" className="hover:text-sun">Venue console</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function MobileCta() {
  const href = useEntryHref();
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-2 rounded-[28px] border-2 border-ink bg-white/95 p-2 shadow-pop backdrop-blur md:hidden">
      <ButtonLink href="/join" variant="secondary" size="md" className="flex-1">
        Join a plan
      </ButtonLink>
      <ButtonLink href={href} variant="purple" size="md" className="flex-1">
        Get started
      </ButtonLink>
    </div>
  );
}

export function Landing() {
  return (
    <>
      <PublicHeader />
      <main>
        <Hero />
        <Marquee />
        <HowItWorks />
        <DarkShowcase />
        <TwoSided />
        <FeatureGrid />
        <Trust />
        <CtaBanner />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
