import type { IdeaIcon, Tone } from "@/types";

/**
 * WhatsApp chat import — a local, keyword-based parser (the documented fallback in §14.3).
 * Runs entirely in the browser. The file is never uploaded and its text is treated as
 * untrusted: it is only ever rendered as plain text, never as HTML.
 */

export interface ChatMessage {
  date: string;
  time: string;
  sender: string;
  text: string;
}

export interface ExtractedIdea {
  key: string;
  title: string;
  place: string;
  costPerPerson: number;
  proposedBy: string;
  likedBy: string[];
  dislikedBy: string[];
  mentions: number;
  icon: IdeaIcon;
  tone: Tone;
  firstQuote: string;
}

export interface ChatInsights {
  totalLines: number;
  messages: number;
  kept: number;
  removed: number;
  participants: string[];
  ideas: ExtractedIdea[];
  timesMentioned: { by: string; text: string }[];
  alreadyJoining: string[];
  budgetHints: { by: string; max: number }[];
  undecided: string | null;
  format: "android" | "ios" | "mixed" | "unknown";
}

// Android: "12/10/26, 9:41 pm - Rohan: text"  ·  iOS: "[12/10/26, 9:41:05 PM] Rohan: text"
const ANDROID = /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[aApP]\.?\s?[mM]\.?)?)\s+-\s+([^:]+?):\s([\s\S]*)$/;
const IOS = /^‎?\[(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[aApP]\.?\s?[mM]\.?)?)\]\s+([^:]+?):\s([\s\S]*)$/;
const SYSTEM_ANDROID = /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+\d{1,2}:\d{2}/;

const NOISE = [/<media omitted>/i, /this message was deleted/i, /you deleted this message/i, /image omitted/i, /sticker omitted/i, /video omitted/i, /gif omitted/i, /audio omitted/i, /^null$/i, /messages and calls are end-to-end encrypted/i];
const SHORT = /^(ok+|okay|k|haha+|hehe+|lol+|\?+|!+|hmm+|yes|no|ya+|ha+|👍|😂+|🤣+|done|sure)$/i;

interface Catalog {
  key: string;
  words: RegExp;
  title: string;
  icon: IdeaIcon;
  tone: Tone;
  defaultCost: number;
}

const CATALOG: Catalog[] = [
  { key: "bowling", words: /\bbowling\b/i, title: "Bowling", icon: "bowling", tone: "lavender", defaultCost: 600 },
  { key: "turf", words: /\b(turf|football|futsal)\b/i, title: "Turf football", icon: "football", tone: "mint", defaultCost: 350 },
  { key: "movie", words: /\b(movie|pvr|inox|cinema|film)\b/i, title: "Movie", icon: "movie", tone: "sky", defaultCost: 450 },
  { key: "lonavala", words: /\b(lonavala|lonavla|khandala)\b/i, title: "Lonavala day trip", icon: "mountain", tone: "sun", defaultCost: 1500 },
  { key: "karting", words: /\b(go[- ]?kart(ing)?|karting)\b/i, title: "Go-karting", icon: "kart", tone: "coral", defaultCost: 1200 },
  { key: "cafe", words: /\b(cafe|café|brunch)\b/i, title: "Cafe hangout", icon: "coffee", tone: "cream", defaultCost: 500 },
  { key: "karaoke", words: /\bkaraoke\b/i, title: "Karaoke night", icon: "music", tone: "pink", defaultCost: 700 },
  { key: "gaming", words: /\b(gaming|arcade|timezone|smaaash)\b/i, title: "Gaming arcade", icon: "game", tone: "purple", defaultCost: 800 },
  { key: "beach", words: /\b(beach|marine drive|chowpatty)\b/i, title: "Beach evening", icon: "beach", tone: "sky", defaultCost: 300 },
  { key: "trek", words: /\b(trek|hike|hiking)\b/i, title: "Monsoon trek", icon: "mountain", tone: "mint", defaultCost: 900 },
  { key: "dinner", words: /\b(dinner|biryani|restaurant|pizza)\b/i, title: "Group dinner", icon: "food", tone: "coral", defaultCost: 700 },
];

const PLACES = ["Andheri", "Bandra", "Juhu", "Powai", "Lokhandwala", "Dadar", "Kurla", "Lonavala", "Colaba", "Malad", "Goregaon", "Borivali", "Vashi", "Thane", "Versova", "Worli", "Lower Parel"];
const POSITIVE = /\b(yes|yess+|haan|ha+n|done|i'?m in|count me|in!?|sahi|chalega|chalo|let'?s go|love|great|perfect|best|\+1|agreed|sounds good|i'?m up)\b|👍|🔥|❤️|🙌/i;
const NEGATIVE = /\b(no+|nahi|nah|nope|pass|skip|not (?:for|into)|too (?:far|expensive)|mehenga|expensive|boring|can'?t)\b|👎/i;
const DAYS = /\b(mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?|weekend|tonight|tomorrow|kal)\b/i;
const TIME = /\b(after|before|by|at)\s+\d{1,2}(\s?(am|pm))?\b|\b\d{1,2}\s?(am|pm)\b/i;
const JOINING = /\b(i'?m in|count me in|i'?ll come|main aaunga|main aaungi|pakka aa raha|confirm from my side)\b/i;
const BUDGET = /(?:can'?t|cannot|won'?t)\s+spend\s+more\s+than\s+(?:rs\.?|₹|inr)?\s?(\d{3,5})|budget\s+(?:is\s+)?(?:max\s+)?(?:rs\.?|₹|inr)?\s?(\d{3,5})|max\s+(?:rs\.?|₹)?\s?(\d{3,5})\s+(?:for me|only)/i;
const COST = /(?:₹|rs\.?|inr)\s?(\d{2,5})|(\d{2,5})\s?(?:rs|rupees|\/-|per head|per person|each)/i;

export const MAX_CHAT_BYTES = 5 * 1024 * 1024;

export function validateChatFile(file: File): string | null {
  if (!/\.txt$/i.test(file.name)) return "Please choose the .txt file that WhatsApp creates (Export chat → Without media).";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_CHAT_BYTES) return "This file is larger than 5 MB. Export the chat without media and try again.";
  return null;
}

export function parseMessages(raw: string): { messages: ChatMessage[]; totalLines: number; format: ChatInsights["format"] } {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  const messages: ChatMessage[] = [];
  let android = 0;
  let ios = 0;
  for (const rawLine of lines) {
    const line = rawLine.replace(/[‎‏‪-‮]/g, "").trimEnd();
    if (!line) continue;
    const m = IOS.exec(line) ?? ANDROID.exec(line);
    if (m) {
      if (line.startsWith("[")) ios++;
      else android++;
      messages.push({ date: m[1], time: m[2], sender: m[3].trim(), text: m[4].trim() });
    } else if (SYSTEM_ANDROID.test(line)) {
      // System line like "12/10/26, 9:40 pm - Rohan joined" — no sender, skip.
      continue;
    } else if (messages.length) {
      // Continuation of a multi-line message.
      messages[messages.length - 1].text += `\n${line.trim()}`;
    }
  }
  const format = android && ios ? "mixed" : android ? "android" : ios ? "ios" : "unknown";
  return { messages, totalLines: lines.length, format };
}

export function cleanMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => {
    const t = m.text.trim();
    if (!t) return false;
    if (NOISE.some((r) => r.test(t))) return false;
    if (SHORT.test(t)) return false;
    if (/ (joined|left|was added|added .+|removed .+|changed the subject|changed this group's icon)$/i.test(t)) return false;
    return true;
  });
}

function detectPlace(text: string): string | null {
  for (const p of PLACES) if (new RegExp(`\\b${p}\\b`, "i").test(text)) return p;
  return null;
}

function detectCost(text: string): number | null {
  const m = COST.exec(text);
  if (!m) return null;
  const n = Number(m[1] ?? m[2]);
  return n >= 50 && n <= 50000 ? n : null;
}

export function analyseChat(raw: string): ChatInsights {
  const { messages, totalLines, format } = parseMessages(raw);
  const kept = cleanMessages(messages).slice(-400);
  const participants = [...new Set(messages.map((m) => m.sender))];

  const ideas = new Map<string, ExtractedIdea>();
  const lastIdeaAt: { key: string; index: number }[] = [];

  kept.forEach((msg, index) => {
    const matched = CATALOG.filter((c) => c.words.test(msg.text));
    const place = detectPlace(msg.text);
    const cost = detectCost(msg.text);
    for (const c of matched) {
      const existing = ideas.get(c.key);
      if (!existing) {
        ideas.set(c.key, {
          key: c.key,
          title: c.title,
          place: place && !c.title.toLowerCase().includes(place.toLowerCase()) ? place : "",
          costPerPerson: cost ?? c.defaultCost,
          proposedBy: msg.sender,
          likedBy: [],
          dislikedBy: [],
          mentions: 1,
          icon: c.icon,
          tone: c.tone,
          firstQuote: msg.text.slice(0, 140),
        });
      } else {
        existing.mentions++;
        if (!existing.place && place && !existing.title.toLowerCase().includes(place.toLowerCase())) existing.place = place;
        if (cost) existing.costPerPerson = cost;
        const pos = POSITIVE.test(msg.text);
        const neg = NEGATIVE.test(msg.text);
        if (msg.sender !== existing.proposedBy) {
          if (neg && !pos) addUnique(existing.dislikedBy, msg.sender, existing.likedBy);
          else if (pos) addUnique(existing.likedBy, msg.sender, existing.dislikedBy);
        }
      }
      lastIdeaAt.push({ key: c.key, index });
    }
    if (matched.length === 0) {
      // A short reaction right after an idea counts as support or rejection.
      const recent = lastIdeaAt.filter((l) => index - l.index <= 3).pop();
      if (recent) {
        const idea = ideas.get(recent.key)!;
        if (msg.sender !== idea.proposedBy) {
          if (NEGATIVE.test(msg.text) && !POSITIVE.test(msg.text)) addUnique(idea.dislikedBy, msg.sender, idea.likedBy);
          else if (POSITIVE.test(msg.text)) addUnique(idea.likedBy, msg.sender, idea.dislikedBy);
        }
      }
    }
  });

  const timesMentioned = kept
    .filter((m) => DAYS.test(m.text) && (TIME.test(m.text) || /\b(sat|sun|saturday|sunday|weekend)\b/i.test(m.text)))
    .slice(-6)
    .map((m) => ({ by: m.sender, text: m.text.slice(0, 90) }));

  const alreadyJoining = [...new Set(kept.filter((m) => JOINING.test(m.text)).map((m) => m.sender))];

  const budgetHints: { by: string; max: number }[] = [];
  for (const m of kept) {
    const b = BUDGET.exec(m.text);
    if (b) budgetHints.push({ by: m.sender, max: Number(b[1] ?? b[2] ?? b[3]) });
  }

  const sat = kept.filter((m) => /\b(sat|saturday)\b/i.test(m.text)).length;
  const sun = kept.filter((m) => /\b(sun|sunday)\b/i.test(m.text)).length;
  let undecided: string | null = null;
  if (sat > 0 && sun > 0) undecided = "Saturday or Sunday is not decided yet.";
  else if (ideas.size > 1) undecided = "The group has not picked one idea yet.";

  const sorted = [...ideas.values()].sort((a, b) => b.likedBy.length - a.likedBy.length || b.mentions - a.mentions);
  return {
    totalLines,
    messages: messages.length,
    kept: kept.length,
    removed: messages.length - kept.length,
    participants,
    ideas: sorted,
    timesMentioned,
    alreadyJoining,
    budgetHints,
    undecided,
    format,
  };
}

function addUnique(list: string[], name: string, other: string[]) {
  if (!list.includes(name)) list.push(name);
  const i = other.indexOf(name);
  if (i >= 0) other.splice(i, 1);
}

/** Bundled sample export (Android format) so judges can try the flow instantly. */
export const SAMPLE_CHAT = `09/10/26, 8:02 pm - Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
09/10/26, 8:03 pm - Rohan created group "Weekend scenes 🎳"
09/10/26, 8:04 pm - Rohan: Guys this weekend kuch plan karte hai?
09/10/26, 8:04 pm - Riya: haan pls, it's been forever
09/10/26, 8:05 pm - Rohan: bowling chalein? Andheri wala, around ₹600 per head
09/10/26, 8:05 pm - Aman: yes bowling 🔥
09/10/26, 8:06 pm - Neha: I'm in
09/10/26, 8:06 pm - Kunal: ok
09/10/26, 8:07 pm - Kunal: what about turf football at Powai? 350 each
09/10/26, 8:07 pm - Aman: turf sahi hai but sunday morning only
09/10/26, 8:08 pm - Riya: nahi yaar turf not for me 😅
09/10/26, 8:08 pm - Sneha: <Media omitted>
09/10/26, 8:09 pm - Sneha: movie at PVR Juhu also an option na
09/10/26, 8:09 pm - Riya: movie sounds good!
09/10/26, 8:10 pm - Rohan: haha
09/10/26, 8:10 pm - Neha: or Lonavala day trip? monsoon is still on
09/10/26, 8:11 pm - Kunal: Lonavala too far for one day
09/10/26, 8:11 pm - Sneha: honestly I can't spend more than ₹500 this month
09/10/26, 8:12 pm - Aman: bowling is cheaper than lonavala anyway
09/10/26, 8:12 pm - Riya: bowling is fine, but only after 6 pm on saturday
09/10/26, 8:13 pm - Neha: saturday works for me
09/10/26, 8:13 pm - Kunal: sunday better for me tbh
09/10/26, 8:14 pm - This message was deleted
09/10/26, 8:14 pm - Arjun: count me in for bowling
09/10/26, 8:15 pm - Rohan: so bowling saturday 6 pm?
09/10/26, 8:15 pm - Aman: 👍
09/10/26, 8:16 pm - Sneha: love the bowling idea
09/10/26, 8:16 pm - Kunal: fine but saturday or sunday decide karo
09/10/26, 8:17 pm - Riya: someone make a poll 😩
09/10/26, 8:17 pm - Neha: polls never work in this group lol
09/10/26, 8:18 pm - Rohan: ok
`;
