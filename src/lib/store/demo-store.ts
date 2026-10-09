"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type {
  ActivityItem,
  AppNotification,
  Arrival,
  Bill,
  BillItem,
  Expense,
  Idea,
  IdeaIcon,
  Person,
  Photo,
  Plan,
  Preferences,
  PrivateBudget,
  Session,
  Tone,
  VenueOffer,
  VoiceSession,
  VoteValue,
} from "@/types";
import { buildSeed, ME, PEOPLE } from "@/lib/mock-data/seed";
import { pickWinner } from "@/lib/calc/voting";
import { bestSlot } from "@/lib/calc/availability";
import { nextJoinShare, paymentSummary } from "@/lib/calc/payments";
import { uid } from "@/lib/format";

export const STORAGE_KEY = "gep-demo-v1";

export interface CreatePlanInput {
  title: string;
  area: string;
  description?: string;
  approxDate: string;
  groupSize: number;
  minMembers: number;
  maxSeats: number;
  totalCost: number | null;
  ideaDeadline: string;
  voteDeadline: string;
  paymentDeadline: string;
  icon: IdeaIcon;
  tone: Tone;
}

export type IdeaInput = Pick<Idea, "title" | "place" | "costPerPerson" | "timeNote" | "icon" | "tone"> &
  Partial<Pick<Idea, "link" | "note" | "source" | "proposedBy" | "supporters">>;

export type PayOutcome = { ok: true; amount: number; confirmedNow: boolean } | { ok: false; reason: string };

interface DemoState {
  seededAt: string;
  session: Session;
  people: Record<string, Person>;
  plans: Record<string, Plan>;
  planOrder: string[];
  notifications: AppNotification[];
  offers: VenueOffer[];

  signIn: (name: string) => void;
  signOut: () => void;
  updateProfile: (p: { name?: string; upiId?: string; interests?: string[] }) => void;
  setPref: (key: keyof Preferences, value: boolean) => void;

  createPlan: (input: CreatePlanInput) => string;
  joinPlan: (planId: string, interests: string[]) => void;
  addIdea: (planId: string, idea: IdeaInput) => string | null;
  addIdeas: (planId: string, ideas: IdeaInput[], kind?: ActivityItem["kind"]) => number;
  removeIdea: (planId: string, ideaId: string) => void;

  castVote: (planId: string, ideaId: string, value: VoteValue) => void;
  submitVotes: (planId: string) => void;
  setVeto: (planId: string, ideaId: string | null) => void;
  closeVoting: (planId: string, mode?: "rule" | "random") => void;

  toggleSlot: (planId: string, key: string, on?: boolean) => void;
  setSlots: (planId: string, keys: string[]) => void;
  toggleRequired: (planId: string, userId: string) => void;

  saveBudget: (planId: string, budget: Omit<PrivateBudget, "updatedAt"> | null) => void;

  setMyIntent: (planId: string, status: "interested" | "joining") => void;
  joinAndPay: (planId: string, simulateFailure?: boolean) => PayOutcome;
  simulateMemberPayment: (planId: string) => string | null;
  simulateDeadline: (planId: string) => void;
  restartWithRunnerUp: (planId: string) => void;

  startEventDay: (planId: string) => void;
  finishEvent: (planId: string) => void;
  setArrival: (planId: string, userId: string, arrival: Omit<Arrival, "updatedAt">) => void;
  reportLate: (planId: string, minutes: number) => void;
  simulateArrivals: (planId: string) => void;
  addPhoto: (planId: string, photo: Omit<Photo, "id" | "createdAt">) => void;
  removePhoto: (planId: string, photoId: string) => void;

  setBill: (planId: string, bill: Bill | null) => void;
  updateBill: (planId: string, patch: Partial<Omit<Bill, "items">>) => void;
  updateBillItem: (planId: string, itemId: string, patch: Partial<BillItem>) => void;
  addBillItem: (planId: string) => void;
  removeBillItem: (planId: string, itemId: string) => void;
  toggleItemFor: (planId: string, itemId: string, userId: string) => void;

  addExpense: (planId: string, e: Omit<Expense, "id" | "createdAt">) => void;
  removeExpense: (planId: string, expenseId: string) => void;
  markSettlement: (planId: string, key: string, paid: boolean) => void;
  completePlan: (planId: string) => void;

  saveVoice: (planId: string, session: VoiceSession) => void;
  applyVoiceDecision: (planId: string, payload: { idea: IdeaInput; votes: Record<string, VoteValue>; notes: string[] }) => void;

  sendOffer: (offer: Omit<VenueOffer, "id" | "sentAt">) => void;

  markRead: (id: string) => void;
  markAllRead: () => void;
  tickDeadlines: (now?: number) => void;
  resetDemo: () => void;
}

function freshState() {
  const { plans, notifications } = buildSeed();
  return {
    seededAt: new Date().toISOString(),
    session: {
      userId: ME,
      signedIn: false,
      interests: [],
      prefs: { reminders: true, paymentAlerts: true, voteAlerts: true, vibration: true, weeklyDigest: false },
    } satisfies Session,
    people: Object.fromEntries(PEOPLE.map((p) => [p.id, p])),
    plans: Object.fromEntries(plans.map((p) => [p.id, p])),
    planOrder: plans.map((p) => p.id),
    notifications,
    offers: [] as VenueOffer[],
  };
}

const now = () => new Date().toISOString();

function log(plan: Plan, kind: ActivityItem["kind"], text: string, actor?: string) {
  plan.activity.unshift({ id: uid("act"), at: now(), actor, kind, text });
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 28) || "plan"
  );
}

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (err) {
      console.warn("Demo state could not be saved (storage full or blocked).", err);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const useDemo = create<DemoState>()(
  persist(
    (set, get) => {
      /** Clone-and-mutate helper keeps every action small and immutable. */
      const editPlan = (planId: string, fn: (plan: Plan, state: DemoState) => void) => {
        const plan = get().plans[planId];
        if (!plan) return;
        const draft = structuredClone(plan);
        fn(draft, get());
        set((s) => ({ plans: { ...s.plans, [planId]: draft } }));
      };
      const notify = (n: Omit<AppNotification, "id" | "createdAt" | "read">) =>
        set((s) => ({ notifications: [{ ...n, id: uid("ntf"), createdAt: now(), read: false }, ...s.notifications].slice(0, 60) }));

      const confirmPlan = (plan: Plan) => {
        plan.status = "confirmed";
        plan.confirmedAt = now();
        plan.payments.forEach((p) => {
          if (p.status === "held") p.status = "captured";
        });
        const s = paymentSummary(plan);
        log(plan, "confirmed", `Plan confirmed — ${s.paidCount} members paid. Held payments captured (simulated).`);
        notify({ planId: plan.id, kind: "confirm", title: `${plan.title} is confirmed! 🎉`, body: `${s.paidCount} members paid. Final share ${"₹" + s.finalShare}.`, href: `/p/${plan.id}/final` });
        if (get().session.prefs.vibration && typeof navigator !== "undefined" && "vibrate" in navigator) {
          try {
            navigator.vibrate?.([80, 40, 160]);
          } catch {
            /* unsupported */
          }
        }
      };

      const finishVoting = (plan: Plan, mode: "rule" | "random" = "rule") => {
        const result = pickWinner(plan, mode);
        if (!result.winner) return;
        plan.winnerIdeaId = result.winner.id;
        plan.winnerReason = result.reason;
        plan.decidedAt = now();
        const slot = bestSlot(plan);
        plan.finalSlot = slot ? { day: slot.day, startHour: slot.startHour, endHour: slot.endHour } : plan.finalSlot;
        plan.finalPlace = result.winner.place;
        plan.status = "collecting";
        if (new Date(plan.paymentDeadline).getTime() < Date.now() + 2 * 3600_000) {
          plan.paymentDeadline = new Date(Date.now() + 24 * 3600_000).toISOString();
        }
        log(plan, "vote", `Voting closed — ${result.winner.title} won. ${result.tie ? "Tie-breaker applied." : ""}`.trim());
        notify({ planId: plan.id, kind: "vote", title: `${result.winner.title} won the vote`, body: `${plan.title}: pay your share to lock your seat.`, href: `/p/${plan.id}/pay` });
      };

      return {
        ...freshState(),

        signIn: (name) =>
          set((s) => ({
            session: { ...s.session, signedIn: true },
            people: { ...s.people, [ME]: { ...s.people[ME], name: name.trim() } },
          })),
        signOut: () => set((s) => ({ session: { ...s.session, signedIn: false } })),
        updateProfile: ({ name, upiId, interests }) =>
          set((s) => ({
            people: { ...s.people, [ME]: { ...s.people[ME], ...(name ? { name: name.trim() } : {}), ...(upiId !== undefined ? { upiId } : {}) } },
            session: interests ? { ...s.session, interests } : s.session,
          })),
        setPref: (key, value) => set((s) => ({ session: { ...s.session, prefs: { ...s.session.prefs, [key]: value } } })),

        createPlan: (input) => {
          const existing = get().plans;
          let id = slugify(input.title);
          while (existing[id]) id = `${slugify(input.title)}-${Math.random().toString(36).slice(2, 5)}`;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const plan: Plan = {
            id,
            title: input.title.trim(),
            icon: input.icon,
            tone: input.tone,
            area: input.area.trim(),
            description: input.description?.trim(),
            approxDate: input.approxDate,
            groupSize: input.groupSize,
            minMembers: input.minMembers,
            maxSeats: input.maxSeats,
            totalCost: input.totalCost,
            organiserId: ME,
            createdAt: now(),
            status: "voting",
            ideaDeadline: input.ideaDeadline,
            voteDeadline: input.voteDeadline,
            paymentDeadline: input.paymentDeadline,
            members: [{ userId: ME, status: "interested", isRequired: false, joinedAt: now() }],
            ideas: [],
            votes: {},
            vetoes: {},
            submittedVotes: [],
            priorityVoters: [],
            budgets: {},
            availability: {},
            weekStart: today.toISOString(),
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
            activity: [{ id: uid("act"), at: now(), actor: ME, kind: "created", text: "created the plan" }],
          };
          set((s) => ({ plans: { ...s.plans, [id]: plan }, planOrder: [id, ...s.planOrder] }));
          return id;
        },

        joinPlan: (planId, interests) =>
          editPlan(planId, (plan) => {
            if (plan.members.some((m) => m.userId === ME)) return;
            plan.members.push({ userId: ME, status: "interested", isRequired: false, joinedAt: now(), interests });
            log(plan, "joined", "joined the plan", ME);
          }),

        addIdea: (planId, input) => {
          let id: string | null = null;
          editPlan(planId, (plan) => {
            id = uid("idea");
            plan.ideas.push({ id, createdAt: now(), source: "manual", proposedBy: ME, ...input });
            log(plan, input.source === "offer" ? "offer" : "idea", `added ${input.title}`, input.source === "offer" ? undefined : input.proposedBy ?? ME);
          });
          return id;
        },
        addIdeas: (planId, ideas, kind = "import") => {
          editPlan(planId, (plan) => {
            ideas.forEach((input) => plan.ideas.push({ id: uid("idea"), createdAt: now(), source: "chat", proposedBy: ME, ...input }));
            log(plan, kind, `imported ${ideas.length} idea${ideas.length === 1 ? "" : "s"} from a WhatsApp chat`, ME);
          });
          return ideas.length;
        },
        removeIdea: (planId, ideaId) =>
          editPlan(planId, (plan) => {
            plan.ideas = plan.ideas.filter((i) => i.id !== ideaId);
            Object.values(plan.votes).forEach((b) => delete b[ideaId]);
          }),

        castVote: (planId, ideaId, value) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "voting") return;
            plan.votes[ME] = { ...(plan.votes[ME] ?? {}), [ideaId]: value };
          }),
        submitVotes: (planId) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "voting") return;
            const first = !plan.submittedVotes.includes(ME);
            if (first) plan.submittedVotes.push(ME);
            log(plan, "vote", first ? "submitted votes" : "updated votes", ME);
          }),
        setVeto: (planId, ideaId) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "voting") return;
            if (ideaId) {
              plan.vetoes[ME] = ideaId;
              const idea = plan.ideas.find((i) => i.id === ideaId);
              log(plan, "veto", `A member used their veto on ${idea?.title ?? "an idea"}`);
            } else delete plan.vetoes[ME];
          }),
        closeVoting: (planId, mode = "rule") =>
          editPlan(planId, (plan) => {
            if (plan.status === "voting") finishVoting(plan, mode);
          }),

        toggleSlot: (planId, key, on) =>
          editPlan(planId, (plan) => {
            const mine = new Set(plan.availability[ME] ?? []);
            const next = on ?? !mine.has(key);
            if (next) mine.add(key);
            else mine.delete(key);
            plan.availability[ME] = [...mine];
          }),
        setSlots: (planId, keys) =>
          editPlan(planId, (plan) => {
            plan.availability[ME] = keys;
            log(plan, "availability", "updated free hours", ME);
          }),
        toggleRequired: (planId, userId) =>
          editPlan(planId, (plan) => {
            const m = plan.members.find((x) => x.userId === userId);
            if (m) m.isRequired = !m.isRequired;
          }),

        saveBudget: (planId, budget) =>
          editPlan(planId, (plan) => {
            if (budget) {
              const isNew = !plan.budgets[ME];
              plan.budgets[ME] = { ...budget, updatedAt: now() };
              if (isNew) log(plan, "budget", "set a private budget", ME);
            } else delete plan.budgets[ME];
          }),

        setMyIntent: (planId, status) =>
          editPlan(planId, (plan) => {
            const m = plan.members.find((x) => x.userId === ME);
            if (m && m.status !== "paid") m.status = status;
          }),

        joinAndPay: (planId, simulateFailure = false) => {
          const plan = get().plans[planId];
          if (!plan) return { ok: false, reason: "Plan not found." };
          if (!["collecting", "confirmed"].includes(plan.status)) return { ok: false, reason: "This plan is not collecting payments right now." };
          if (plan.payments.some((p) => p.userId === ME && (p.status === "held" || p.status === "captured"))) return { ok: false, reason: "You have already paid your share." };
          const s = paymentSummary(plan);
          if (s.seatsLeft <= 0) return { ok: false, reason: "All seats are taken." };
          if (simulateFailure) return { ok: false, reason: "The demo payment was declined (simulated failure). Nothing was held." };
          const amount = nextJoinShare(plan);
          let confirmedNow = false;
          editPlan(planId, (p) => {
            if (!p.members.some((m) => m.userId === ME)) p.members.push({ userId: ME, status: "paid", isRequired: false, joinedAt: now() });
            p.members.find((m) => m.userId === ME)!.status = "paid";
            const wasConfirmed = p.status === "confirmed";
            p.payments.push({ userId: ME, amount, status: wasConfirmed ? "captured" : "held", createdAt: now() });
            log(p, "payment", wasConfirmed ? "joined after confirmation — share reduced for everyone" : "joined and paid (held)", ME);
            if (!wasConfirmed && paymentSummary(p).reached) {
              confirmPlan(p);
              confirmedNow = true;
            }
          });
          return { ok: true, amount, confirmedNow };
        },

        simulateMemberPayment: (planId) => {
          const plan = get().plans[planId];
          if (!plan || !["collecting", "confirmed"].includes(plan.status)) return null;
          const paid = new Set(plan.payments.filter((p) => p.status === "held" || p.status === "captured").map((p) => p.userId));
          const next = plan.members.find((m) => m.userId !== ME && !paid.has(m.userId));
          if (!next || paymentSummary(plan).seatsLeft <= 0) return null;
          const amount = nextJoinShare(plan);
          editPlan(planId, (p) => {
            p.members.find((m) => m.userId === next.userId)!.status = "paid";
            const wasConfirmed = p.status === "confirmed";
            p.payments.push({ userId: next.userId, amount, status: wasConfirmed ? "captured" : "held", createdAt: now() });
            log(p, "payment", wasConfirmed ? "joined after confirmation — share reduced for everyone" : "joined and paid (held)", next.userId);
            if (!wasConfirmed && paymentSummary(p).reached) confirmPlan(p);
          });
          return next.userId;
        },

        simulateDeadline: (planId) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "collecting") return;
            plan.paymentDeadline = now();
            const s = paymentSummary(plan);
            if (s.reached) {
              confirmPlan(plan);
              return;
            }
            plan.status = "not_confirmed";
            plan.notConfirmedAt = now();
            plan.payments.forEach((p) => {
              if (p.status === "held") p.status = "released";
            });
            log(plan, "not_confirmed", `Not confirmed — only ${s.paidCount} of ${s.min} required members paid. All held payments released (simulated).`);
            notify({ planId, kind: "system", title: `${plan.title} was not confirmed`, body: `Fewer than ${s.min} members paid. Every held payment was released (simulated).`, href: `/p/${planId}/pay` });
          }),

        restartWithRunnerUp: (planId) =>
          editPlan(planId, (plan) => {
            const ranking = pickWinner(plan).ranking.filter((r) => r.ideaId !== plan.winnerIdeaId);
            const runner = plan.ideas.find((i) => i.id === ranking[0]?.ideaId);
            if (runner) {
              plan.winnerIdeaId = runner.id;
              plan.finalPlace = runner.place;
              plan.winnerReason = `Restarted with the runner-up idea, ${runner.title}.`;
            }
            plan.status = "collecting";
            plan.totalCost = runner ? runner.costPerPerson * plan.minMembers : plan.totalCost;
            plan.payments = [];
            plan.members.forEach((m) => (m.status = "interested"));
            plan.paymentDeadline = new Date(Date.now() + 48 * 3600_000).toISOString();
            log(plan, "payment", `Payment collection restarted${runner ? ` with ${runner.title}` : ""}`);
          }),

        startEventDay: (planId) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "confirmed") return;
            plan.status = "event_day";
            if (plan.schedule.length === 0) {
              const start = plan.finalSlot?.startHour ?? 18;
              const pad = (n: number) => String(n).padStart(2, "0");
              const winner = plan.ideas.find((i) => i.id === plan.winnerIdeaId);
              plan.schedule = [
                { id: uid("s"), time: `${pad(start - 1)}:30`, title: "Meet up", place: plan.area },
                { id: uid("s"), time: `${pad(start)}:00`, title: winner?.title ?? "Main event", place: plan.finalPlace },
                { id: uid("s"), time: `${pad(Math.min(23, start + 2))}:00`, title: "Dinner & wrap up" },
              ];
            }
            log(plan, "event", "Event day started");
          }),
        finishEvent: (planId) =>
          editPlan(planId, (plan) => {
            if (plan.status !== "event_day") return;
            plan.status = "settling";
            log(plan, "event", "Event finished — time to split the bill");
          }),
        setArrival: (planId, userId, arrival) =>
          editPlan(planId, (plan) => {
            plan.arrivals[userId] = { ...arrival, updatedAt: now() };
          }),
        reportLate: (planId, minutes) =>
          editPlan(planId, (plan) => {
            plan.arrivals[ME] = { state: "late", lateBy: minutes, updatedAt: now() };
            log(plan, "event", `will be ${minutes} minutes late`, ME);
          }),
        simulateArrivals: (planId) =>
          editPlan(planId, (plan) => {
            plan.members.forEach((m) => {
              if (m.userId === ME) return;
              const a = plan.arrivals[m.userId];
              if (!a || a.state === "not_started") plan.arrivals[m.userId] = { state: "on_the_way", etaMinutes: 18 + (m.userId.length % 3) * 6, updatedAt: now() };
              else if (a.state === "on_the_way" || a.state === "late") {
                const eta = (a.etaMinutes ?? a.lateBy ?? 10) - 10;
                plan.arrivals[m.userId] = eta <= 0 ? { state: "arrived", updatedAt: now() } : { ...a, state: "on_the_way", etaMinutes: eta, updatedAt: now() };
              }
            });
          }),
        addPhoto: (planId, photo) =>
          editPlan(planId, (plan) => {
            plan.photos.unshift({ ...photo, id: uid("ph"), createdAt: now() });
            if (plan.photos.length > 12) plan.photos.length = 12;
            log(plan, "photo", "added a photo", photo.userId);
          }),
        removePhoto: (planId, photoId) =>
          editPlan(planId, (plan) => {
            plan.photos = plan.photos.filter((p) => p.id !== photoId);
          }),

        setBill: (planId, bill) =>
          editPlan(planId, (plan) => {
            plan.bill = bill;
            if (bill) log(plan, "bill", `scanned the bill from ${bill.venue}`, ME);
          }),
        updateBill: (planId, patch) =>
          editPlan(planId, (plan) => {
            if (plan.bill) Object.assign(plan.bill, patch);
          }),
        updateBillItem: (planId, itemId, patch) =>
          editPlan(planId, (plan) => {
            const item = plan.bill?.items.find((i) => i.id === itemId);
            if (item) Object.assign(item, patch);
          }),
        addBillItem: (planId) =>
          editPlan(planId, (plan) => {
            plan.bill?.items.push({ id: uid("bi"), name: "New item", qty: 1, price: 0, category: "food", selectedBy: [] });
          }),
        removeBillItem: (planId, itemId) =>
          editPlan(planId, (plan) => {
            if (plan.bill) plan.bill.items = plan.bill.items.filter((i) => i.id !== itemId);
          }),
        toggleItemFor: (planId, itemId, userId) =>
          editPlan(planId, (plan) => {
            const item = plan.bill?.items.find((i) => i.id === itemId);
            if (!item) return;
            item.selectedBy = item.selectedBy.includes(userId) ? item.selectedBy.filter((x) => x !== userId) : [...item.selectedBy, userId];
          }),

        addExpense: (planId, e) =>
          editPlan(planId, (plan) => {
            plan.expenses.push({ ...e, id: uid("exp"), createdAt: now() });
            log(plan, "settle", `added an expense: ${e.note}`, e.paidBy);
          }),
        removeExpense: (planId, expenseId) =>
          editPlan(planId, (plan) => {
            plan.expenses = plan.expenses.filter((x) => x.id !== expenseId);
          }),
        markSettlement: (planId, key, paid) =>
          editPlan(planId, (plan) => {
            plan.settlementsPaid = plan.settlementsPaid.filter((s) => s.key !== key);
            if (paid) {
              plan.settlementsPaid.push({ key, paidAt: now() });
              log(plan, "settle", "marked a payment as settled");
            }
          }),
        completePlan: (planId) =>
          editPlan(planId, (plan) => {
            plan.status = "completed";
            log(plan, "settle", "Plan completed — summary ready");
          }),

        saveVoice: (planId, session) =>
          editPlan(planId, (plan) => {
            plan.voice = session;
          }),
        applyVoiceDecision: (planId, { idea, votes, notes }) =>
          editPlan(planId, (plan) => {
            let target = plan.ideas.find((i) => i.title.toLowerCase().includes(idea.title.toLowerCase().split(" ")[0]));
            if (!target) {
              target = { id: uid("idea"), createdAt: now(), source: "voice", proposedBy: idea.proposedBy ?? ME, ...idea };
              plan.ideas.push(target);
            }
            if (plan.status === "voting") {
              for (const [userId, v] of Object.entries(votes)) plan.votes[userId] = { ...(plan.votes[userId] ?? {}), [target.id]: v };
            }
            if (plan.voice) plan.voice.applied = true;
            log(plan, "voice", `Voice room decision added: ${target.title}${notes.length ? ` (${notes.join("; ")})` : ""}`);
          }),

        sendOffer: (offer) => {
          set((s) => ({ offers: [{ ...offer, id: uid("off"), sentAt: now() }, ...s.offers] }));
          get().addIdea(offer.planId, {
            title: offer.text,
            place: offer.venue,
            costPerPerson: offer.pricePerPerson,
            timeNote: "Venue offer",
            icon: "sparkle",
            tone: "sun",
            source: "offer",
            proposedBy: offer.venue,
            note: `Group offer from ${offer.venue}`,
          });
          const plan = get().plans[offer.planId];
          notify({ planId: offer.planId, kind: "offer", title: `New venue offer: ${offer.venue}`, body: `${offer.text} at ₹${offer.pricePerPerson} per person — added to ${plan?.title ?? "your plan"}.`, href: `/p/${offer.planId}` });
        },

        markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

        tickDeadlines: (t = Date.now()) => {
          const { plans } = get();
          for (const plan of Object.values(plans)) {
            if (plan.status === "voting" && new Date(plan.voteDeadline).getTime() <= t && plan.ideas.length > 0) get().closeVoting(plan.id);
            else if (plan.status === "collecting" && new Date(plan.paymentDeadline).getTime() <= t) get().simulateDeadline(plan.id);
          }
        },

        resetDemo: () => {
          const signedIn = get().session.signedIn;
          const myName = get().people[ME]?.name;
          const fresh = freshState();
          set({
            ...fresh,
            session: { ...fresh.session, signedIn },
            people: { ...fresh.people, [ME]: { ...fresh.people[ME], name: signedIn && myName ? myName : fresh.people[ME].name } },
          });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({
        seededAt: s.seededAt,
        session: s.session,
        people: s.people,
        plans: s.plans,
        planOrder: s.planOrder,
        notifications: s.notifications,
        offers: s.offers,
      }),
    },
  ),
);

// ── Hydration flag (client only) ────────────────────────────────────────────────────────
export const useHydration = create<{ hydrated: boolean; setHydrated: () => void }>((set) => ({
  hydrated: false,
  setHydrated: () => set({ hydrated: true }),
}));

// ── Selector hooks ─────────────────────────────────────────────────────────────────────
export const usePlan = (id: string) => useDemo((s) => s.plans[id]);
export const useMe = () => useDemo((s) => s.people[ME]);
export const usePeople = () => useDemo((s) => s.people);
export { ME };
