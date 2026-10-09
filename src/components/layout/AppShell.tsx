"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  ArrowCounterClockwiseIcon,
  BellIcon,
  ChatsCircleIcon,
  GearSixIcon,
  HouseIcon,
  PlusCircleIcon,
  SignOutIcon,
  StorefrontIcon,
  type Icon,
} from "@phosphor-icons/react";
import { cn, APP_NAME, APP_SHORT } from "@/lib/format";
import { useDemo, useMe } from "@/lib/store/demo-store";
import { Avatar, LogoMark } from "@/components/ui/Art";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/feedback";
import { RequireSession } from "./Providers";
import { AssistantWidget } from "@/features/assistant/AssistantWidget";

interface NavItem {
  href: string;
  label: string;
  Icon: Icon;
  match: (p: string) => boolean;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: HouseIcon, match: (p) => p === "/dashboard" || p.startsWith("/p/") },
  { href: "/create", label: "New plan", Icon: PlusCircleIcon, match: (p) => p.startsWith("/create") },
  { href: "/import", label: "Import chat", Icon: ChatsCircleIcon, match: (p) => p.startsWith("/import") },
  { href: "/notifications", label: "Alerts", Icon: BellIcon, match: (p) => p.startsWith("/notifications") },
  { href: "/settings", label: "Settings", Icon: GearSixIcon, match: (p) => p.startsWith("/settings") },
];

export function Logo({ href = "/", compact }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-full" aria-label={`${APP_NAME} home`}>
      <LogoMark size={36} />
      <span className="font-display text-[15px] font-extrabold leading-none tracking-tight text-ink">
        {compact ? (
          APP_SHORT
        ) : (
          <>
            <span className="hidden sm:inline">{APP_NAME}</span>
            <span className="sm:hidden">{APP_SHORT}</span>
          </>
        )}
      </span>
    </Link>
  );
}

export function ResetDemoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const reset = useDemo((s) => s.resetDemo);
  const router = useRouter();
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reset demo data?"
      description="Every plan, vote, payment and bill goes back to the original demo scenario. Your display name is kept."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              reset();
              onOpenChange(false);
              toast("success", "Demo data reset", "Everything is back to the starting scenario.");
              router.push("/dashboard");
            }}
          >
            <ArrowCounterClockwiseIcon size={18} weight="bold" /> Reset demo
          </Button>
        </>
      }
    >
      <p className="rounded-2xl bg-white p-4 text-sm font-medium text-ink-soft shadow-clay-sm">This only affects the data stored in this browser. Nothing is sent to a server.</p>
    </Sheet>
  );
}

function ProfileMenu() {
  const me = useMe();
  const signOut = useDemo((s) => s.signOut);
  const router = useRouter();
  const [resetOpen, setResetOpen] = useState(false);
  const item = "flex h-11 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-ink outline-none data-[highlighted]:bg-canvas";
  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-purple" aria-label="Open profile menu">
          <Avatar person={me} size={40} ring />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content align="end" sideOffset={8} className="z-[70] w-64 rounded-[22px] border-2 border-ink bg-white p-2 shadow-pop-lg">
            <div className="px-3 pb-2 pt-1.5">
              <p className="text-sm font-bold text-ink">{me?.name}</p>
              <p className="text-xs font-medium text-muted">Demo profile · no password</p>
            </div>
            <Dropdown.Separator className="my-1 h-px bg-line" />
            <Dropdown.Item className={item} onSelect={() => router.push("/settings")}>
              <GearSixIcon size={18} weight="duotone" /> Settings
            </Dropdown.Item>
            <Dropdown.Item className={item} onSelect={() => router.push("/venues")}>
              <StorefrontIcon size={18} weight="duotone" /> Switch to venue console
            </Dropdown.Item>
            <Dropdown.Item className={item} onSelect={() => setResetOpen(true)}>
              <ArrowCounterClockwiseIcon size={18} weight="duotone" /> Reset demo data
            </Dropdown.Item>
            <Dropdown.Separator className="my-1 h-px bg-line" />
            <Dropdown.Item
              className={cn(item, "text-danger")}
              onSelect={() => {
                signOut();
                router.push("/");
              }}
            >
              <SignOutIcon size={18} weight="duotone" /> Leave demo
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <ResetDemoDialog open={resetOpen} onOpenChange={setResetOpen} />
    </>
  );
}

function Header() {
  const pathname = usePathname();
  const unread = useDemo((s) => s.notifications.filter((n) => !n.read).length);
  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo href="/dashboard" />
        <nav className="hidden items-center gap-1 rounded-full bg-white p-1 shadow-clay-sm md:flex" aria-label="Main">
          {NAV.slice(0, 4).map((item) => {
            const active = item.match(pathname);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors", active ? "text-white" : "text-ink-soft hover:text-ink")}>
                {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <item.Icon size={18} weight={active ? "fill" : "regular"} className="relative" />
                <span className="relative">{item.label}</span>
                {item.href === "/notifications" && unread > 0 && <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">{unread}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/notifications" className="relative grid h-11 w-11 place-items-center rounded-full bg-white shadow-clay-sm md:hidden" aria-label={`Notifications, ${unread} unread`}>
            <BellIcon size={20} weight="bold" />
            {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-canvas bg-coral px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
          <Link href="/create" className="hidden lg:inline-flex">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-pill bg-pill px-3.5 text-[13px] font-semibold text-white shadow-[3px_3px_0_#7b5cf0] transition hover:-translate-y-0.5">
              <PlusCircleIcon size={16} weight="bold" /> Create plan
            </span>
          </Link>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

function MobileDock() {
  const pathname = usePathname();
  const unread = useDemo((s) => s.notifications.filter((n) => !n.read).length);
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[28px] border-2 border-ink bg-white/95 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-pop backdrop-blur md:hidden" aria-label="Main">
      <ul className="flex items-center justify-around">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className="relative flex min-w-14 flex-col items-center gap-0.5 rounded-2xl px-1 py-1">
                <span className={cn("grid h-9 w-12 place-items-center rounded-full transition-colors", active ? "bg-pill text-white" : "text-ink-soft")}>
                  <item.Icon size={20} weight={active ? "fill" : "regular"} />
                </span>
                <span className={cn("text-[10px] font-semibold", active ? "text-ink" : "text-muted")}>{item.label === "Import chat" ? "Import" : item.label}</span>
                {item.href === "/notifications" && unread > 0 && <span className="absolute right-1 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-coral" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <RequireSession>
      <div className="min-h-dvh pb-28 md:pb-12">
        <Header />
        {sub}
        <main id="main">{children}</main>
        <MobileDock />
        <AssistantWidget />
      </div>
    </RequireSession>
  );
}

export function PageHead({ kicker, title, subtitle, actions }: { kicker?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && <div className="mb-3">{kicker}</div>}
        <h1 className="text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[2.25rem]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[15px] font-medium text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
