"use client";

import {
  BowlingBallIcon,
  CoffeeIcon,
  ConfettiIcon,
  FilmSlateIcon,
  ForkKnifeIcon,
  GameControllerIcon,
  HouseLineIcon,
  MountainsIcon,
  MusicNotesIcon,
  SoccerBallIcon,
  SparkleIcon,
  SteeringWheelIcon,
  UmbrellaIcon,
  type Icon,
} from "@phosphor-icons/react";
import { cn, initials } from "@/lib/format";
import type { IdeaIcon, Person, Tone } from "@/types";
import { toneBg, toneDeepHex } from "./tones";

export const IDEA_ICONS: Record<IdeaIcon, Icon> = {
  bowling: BowlingBallIcon,
  football: SoccerBallIcon,
  movie: FilmSlateIcon,
  mountain: MountainsIcon,
  food: ForkKnifeIcon,
  villa: HouseLineIcon,
  music: MusicNotesIcon,
  game: GameControllerIcon,
  beach: UmbrellaIcon,
  coffee: CoffeeIcon,
  kart: SteeringWheelIcon,
  party: ConfettiIcon,
  sparkle: SparkleIcon,
};

/** DESIGN.md §12.2 — 3D clay squircle tile. */
export function ArtTile({ icon, tone, size = 48, className, glyph }: { icon?: IdeaIcon; tone: Tone; size?: number; className?: string; glyph?: Icon }) {
  const Glyph = glyph ?? IDEA_ICONS[icon ?? "sparkle"];
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-[30%] shadow-clay-sm", toneBg[tone], className)} style={{ width: size, height: size }} aria-hidden>
      <span className="absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-white/45 blur-[2px]" />
      <Glyph size={size * 0.52} weight="duotone" color={toneDeepHex[tone]} className="relative drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
    </span>
  );
}

export function Avatar({ person, size = 36, ring, className }: { person?: Person; size?: number; ring?: boolean; className?: string }) {
  const tone = person?.tone ?? "cream";
  return (
    <span
      title={person?.name}
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-bold text-ink", toneBg[tone], ring ? "border-2 border-ink" : "border-2 border-white", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials(person?.name ?? "?")}
    </span>
  );
}

export function AvatarStack({ people, max = 5, size = 30 }: { people: (Person | undefined)[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((p, i) => (
        <Avatar key={p?.id ?? i} person={p} size={size} className={i ? "-ml-2" : ""} />
      ))}
      {extra > 0 && (
        <span className="-ml-2 grid place-items-center rounded-full border-2 border-white bg-pill text-[11px] font-bold text-white" style={{ width: size, height: size }}>
          +{extra}
        </span>
      )}
    </span>
  );
}

/** The stamp-and-check mark from the original index.html. */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 drop-shadow-[0_6px_10px_rgb(106_72_228/0.3)]">
      <defs>
        <linearGradient id="mk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a58cff" />
          <stop offset="1" stopColor="#6a48e4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#mk)" stroke="#1c1b2b" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="17" fill="#fff6e6" />
      <circle cx="32" cy="32" r="13" fill="none" stroke="#1c1b22" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M24.5 32.5l5 5 10-11" fill="none" stroke="#1c1b22" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Friendly mascot used by empty states and the auth billboard. */
export function Mascot({ size = 120, mood = "happy" }: { size?: number; mood?: "happy" | "think" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden className="animate-float">
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#1c1b2b" opacity="0.12" />
      <rect x="18" y="18" width="84" height="84" rx="30" fill="#c6b5f6" stroke="#1c1b2b" strokeWidth="3" />
      <rect x="26" y="22" width="60" height="22" rx="11" fill="#fff" opacity="0.45" />
      <circle cx="46" cy="58" r="6" fill="#1c1b2b" />
      <circle cx="74" cy="58" r="6" fill="#1c1b2b" />
      <circle cx="48" cy="56" r="2" fill="#fff" />
      <circle cx="76" cy="56" r="2" fill="#fff" />
      {mood === "happy" ? <path d="M48 74q12 10 24 0" stroke="#1c1b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" /> : <path d="M50 76h20" stroke="#1c1b2b" strokeWidth="3.5" strokeLinecap="round" />}
      <circle cx="36" cy="70" r="5" fill="#f9cbc9" />
      <circle cx="84" cy="70" r="5" fill="#f9cbc9" />
      <path d="M96 22l4-10 4 10 10 4-10 4-4 10-4-10-10-4z" fill="#fad47f" stroke="#1c1b2b" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
