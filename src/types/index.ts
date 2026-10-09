/**
 * Domain types for the frontend prototype.
 * Mirrors the data model in the project document (§19) so a real backend can replace
 * the browser store later without reshaping the UI.
 */

export type Tone = "purple" | "lavender" | "sun" | "coral" | "mint" | "sky" | "pink" | "cream";

export type IdeaIcon =
  | "bowling"
  | "football"
  | "movie"
  | "mountain"
  | "food"
  | "villa"
  | "music"
  | "game"
  | "beach"
  | "coffee"
  | "kart"
  | "party"
  | "sparkle";

/** §13.4 plan status machine. "voting" covers Propose + Decide. */
export type PlanStatus =
  | "voting"
  | "collecting"
  | "confirmed"
  | "not_confirmed"
  | "event_day"
  | "settling"
  | "completed";

export type MemberStatus = "interested" | "joining" | "paid";
export type VoteValue = 0 | 1 | 2;
export type IdeaSource = "manual" | "chat" | "voice" | "ai" | "offer";

export interface Person {
  id: string;
  name: string;
  tone: Tone;
  /** Demo-only UPI handle. Never a real VPA. */
  upiId: string;
  homeArea?: string;
}

export interface PlanMember {
  userId: string;
  status: MemberStatus;
  isRequired: boolean;
  joinedAt: string;
  interests?: string[];
}

export interface Idea {
  id: string;
  title: string;
  place: string;
  costPerPerson: number;
  timeNote: string;
  link?: string;
  note?: string;
  icon: IdeaIcon;
  tone: Tone;
  source: IdeaSource;
  /** userId of the member, or a venue name for offers. */
  proposedBy: string;
  createdAt: string;
  /** Supporter names found by the chat importer / voice room. */
  supporters?: string[];
}

export interface PrivateBudget {
  max: number;
  conditions: string[];
  updatedAt: string;
}

export interface FinalSlot {
  day: number;
  startHour: number;
  endHour: number;
}

export type PaymentStatus = "held" | "captured" | "released" | "failed";

export interface AdvancePayment {
  userId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  time: string; // "18:30"
  title: string;
  place?: string;
}

export type ArrivalState = "not_started" | "on_the_way" | "arrived" | "late";

export interface Arrival {
  state: ArrivalState;
  etaMinutes?: number;
  lateBy?: number;
  updatedAt: string;
}

export interface Photo {
  id: string;
  userId: string;
  /** data: URL (downscaled in the browser) or undefined for illustrated seed tiles. */
  src?: string;
  caption: string;
  tone: Tone;
  icon: IdeaIcon;
  createdAt: string;
}

export type BillCategory = "food" | "drink" | "alcohol";

export interface BillItem {
  id: string;
  name: string;
  qty: number;
  /** Line total in rupees. */
  price: number;
  category: BillCategory;
  selectedBy: string[];
}

export interface Bill {
  id: string;
  venue: string;
  paidBy: string;
  photo?: string;
  items: BillItem[];
  printedSubtotal: number;
  gst: number;
  serviceCharge: number;
  discount: number;
  removeServiceCharge: boolean;
  scannedAt: string;
  source: "demo-scan" | "manual";
}

export interface Expense {
  id: string;
  paidBy: string;
  amount: number;
  note: string;
  splitAmong: string[];
  createdAt: string;
}

export interface SettlementMark {
  key: string; // `${from}->${to}`
  paidAt: string;
}

export type ActivityKind =
  | "created"
  | "joined"
  | "idea"
  | "vote"
  | "veto"
  | "availability"
  | "budget"
  | "payment"
  | "confirmed"
  | "not_confirmed"
  | "voice"
  | "import"
  | "bill"
  | "settle"
  | "event"
  | "photo"
  | "offer";

export interface ActivityItem {
  id: string;
  at: string;
  actor?: string;
  kind: ActivityKind;
  text: string;
}

export interface VoiceLine {
  speaker: string;
  text: string;
  at: number; // seconds into the call
}

export interface VoiceSession {
  startedAt: string;
  endedAt?: string;
  lines: VoiceLine[];
  applied: boolean;
}

export interface Plan {
  id: string;
  title: string;
  icon: IdeaIcon;
  tone: Tone;
  area: string;
  description?: string;
  approxDate: string; // ISO date
  groupSize: number;
  minMembers: number;
  maxSeats: number;
  totalCost: number | null;
  organiserId: string;
  createdAt: string;
  status: PlanStatus;

  ideaDeadline: string;
  voteDeadline: string;
  paymentDeadline: string;

  members: PlanMember[];
  ideas: Idea[];
  /** votes[userId][ideaId] */
  votes: Record<string, Record<string, VoteValue>>;
  /** vetoes[userId] = ideaId (one per member per plan) */
  vetoes: Record<string, string>;
  submittedVotes: string[];
  /** Members whose first choice lost the last two plans (turn-based fairness). */
  priorityVoters: string[];

  /** Private: never rendered for anyone but the owner. Only aggregates leave the selectors. */
  budgets: Record<string, PrivateBudget>;
  /** availability[userId] = slot keys `${day}:${hour}` */
  availability: Record<string, string[]>;
  weekStart: string; // ISO date of grid column 0

  winnerIdeaId: string | null;
  winnerReason?: string;
  finalSlot: FinalSlot | null;
  finalPlace?: string;
  decidedAt?: string;

  payments: AdvancePayment[];
  confirmedAt?: string;
  notConfirmedAt?: string;

  schedule: ScheduleItem[];
  arrivals: Record<string, Arrival>;
  photos: Photo[];

  bill: Bill | null;
  expenses: Expense[];
  settlementsPaid: SettlementMark[];

  voice: VoiceSession | null;
  activity: ActivityItem[];
}

export type NotificationKind = "vote" | "payment" | "confirm" | "idea" | "bill" | "reminder" | "system" | "offer";

export interface AppNotification {
  id: string;
  planId?: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href: string;
}

export interface Preferences {
  reminders: boolean;
  paymentAlerts: boolean;
  voteAlerts: boolean;
  vibration: boolean;
  weeklyDigest: boolean;
}

export interface Session {
  userId: string;
  signedIn: boolean;
  interests: string[];
  prefs: Preferences;
}

export interface VenueOffer {
  id: string;
  planId: string;
  venue: string;
  text: string;
  pricePerPerson: number;
  sentAt: string;
}
