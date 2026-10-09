import type { Tone } from "@/types";

// Static class maps so Tailwind can see every class at build time (DESIGN.md §3.2 triads).
export const toneBg: Record<Tone, string> = {
  purple: "bg-purple",
  lavender: "bg-lavender",
  sun: "bg-sun",
  coral: "bg-coral",
  mint: "bg-mint",
  sky: "bg-sky",
  pink: "bg-pink",
  cream: "bg-cream",
};

export const toneSoft: Record<Tone, string> = {
  purple: "bg-lavender-soft",
  lavender: "bg-lavender-soft",
  sun: "bg-sun-soft",
  coral: "bg-coral-soft",
  mint: "bg-mint-soft",
  sky: "bg-sky-soft",
  pink: "bg-pink-soft",
  cream: "bg-cream",
};

export const toneText: Record<Tone, string> = {
  purple: "text-purple-deep",
  lavender: "text-purple-deep",
  sun: "text-sun-deep",
  coral: "text-coral-deep",
  mint: "text-mint-deep",
  sky: "text-sky-deep",
  pink: "text-pink-deep",
  cream: "text-sun-deep",
};

export const toneDeepHex: Record<Tone, string> = {
  purple: "#5a3dd4",
  lavender: "#5a3dd4",
  sun: "#a86f00",
  coral: "#c4502f",
  mint: "#3f8a2e",
  sky: "#2f6fbf",
  pink: "#c9544f",
  cream: "#a86f00",
};

export const toneHex: Record<Tone, string> = {
  purple: "#7b5cf0",
  lavender: "#c6b5f6",
  sun: "#fad47f",
  coral: "#f08a6c",
  mint: "#d0e8ba",
  sky: "#c4def8",
  pink: "#f9cbc9",
  cream: "#fdeedc",
};

export const TONES: Tone[] = ["lavender", "sun", "coral", "mint", "sky", "pink", "cream", "purple"];
