"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon, CalendarCheckIcon, ChecksIcon, HandCoinsIcon, LightbulbIcon, ReceiptIcon, StarIcon, StorefrontIcon, WarningIcon, type Icon } from "@phosphor-icons/react";
import type { NotificationKind, Tone } from "@/types";
import { cn, timeAgo } from "@/lib/format";
import { useDemo } from "@/lib/store/demo-store";
import { AppShell, PageHead } from "@/components/layout/AppShell";
import { ArtTile } from "@/components/ui/Art";
import { Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, useNow } from "@/components/ui/feedback";

const KIND: Record<NotificationKind, { icon: Icon; tone: Tone }> = {
  vote: { icon: StarIcon, tone: "lavender" },
  payment: { icon: HandCoinsIcon, tone: "sun" },
  confirm: { icon: CalendarCheckIcon, tone: "mint" },
  idea: { icon: LightbulbIcon, tone: "sky" },
  bill: { icon: ReceiptIcon, tone: "cream" },
  reminder: { icon: BellIcon, tone: "coral" },
  system: { icon: WarningIcon, tone: "pink" },
  offer: { icon: StorefrontIcon, tone: "sun" },
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "payments", label: "Payments" },
  { id: "votes", label: "Votes & ideas" },
] as const;

export default function NotificationsPage() {
  return (
    <AppShell>
      <Notifications />
    </AppShell>
  );
}

function Notifications() {
  const notifications = useDemo((s) => s.notifications);
  const markRead = useDemo((s) => s.markRead);
  const markAll = useDemo((s) => s.markAllRead);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const now = useNow(60_000);
  const list = notifications.filter((n) => (filter === "unread" ? !n.read : filter === "payments" ? ["payment", "confirm", "bill"].includes(n.kind) : filter === "votes" ? ["vote", "idea", "offer"].includes(n.kind) : true));
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
      <PageHead
        kicker={<Kicker tone="coral">Alerts</Kicker>}
        title="Notifications"
        subtitle="Polite, private reminders. Nobody is called out in front of the group."
        actions={
          <Button variant="secondary" onClick={markAll} disabled={unread === 0}>
            <ChecksIcon size={18} weight="bold" /> Mark all read
          </Button>
        }
      />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {FILTERS.map((f) => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={cn("h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold", filter === f.id ? "bg-pill text-white" : "bg-white text-ink-soft shadow-clay-sm")}>
            {f.label}
            {f.id === "unread" && unread > 0 && ` (${unread})`}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState title="You're all caught up" body="New votes, payments and offers will show up here." />
      ) : (
        <ul className="space-y-3">
          {list.map((n) => {
            const k = KIND[n.kind];
            return (
              <li key={n.id}>
                <Link href={n.href} onClick={() => markRead(n.id)} className={cn("flex items-start gap-3 rounded-[24px] bg-white p-4 shadow-clay-sm transition hover:-translate-y-0.5", !n.read && "ring-2 ring-ink shadow-pop")}>
                  <ArtTile glyph={k.icon} tone={k.tone} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      {n.title}
                      {!n.read && <span className="h-2 w-2 rounded-full bg-coral" aria-label="Unread" />}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-muted">{n.body}</p>
                    <p className="mt-1 text-[11px] font-semibold text-faint">{timeAgo(n.createdAt, now)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
