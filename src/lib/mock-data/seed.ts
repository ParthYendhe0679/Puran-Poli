import type { AppNotification, Idea, Person, Plan, PlanMember, VoteValue } from "@/types";
import { HOURS, slotKey } from "@/lib/calc/availability";

/**
 * Deterministic demo scenario. Times are relative to the moment the demo is (re)seeded so
 * countdowns are always live; names, amounts, votes and statuses never change between resets.
 */
export const ME = "u-me";

export const PEOPLE: Person[] = [
  { id: ME, name: "You", tone: "purple", upiId: "you@demo-upi", homeArea: "Andheri" },
  { id: "u-rohan", name: "Rohan", tone: "sun", upiId: "rohan@demo-upi", homeArea: "Borivali" },
  { id: "u-riya", name: "Riya", tone: "pink", upiId: "riya@demo-upi", homeArea: "Bandra" },
  { id: "u-aman", name: "Aman", tone: "mint", upiId: "aman@demo-upi", homeArea: "Andheri" },
  { id: "u-neha", name: "Neha", tone: "sky", upiId: "neha@demo-upi", homeArea: "Dadar" },
  { id: "u-kunal", name: "Kunal", tone: "coral", upiId: "kunal@demo-upi", homeArea: "Powai" },
  { id: "u-sneha", name: "Sneha", tone: "lavender", upiId: "sneha@demo-upi", homeArea: "Malad" },
  { id: "u-arjun", name: "Arjun", tone: "cream", upiId: "arjun@demo-upi", homeArea: "Goregaon" },
  { id: "u-priya", name: "Priya", tone: "mint", upiId: "priya@demo-upi", homeArea: "Juhu" },
  { id: "u-vikram", name: "Vikram", tone: "sky", upiId: "vikram@demo-upi", homeArea: "Thane" },
];

const H = 3600_000;
const D = 24 * H;

function iso(base: number, offset: number) {
  return new Date(base + offset).toISOString();
}

function dayStart(base: number, offsetDays = 0) {
  const d = new Date(base + offsetDays * D);
  d.setHours(0, 0, 0, 0);
  return d;
}

function members(base: number, ids: string[], paid: string[] = [], joining: string[] = [], required: string[] = []): PlanMember[] {
  return ids.map((id, i) => ({
    userId: id,
    status: paid.includes(id) ? "paid" : joining.includes(id) ? "joining" : "interested",
    isRequired: required.includes(id),
    joinedAt: iso(base, -(ids.length - i) * 17 * 60_000 - 6 * H),
  }));
}

function idea(base: number, partial: Omit<Idea, "createdAt" | "source"> & { source?: Idea["source"]; ago?: number }): Idea {
  const { ago = 5 * H, source = "manual", ...rest } = partial;
  return { ...rest, source, createdAt: iso(base, -ago) };
}

/** Seeds availability by weekday so "Saturday evening" wins regardless of today's date. */
function availabilityFor(base: number, weekStart: Date, ids: string[], pattern: (weekday: number, hour: number, memberIndex: number) => boolean) {
  const out: Record<string, string[]> = {};
  ids.forEach((id, mi) => {
    const slots: string[] = [];
    for (let day = 0; day < 7; day++) {
      const wd = new Date(weekStart.getTime() + day * D).getDay();
      for (const h of HOURS) if (pattern(wd, h, mi)) slots.push(slotKey(day, h));
    }
    out[id] = slots;
  });
  void base;
  return out;
}

function ballot(ideaIds: string[], values: VoteValue[]): Record<string, VoteValue> {
  return Object.fromEntries(ideaIds.map((id, i) => [id, values[i]]));
}

function dayIndexOf(weekStart: Date, weekday: number) {
  for (let i = 0; i < 7; i++) if (new Date(weekStart.getTime() + i * D).getDay() === weekday) return i;
  return 0;
}

export function buildSeed(base = Date.now()): { plans: Plan[]; notifications: AppNotification[] } {
  const week = dayStart(base);
  const weekIso = week.toISOString();

  // ── Plan 1: the main judging journey — deciding stage, organised by you ──────────────
  const p1Ids = [ME, "u-rohan", "u-riya", "u-aman", "u-neha", "u-kunal", "u-sneha", "u-arjun"];
  const p1Ideas: Idea[] = [
    idea(base, { id: "i-bowling", title: "Bowling night", place: "Infiniti Mall, Andheri West", costPerPerson: 600, timeNote: "Saturday evening", icon: "bowling", tone: "lavender", proposedBy: "u-rohan", note: "Two lanes, shoes included. Food court right next door.", link: "https://maps.google.com/?q=Infiniti+Mall+Andheri", ago: 9 * H }),
    idea(base, { id: "i-turf", title: "Turf football", place: "Hiranandani turf, Powai", costPerPerson: 350, timeNote: "Sunday 7 am", icon: "football", tone: "mint", proposedBy: "u-aman", note: "7-a-side, 2 hours. Bring your own studs.", ago: 8 * H }),
    idea(base, { id: "i-movie", title: "Movie + dinner", place: "PVR Juhu", costPerPerson: 450, timeNote: "Saturday 7 pm show", icon: "movie", tone: "sky", proposedBy: "u-riya", ago: 7 * H }),
    idea(base, { id: "i-kart", title: "Go-karting", place: "Kurla, Phoenix Marketcity", costPerPerson: 1200, timeNote: "Any evening", icon: "kart", tone: "coral", proposedBy: "u-kunal", note: "10-lap race + helmet.", ago: 6 * H }),
    idea(base, { id: "i-lonavala", title: "Lonavala day trip", place: "Lonavala (train from Dadar)", costPerPerson: 1500, timeNote: "Sunday, full day", icon: "mountain", tone: "sun", proposedBy: "u-neha", note: "Tiger Point + chikki shopping. Includes shared cab.", ago: 5 * H }),
  ];
  const ids1 = p1Ideas.map((i) => i.id);
  const plan1: Plan = {
    id: "andheri-weekend",
    title: "Weekend Hangout",
    icon: "party",
    tone: "lavender",
    area: "Andheri, Mumbai",
    description: "Finally doing something this weekend — vote before Friday night!",
    approxDate: dayStart(base, 1).toISOString(),
    groupSize: 8,
    minMembers: 6,
    maxSeats: 10,
    totalCost: null,
    organiserId: ME,
    createdAt: iso(base, -10 * H),
    status: "voting",
    ideaDeadline: iso(base, 3 * H),
    voteDeadline: iso(base, 20 * H),
    paymentDeadline: iso(base, 44 * H),
    members: members(base, p1Ids, [], [], ["u-riya"]),
    ideas: p1Ideas,
    votes: {
      "u-rohan": ballot(ids1, [2, 1, 1, 2, 1]),
      "u-riya": ballot(ids1, [1, 0, 2, 0, 1]),
      "u-aman": ballot(ids1, [2, 2, 0, 1, 0]),
      "u-neha": ballot(ids1, [2, 0, 1, 1, 2]),
      "u-kunal": ballot(ids1, [1, 2, 1, 2, 1]),
      "u-sneha": ballot(ids1, [2, 1, 2, 0, 1]),
    },
    vetoes: {},
    submittedVotes: ["u-rohan", "u-riya", "u-aman", "u-neha", "u-kunal", "u-sneha"],
    priorityVoters: ["u-riya"],
    budgets: {
      "u-rohan": { max: 2000, conditions: [], updatedAt: iso(base, -4 * H) },
      "u-riya": { max: 900, conditions: ["Home by 10 pm"], updatedAt: iso(base, -4 * H) },
      "u-aman": { max: 700, conditions: [], updatedAt: iso(base, -3 * H) },
      "u-neha": { max: 1500, conditions: ["Vegetarian food only"], updatedAt: iso(base, -3 * H) },
      "u-kunal": { max: 2500, conditions: [], updatedAt: iso(base, -2 * H) },
      "u-sneha": { max: 500, conditions: ["No alcohol"], updatedAt: iso(base, -2 * H) },
    },
    availability: availabilityFor(base, week, p1Ids.slice(1), (wd, h, mi) => {
      if (wd === 6) return h >= 17 && h <= 21 && mi !== 4 ? true : h >= 12 && h <= 15 && mi % 2 === 0;
      if (wd === 0) return (h >= 7 && h <= 10 && mi % 3 !== 0) || (h >= 18 && h <= 20 && mi < 4);
      if (wd === 5) return h >= 19 && h <= 22 && mi % 2 === 1;
      return h >= 20 && h <= 21 && mi === 2;
    }),
    weekStart: weekIso,
    winnerIdeaId: null,
    finalSlot: null,
    payments: [],
    schedule: [],
    arrivals: {},
    photos: [],
    bill: null,
    expenses: [],
    settlementsPaid: [],
    voice: null,
    activity: [
      { id: "a1", at: iso(base, -10 * H), actor: ME, kind: "created", text: "created the plan" },
      { id: "a2", at: iso(base, -9 * H), actor: "u-rohan", kind: "idea", text: "added Bowling night" },
      { id: "a3", at: iso(base, -8 * H), actor: "u-aman", kind: "idea", text: "added Turf football" },
      { id: "a4", at: iso(base, -5 * H), actor: "u-neha", kind: "idea", text: "added Lonavala day trip" },
      { id: "a5", at: iso(base, -3 * H), actor: "u-kunal", kind: "vote", text: "submitted votes" },
      { id: "a6", at: iso(base, -1.5 * H), actor: "u-sneha", kind: "budget", text: "set a private budget" },
      { id: "a7", at: iso(base, -40 * 60_000), actor: "u-riya", kind: "availability", text: "marked free hours" },
    ],
  };

  // ── Plan 2: collecting advance payments — 5 of 6 paid, your share completes it ───────
  const p2Ids = ["u-neha", ME, "u-rohan", "u-riya", "u-aman", "u-kunal", "u-sneha", "u-arjun"];
  const p2Ideas: Idea[] = [
    idea(base, { id: "i-villa", title: "Villa stay with pool", place: "Tungarli, Lonavala", costPerPerson: 2000, timeNote: "Sat 11 am → Sun 11 am", icon: "villa", tone: "sun", proposedBy: "u-neha", note: "4BHK villa, pool, BBQ. ₹12,000 for the whole villa.", ago: 3 * D }),
    idea(base, { id: "i-camp", title: "Pawna lake camping", place: "Pawna Lake", costPerPerson: 1600, timeNote: "Sat 4 pm → Sun 10 am", icon: "mountain", tone: "mint", proposedBy: "u-kunal", ago: 3 * D }),
    idea(base, { id: "i-resort", title: "Resort day pass", place: "Della, Lonavala", costPerPerson: 2800, timeNote: "Saturday", icon: "sparkle", tone: "coral", proposedBy: "u-rohan", ago: 3 * D }),
  ];
  const ids2 = p2Ideas.map((i) => i.id);
  const paid2 = ["u-neha", "u-rohan", "u-aman", "u-kunal", "u-sneha"];
  const week2 = dayStart(base, 3);
  const sat2 = dayIndexOf(week2, 6);
  const plan2: Plan = {
    id: "lonavala-villa",
    title: "Lonavala Villa Weekend",
    icon: "villa",
    tone: "sun",
    area: "Lonavala",
    description: "Pool villa, BBQ night and the monsoon view. Plan confirms when 6 of us pay.",
    approxDate: new Date(week2.getTime() + sat2 * D).toISOString(),
    groupSize: 8,
    minMembers: 6,
    maxSeats: 10,
    totalCost: 12000,
    organiserId: "u-neha",
    createdAt: iso(base, -4 * D),
    status: "collecting",
    ideaDeadline: iso(base, -3 * D),
    voteDeadline: iso(base, -1 * D),
    paymentDeadline: iso(base, 30 * H),
    members: members(base, p2Ids, paid2, ["u-arjun"]),
    ideas: p2Ideas,
    votes: Object.fromEntries(p2Ids.map((id, i) => [id, ballot(ids2, [2, i % 2 ? 1 : 0, i % 3 ? 0 : 1])])),
    vetoes: {},
    submittedVotes: p2Ids,
    priorityVoters: [],
    budgets: {},
    availability: {},
    weekStart: week2.toISOString(),
    winnerIdeaId: "i-villa",
    winnerReason: "Villa stay with pool has the highest score (16 vs 6 for Pawna lake camping).",
    finalSlot: { day: sat2, startHour: 11, endHour: 23 },
    finalPlace: "Tungarli, Lonavala",
    decidedAt: iso(base, -1 * D),
    payments: paid2.map((id, i) => ({ userId: id, amount: 2000, status: "held" as const, createdAt: iso(base, -20 * H + i * 2 * H) })),
    schedule: [],
    arrivals: {},
    photos: [],
    bill: null,
    expenses: [],
    settlementsPaid: [],
    voice: null,
    activity: [
      { id: "b1", at: iso(base, -4 * D), actor: "u-neha", kind: "created", text: "created the plan" },
      { id: "b2", at: iso(base, -1 * D), kind: "vote", text: "Voting closed — Villa stay with pool won" },
      { id: "b3", at: iso(base, -20 * H), actor: "u-neha", kind: "payment", text: "joined and paid (held)" },
      { id: "b4", at: iso(base, -14 * H), actor: "u-aman", kind: "payment", text: "joined and paid (held)" },
      { id: "b5", at: iso(base, -12 * H), actor: "u-sneha", kind: "payment", text: "joined and paid (held)" },
    ],
  };

  // ── Plan 3: event day — Friday turf football, happening today ────────────────────────
  const p3Ids = ["u-aman", ME, "u-rohan", "u-kunal", "u-arjun", "u-vikram", "u-neha"];
  const today = 0;
  const plan3: Plan = {
    id: "turf-friday",
    title: "Turf Football Night",
    icon: "football",
    tone: "mint",
    area: "Dadar",
    approxDate: dayStart(base).toISOString(),
    groupSize: 8,
    minMembers: 6,
    maxSeats: 10,
    totalCost: 2100,
    organiserId: "u-aman",
    createdAt: iso(base, -6 * D),
    status: "event_day",
    ideaDeadline: iso(base, -5 * D),
    voteDeadline: iso(base, -4 * D),
    paymentDeadline: iso(base, -2 * D),
    members: members(base, p3Ids, p3Ids),
    ideas: [idea(base, { id: "i-dadar-turf", title: "Turf football 7-a-side", place: "Kohinoor turf, Dadar West", costPerPerson: 350, timeNote: "Tonight 7 pm", icon: "football", tone: "mint", proposedBy: "u-aman", ago: 6 * D })],
    votes: Object.fromEntries(p3Ids.map((id) => [id, { "i-dadar-turf": 2 as VoteValue }])),
    vetoes: {},
    submittedVotes: p3Ids,
    priorityVoters: [],
    budgets: {},
    availability: {},
    weekStart: weekIso,
    winnerIdeaId: "i-dadar-turf",
    finalSlot: { day: today, startHour: 19, endHour: 22 },
    finalPlace: "Kohinoor turf, Dadar West",
    decidedAt: iso(base, -4 * D),
    payments: p3Ids.map((id) => ({ userId: id, amount: 350, status: "captured" as const, createdAt: iso(base, -3 * D) })),
    confirmedAt: iso(base, -2.5 * D),
    schedule: [
      { id: "s1", time: "18:30", title: "Meet at Dadar station (West exit)", place: "Dadar station" },
      { id: "s2", time: "19:00", title: "Kick-off · 7-a-side", place: "Kohinoor turf" },
      { id: "s3", time: "20:30", title: "Water break + team swap" },
      { id: "s4", time: "21:15", title: "Vada pav & cutting chai", place: "Shivaji Park" },
    ],
    arrivals: {
      "u-aman": { state: "arrived", updatedAt: iso(base, -10 * 60_000) },
      "u-rohan": { state: "on_the_way", etaMinutes: 12, updatedAt: iso(base, -5 * 60_000) },
      "u-kunal": { state: "on_the_way", etaMinutes: 25, updatedAt: iso(base, -8 * 60_000) },
      "u-arjun": { state: "late", lateBy: 15, updatedAt: iso(base, -15 * 60_000) },
    },
    photos: [
      { id: "ph1", userId: "u-aman", caption: "Booked the turf 🎉", tone: "mint", icon: "football", createdAt: iso(base, -2 * D) },
      { id: "ph2", userId: "u-rohan", caption: "New jerseys arrived", tone: "sun", icon: "sparkle", createdAt: iso(base, -1 * D) },
    ],
    bill: null,
    expenses: [],
    settlementsPaid: [],
    voice: null,
    activity: [
      { id: "c1", at: iso(base, -6 * D), actor: "u-aman", kind: "created", text: "created the plan" },
      { id: "c2", at: iso(base, -2.5 * D), kind: "confirmed", text: "Plan confirmed — 7 members paid" },
      { id: "c3", at: iso(base, -15 * 60_000), actor: "u-arjun", kind: "event", text: "will be 15 minutes late" },
    ],
  };

  // ── Plan 4: settling — birthday dinner bill split ────────────────────────────────────
  const p4Ids = ["u-aman", ME, "u-riya", "u-rohan", "u-neha", "u-priya"];
  const plan4: Plan = {
    id: "bandra-birthday",
    title: "Riya's Birthday Dinner",
    icon: "food",
    tone: "pink",
    area: "Bandra",
    approxDate: dayStart(base, -1).toISOString(),
    groupSize: 6,
    minMembers: 5,
    maxSeats: 8,
    totalCost: 3000,
    organiserId: "u-aman",
    createdAt: iso(base, -9 * D),
    status: "settling",
    ideaDeadline: iso(base, -8 * D),
    voteDeadline: iso(base, -7 * D),
    paymentDeadline: iso(base, -5 * D),
    members: members(base, p4Ids, p4Ids, [], ["u-riya"]),
    ideas: [
      idea(base, { id: "i-bistro", title: "Dinner at Bombay Bistro", place: "Hill Road, Bandra West", costPerPerson: 600, timeNote: "Thu 8 pm", icon: "food", tone: "pink", proposedBy: "u-aman", ago: 9 * D }),
      idea(base, { id: "i-rooftop", title: "Rooftop cafe", place: "Carter Road", costPerPerson: 900, timeNote: "Thu 8 pm", icon: "coffee", tone: "cream", proposedBy: "u-rohan", ago: 9 * D }),
    ],
    votes: Object.fromEntries(p4Ids.map((id, i) => [id, { "i-bistro": 2 as VoteValue, "i-rooftop": (i % 2) as VoteValue }])),
    vetoes: {},
    submittedVotes: p4Ids,
    priorityVoters: [],
    budgets: {},
    availability: {},
    weekStart: dayStart(base, -2).toISOString(),
    winnerIdeaId: "i-bistro",
    finalSlot: { day: 1, startHour: 20, endHour: 23 },
    finalPlace: "Bombay Bistro, Hill Road, Bandra West",
    decidedAt: iso(base, -7 * D),
    payments: p4Ids.map((id) => ({ userId: id, amount: 600, status: "captured" as const, createdAt: iso(base, -6 * D) })),
    confirmedAt: iso(base, -5.5 * D),
    schedule: [
      { id: "s1", time: "20:00", title: "Dinner reservation (table for 6)", place: "Bombay Bistro" },
      { id: "s2", time: "21:30", title: "Cake cutting 🎂" },
    ],
    arrivals: {},
    photos: [
      { id: "ph1", userId: "u-riya", caption: "Birthday girl!", tone: "pink", icon: "party", createdAt: iso(base, -20 * H) },
      { id: "ph2", userId: "u-neha", caption: "The cake 🎂", tone: "sun", icon: "sparkle", createdAt: iso(base, -19 * H) },
      { id: "ph3", userId: "u-rohan", caption: "Pizza round two", tone: "coral", icon: "food", createdAt: iso(base, -19 * H) },
    ],
    bill: {
      id: "bill-bistro",
      venue: "Bombay Bistro, Bandra",
      paidBy: "u-aman",
      items: [
        { id: "bi1", name: "Margherita pizza", qty: 1, price: 450, category: "food", selectedBy: ["u-aman", ME, "u-riya"] },
        { id: "bi2", name: "Farmhouse pizza", qty: 1, price: 520, category: "food", selectedBy: ["u-rohan", "u-neha", "u-priya"] },
        { id: "bi3", name: "Penne arrabbiata", qty: 1, price: 380, category: "food", selectedBy: ["u-riya"] },
        { id: "bi4", name: "Garlic bread", qty: 2, price: 360, category: "food", selectedBy: ["u-aman", ME, "u-riya", "u-rohan", "u-neha", "u-priya"] },
        { id: "bi5", name: "Virgin mojito", qty: 4, price: 560, category: "drink", selectedBy: [ME, "u-riya", "u-neha", "u-priya"] },
        { id: "bi6", name: "Draught beer", qty: 2, price: 600, category: "alcohol", selectedBy: ["u-aman", "u-rohan"] },
        { id: "bi7", name: "Brownie sundae", qty: 2, price: 340, category: "food", selectedBy: [] },
      ],
      printedSubtotal: 3210,
      gst: 160,
      serviceCharge: 321,
      discount: 0,
      removeServiceCharge: false,
      scannedAt: iso(base, -16 * H),
      source: "demo-scan",
    },
    expenses: [
      { id: "e1", paidBy: ME, amount: 900, note: "Birthday cake", splitAmong: ["u-aman", ME, "u-rohan", "u-neha", "u-priya"], createdAt: iso(base, -1 * D) },
      { id: "e2", paidBy: "u-rohan", amount: 480, note: "Cab back to Andheri", splitAmong: ["u-rohan", ME, "u-aman", "u-neha"], createdAt: iso(base, -15 * H) },
    ],
    settlementsPaid: [],
    voice: null,
    activity: [
      { id: "d1", at: iso(base, -9 * D), actor: "u-aman", kind: "created", text: "created the plan" },
      { id: "d2", at: iso(base, -5.5 * D), kind: "confirmed", text: "Plan confirmed — 6 members paid" },
      { id: "d3", at: iso(base, -16 * H), actor: "u-aman", kind: "bill", text: "scanned the bill from Bombay Bistro" },
      { id: "d4", at: iso(base, -15 * H), actor: "u-rohan", kind: "bill", text: "added the cab expense" },
    ],
  };

  // ── Plan 5: not confirmed — deadline passed, payments released ───────────────────────
  const p5Ids = ["u-kunal", ME, "u-rohan", "u-arjun", "u-vikram", "u-priya", "u-sneha", "u-neha"];
  const paid5 = ["u-kunal", "u-rohan", "u-vikram", "u-priya"];
  const plan5: Plan = {
    id: "goa-trip",
    title: "Goa Trip — December",
    icon: "beach",
    tone: "sky",
    area: "North Goa",
    approxDate: dayStart(base, 60).toISOString(),
    groupSize: 10,
    minMembers: 8,
    maxSeats: 12,
    totalCost: 48000,
    organiserId: "u-kunal",
    createdAt: iso(base, -12 * D),
    status: "not_confirmed",
    ideaDeadline: iso(base, -10 * D),
    voteDeadline: iso(base, -8 * D),
    paymentDeadline: iso(base, -2 * D),
    members: members(base, p5Ids, paid5),
    ideas: [idea(base, { id: "i-goa", title: "4 nights in Anjuna", place: "Anjuna, North Goa", costPerPerson: 6000, timeNote: "Dec 26 – 30", icon: "beach", tone: "sky", proposedBy: "u-kunal", ago: 12 * D })],
    votes: Object.fromEntries(p5Ids.map((id) => [id, { "i-goa": 2 as VoteValue }])),
    vetoes: {},
    submittedVotes: p5Ids,
    priorityVoters: [],
    budgets: {},
    availability: {},
    weekStart: weekIso,
    winnerIdeaId: "i-goa",
    finalSlot: null,
    finalPlace: "Anjuna, North Goa",
    decidedAt: iso(base, -8 * D),
    payments: paid5.map((id) => ({ userId: id, amount: 6000, status: "released" as const, createdAt: iso(base, -5 * D) })),
    notConfirmedAt: iso(base, -2 * D),
    schedule: [],
    arrivals: {},
    photos: [],
    bill: null,
    expenses: [],
    settlementsPaid: [],
    voice: null,
    activity: [
      { id: "g1", at: iso(base, -12 * D), actor: "u-kunal", kind: "created", text: "created the plan" },
      { id: "g2", at: iso(base, -2 * D), kind: "not_confirmed", text: "Not confirmed — only 4 of 8 required members paid. All held payments released." },
    ],
  };

  // ── Plan 6: completed — everything settled, summary ready ────────────────────────────
  const p6Ids = [ME, "u-priya", "u-riya", "u-sneha", "u-neha", "u-vikram"];
  const plan6: Plan = {
    id: "juhu-sunset",
    title: "Juhu Sunset & Pav Bhaji",
    icon: "beach",
    tone: "coral",
    area: "Juhu",
    approxDate: dayStart(base, -14).toISOString(),
    groupSize: 6,
    minMembers: 4,
    maxSeats: 8,
    totalCost: 1800,
    organiserId: ME,
    createdAt: iso(base, -18 * D),
    status: "completed",
    ideaDeadline: iso(base, -17 * D),
    voteDeadline: iso(base, -16.5 * D),
    paymentDeadline: iso(base, -16 * D),
    members: members(base, p6Ids, p6Ids),
    ideas: [
      idea(base, { id: "i-juhu", title: "Sunset + pav bhaji", place: "Juhu Beach", costPerPerson: 300, timeNote: "Sunday 5 pm", icon: "beach", tone: "coral", proposedBy: "u-priya", ago: 18 * D }),
      idea(base, { id: "i-carter", title: "Carter Road walk", place: "Carter Road", costPerPerson: 200, timeNote: "Sunday 6 pm", icon: "coffee", tone: "cream", proposedBy: "u-riya", ago: 18 * D }),
      idea(base, { id: "i-arcade", title: "Arcade games", place: "Timezone, Juhu", costPerPerson: 700, timeNote: "Sunday 4 pm", icon: "game", tone: "purple", proposedBy: "u-vikram", ago: 18 * D }),
    ],
    votes: Object.fromEntries(p6Ids.map((id, i) => [id, { "i-juhu": 2 as VoteValue, "i-carter": (i % 2) as VoteValue, "i-arcade": (i % 3 === 0 ? 2 : 0) as VoteValue }])),
    vetoes: {},
    submittedVotes: p6Ids,
    priorityVoters: [],
    budgets: {},
    availability: {},
    weekStart: dayStart(base, -16).toISOString(),
    winnerIdeaId: "i-juhu",
    finalSlot: { day: 2, startHour: 17, endHour: 20 },
    finalPlace: "Juhu Beach (near Chowpatty stalls)",
    decidedAt: iso(base, -16.4 * D),
    payments: p6Ids.map((id) => ({ userId: id, amount: 300, status: "captured" as const, createdAt: iso(base, -16.2 * D) })),
    confirmedAt: iso(base, -16.1 * D),
    schedule: [
      { id: "s1", time: "17:00", title: "Meet at Juhu Chowpatty" },
      { id: "s2", time: "18:20", title: "Sunset photos 🌅" },
      { id: "s3", time: "19:00", title: "Pav bhaji at the stalls" },
    ],
    arrivals: {},
    photos: [
      { id: "ph1", userId: ME, caption: "Golden hour", tone: "sun", icon: "beach", createdAt: iso(base, -14 * D) },
      { id: "ph2", userId: "u-priya", caption: "Squad photo", tone: "lavender", icon: "party", createdAt: iso(base, -14 * D) },
      { id: "ph3", userId: "u-vikram", caption: "Best pav bhaji in town", tone: "coral", icon: "food", createdAt: iso(base, -14 * D) },
      { id: "ph4", userId: "u-sneha", caption: "Kulfi break", tone: "pink", icon: "sparkle", createdAt: iso(base, -14 * D) },
    ],
    bill: null,
    expenses: [
      { id: "e1", paidBy: "u-priya", amount: 1260, note: "Pav bhaji + drinks", splitAmong: p6Ids, createdAt: iso(base, -14 * D) },
      { id: "e2", paidBy: ME, amount: 360, note: "Kulfi for everyone", splitAmong: p6Ids, createdAt: iso(base, -14 * D) },
    ],
    settlementsPaid: [
      { key: "u-riya->u-priya", paidAt: iso(base, -13 * D) },
      { key: "u-sneha->u-priya", paidAt: iso(base, -13 * D) },
      { key: "u-neha->u-priya", paidAt: iso(base, -13 * D) },
      { key: "u-vikram->u-priya", paidAt: iso(base, -13 * D) },
      { key: "u-vikram->u-me", paidAt: iso(base, -13 * D) },
      { key: "u-neha->u-me", paidAt: iso(base, -13 * D) },
      { key: "u-sneha->u-me", paidAt: iso(base, -13 * D) },
      { key: "u-riya->u-me", paidAt: iso(base, -13 * D) },
    ],
    voice: null,
    activity: [
      { id: "j1", at: iso(base, -18 * D), actor: ME, kind: "created", text: "created the plan" },
      { id: "j2", at: iso(base, -16.4 * D), kind: "vote", text: "Voting closed — Sunset + pav bhaji won" },
      { id: "j3", at: iso(base, -16.1 * D), kind: "confirmed", text: "Plan confirmed — 6 members paid" },
      { id: "j4", at: iso(base, -14 * D), kind: "event", text: "Event day" },
      { id: "j5", at: iso(base, -13 * D), kind: "settle", text: "All payments settled" },
    ],
  };

  const notifications: AppNotification[] = [
    { id: "n1", planId: "lonavala-villa", kind: "payment", title: "5 of 6 members have paid", body: "Lonavala Villa Weekend needs 1 more member. Your share is ₹2,000 (held, not charged).", createdAt: iso(base, -30 * 60_000), read: false, href: "/p/lonavala-villa/pay" },
    { id: "n2", planId: "andheri-weekend", kind: "vote", title: "Voting closes tomorrow", body: "Weekend Hangout: you have not voted yet. Results unlock after you vote.", createdAt: iso(base, -55 * 60_000), read: false, href: "/p/andheri-weekend/vote" },
    { id: "n3", planId: "bandra-birthday", kind: "bill", title: "Select your items", body: "Aman scanned the Bombay Bistro bill. Pick what you had so the split is exact.", createdAt: iso(base, -16 * H), read: false, href: "/p/bandra-birthday/bill" },
    { id: "n4", planId: "turf-friday", kind: "reminder", title: "Turf tonight at 7 pm", body: "Meet at Dadar station (West exit) at 6:30 pm.", createdAt: iso(base, -2 * H), read: true, href: "/p/turf-friday/event" },
    { id: "n5", planId: "goa-trip", kind: "system", title: "Goa Trip was not confirmed", body: "Only 4 of 8 required members paid. Every held payment was released (simulated).", createdAt: iso(base, -2 * D), read: true, href: "/p/goa-trip/pay" },
  ];

  return { plans: [plan1, plan2, plan3, plan4, plan5, plan6], notifications };
}
