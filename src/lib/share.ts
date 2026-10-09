import type { Plan } from "@/types";
import { slotLabel, slotStart } from "@/lib/calc/availability";
import { paymentSummary } from "@/lib/calc/payments";
import { formatINR } from "@/lib/format";

/** UPI deep link (§15). Built only from demo data; nothing is sent anywhere. */
export function upiLink(opts: { vpa: string; name: string; amount: number; note: string }): string {
  const p = new URLSearchParams({ pa: opts.vpa, pn: opts.name, am: String(Math.round(opts.amount)), cu: "INR", tn: opts.note.slice(0, 40) });
  return `upi://pay?${p.toString()}`;
}

export function planUrl(planId: string, path = ""): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/p/${planId}${path}`;
}

export function joinUrl(planId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${origin}/join/${planId}`;
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function finalPlanText(plan: Plan): string {
  const winner = plan.ideas.find((i) => i.id === plan.winnerIdeaId);
  const s = paymentSummary(plan);
  const when = plan.finalSlot ? slotLabel(plan, plan.finalSlot) : "Time to be decided";
  return [
    `✅ ${plan.title} is confirmed!`,
    winner ? `🎯 ${winner.title}` : "",
    `📍 ${plan.finalPlace ?? winner?.place ?? plan.area}`,
    `🗓 ${when}`,
    `💸 ${formatINR(s.finalShare)} per person · ${s.paidCount} going`,
    `Plan: ${planUrl(plan.id, "/final")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function eventWindow(plan: Plan): { start: Date; end: Date } {
  if (plan.finalSlot) {
    const start = slotStart(plan, plan.finalSlot);
    const end = new Date(start);
    end.setHours(plan.finalSlot.endHour);
    return { start, end };
  }
  const start = new Date(plan.approxDate);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(21);
  return { start, end };
}

/** Builds a standards-compliant .ics file entirely in the browser. */
export function buildIcs(plan: Plan): string {
  const winner = plan.ideas.find((i) => i.id === plan.winnerIdeaId);
  const { start, end } = eventWindow(plan);
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Group Event Planner//Prototype//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${plan.id}@group-event-planner.demo`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(`${plan.title}${winner ? ` — ${winner.title}` : ""}`)}`,
    `LOCATION:${esc(plan.finalPlace ?? winner?.place ?? plan.area)}`,
    `DESCRIPTION:${esc(`Confirmed group plan. Details: ${planUrl(plan.id, "/final")}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(plan: Plan): string {
  const winner = plan.ideas.find((i) => i.id === plan.winnerIdeaId);
  const { start, end } = eventWindow(plan);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: `${plan.title}${winner ? ` — ${winner.title}` : ""}`,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    location: plan.finalPlace ?? winner?.place ?? plan.area,
    details: `Confirmed group plan: ${planUrl(plan.id, "/final")}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Downscales an image file in the browser so it fits in localStorage. */
export function downscaleImage(file: File, maxSize = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be read as an image."));
    };
    img.src = url;
  });
}
