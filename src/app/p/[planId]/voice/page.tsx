"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, MicrophoneIcon, MicrophoneSlashIcon, PhoneDisconnectIcon, PlayIcon, ShieldCheckIcon, SparkleIcon } from "@phosphor-icons/react";
import type { VoiceLine, VoteValue } from "@/types";
import { cn } from "@/lib/format";
import { useDemo, usePlan, ME } from "@/lib/store/demo-store";
import { usePlanId } from "@/features/plans/PlanShell";
import { Avatar } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/feedback";

const CALL_SECONDS = 300;

/** Scripted demo transcript (from the project document's example, §9 Feature 7). */
const SCRIPT: (VoiceLine & { detect?: { type: "idea" | "vote" | "time" | "budget"; text: string } })[] = [
  { speaker: "u-rohan", at: 3, text: "Okay so, let's do bowling at Andheri, but nothing too expensive yaar.", detect: { type: "idea", text: "Idea: Bowling, Andheri" } },
  { speaker: "u-riya", at: 9, text: "Bowling is fine, but only after 6 pm. I have class till five.", detect: { type: "time", text: "Riya: after 6 pm" } },
  { speaker: "u-rohan", at: 15, text: "I love the bowling plan honestly, Infiniti mall has lanes.", detect: { type: "vote", text: "Rohan → Love it (Bowling)" } },
  { speaker: "u-riya", at: 21, text: "Okay okay, bowling works for me.", detect: { type: "vote", text: "Riya → Okay (Bowling)" } },
  { speaker: "u-aman", at: 27, text: "Saturday is better than Sunday for me, Sunday I have turf.", detect: { type: "time", text: "Aman: prefers Saturday" } },
  { speaker: "u-rohan", at: 33, text: "Around six hundred per person should be fine na?", detect: { type: "budget", text: "Cost mentioned: ~₹600/person" } },
  { speaker: "u-aman", at: 39, text: "Yeah six hundred is cool. Let's lock Saturday six.", detect: { type: "vote", text: "Aman → Love it (Bowling)" } },
];
const SCRIPT_END = 45;
const SPEAKERS = ["u-rohan", "u-riya", "u-aman"];

export default function VoicePage() {
  const planId = usePlanId();
  const plan = usePlan(planId);
  const people = useDemo((s) => s.people);
  const saveVoice = useDemo((s) => s.saveVoice);
  const applyDecision = useDemo((s) => s.applyVoiceDecision);
  const [phase, setPhase] = useState<"lobby" | "consent" | "live" | "summary">("lobby");
  const [consent, setConsent] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(true);
  const [level, setLevel] = useState(0);
  const [micState, setMicState] = useState<"off" | "asking" | "on" | "denied">("off");
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);
  const elapsedRef = useRef(0);

  const participants = [ME, ...SPEAKERS];
  const lines = SCRIPT.filter((l) => l.at <= elapsed);
  const detections = lines.filter((l) => l.detect).map((l) => l.detect!);
  const allConsented = participants.every((id) => consent[id]);

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    setLevel(0);
    setMicState((s) => (s === "on" ? "off" : s));
  }, []);

  useEffect(() => () => stopMic(), [stopMic]);

  // others consent shortly after the room opens (simulated)
  useEffect(() => {
    if (phase !== "consent") return;
    const timers = SPEAKERS.map((id, i) => setTimeout(() => setConsent((c) => ({ ...c, [id]: true })), 600 + i * 500));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const planIdRef = plan?.id;
  const endCall = useCallback(() => {
    elapsedRef.current = SCRIPT_END;
    setElapsed(SCRIPT_END);
    setPhase("summary");
    stopMic();
    if (planIdRef) saveVoice(planIdRef, { startedAt: new Date(Date.now() - SCRIPT_END * 1000).toISOString(), endedAt: new Date().toISOString(), lines: SCRIPT.map(({ speaker, text, at }) => ({ speaker, text, at })), applied: false });
  }, [planIdRef, saveVoice, stopMic]);

  useEffect(() => {
    if (phase !== "live") return;
    const t = setInterval(() => {
      elapsedRef.current += 1;
      if (elapsedRef.current >= SCRIPT_END) endCall();
      else setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [phase, endCall]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [lines.length]);

  const enableMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("denied");
      return toast("error", "Microphone not available in this browser");
    }
    setMicState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(data);
        setLevel(data.reduce((a, b) => a + b, 0) / data.length / 128);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
      setMicState("on");
      setMuted(false);
      toast("info", "Mic level meter on", "Audio is only measured locally — nothing is recorded or sent.");
    } catch {
      setMicState("denied");
      toast("warning", "Microphone permission denied", "The demo transcript still plays.");
    }
  };

  if (!plan) return null;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const left = CALL_SECONDS - elapsed;

  const confirmDecision = () => {
    const votes: Record<string, VoteValue> = { "u-rohan": 2, "u-riya": 1, "u-aman": 2 };
    applyDecision(plan.id, {
      idea: { title: "Bowling", place: "Andheri", costPerPerson: 600, timeNote: "Saturday 6 pm", icon: "bowling", tone: "lavender", source: "voice", proposedBy: "u-rohan", note: "Added from the voice room" },
      votes,
      notes: ["Riya: after 6 pm", "Aman: prefers Saturday"],
    });
    toast("success", "Decision added to the plan", plan.status === "voting" ? "Votes from the call were recorded." : "Notes saved to the plan.");
  };

  return (
    <div className="grid gap-6 pb-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Kicker tone="coral">Voice discussion room</Kicker>
            <h2 className="mt-3 text-2xl font-extrabold">Talk it out — the plan takes notes</h2>
            <p className="mt-1 text-sm font-medium text-muted">5-minute timer. Ideas, votes and times from the call land on the plan after you confirm.</p>
          </div>
          <DemoTag>Demo transcript · no audio recorded</DemoTag>
        </div>

        <div className="rounded-[28px] border-2 border-ink bg-ink p-5 text-white shadow-pop-lg sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">{plan.title}</p>
              <p className="tabular mt-1 font-display text-4xl font-extrabold">
                {mm}:{ss}
              </p>
              <p className="text-xs font-medium text-white/60">{phase === "live" ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left` : "5:00 call"}</p>
            </div>
            {phase === "live" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-xs font-bold text-ink">
                <span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> Transcribing (demo)
              </span>
            )}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {participants.map((id) => {
              const speaking = phase === "live" && lines.length > 0 && lines[lines.length - 1].speaker === id && elapsed - lines[lines.length - 1].at < 4;
              const meSpeaking = id === ME && level > 0.15 && !muted;
              return (
                <li key={id} className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-3">
                  <span className={cn("rounded-full transition", (speaking || meSpeaking) && "ring-4 ring-sun")}>
                    <Avatar person={people[id]} size={52} />
                  </span>
                  <span className="text-xs font-semibold">{id === ME ? "You" : people[id]?.name}</span>
                  {phase === "consent" && <Badge kind={consent[id] ? "success" : "neutral"}>{consent[id] ? "Agreed" : "Waiting"}</Badge>}
                </li>
              );
            })}
          </ul>
          {micState === "on" && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" aria-label="Your microphone level">
              <div className="h-full rounded-full bg-mint transition-[width] duration-75" style={{ width: `${Math.min(100, level * 100)}%` }} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {phase === "lobby" && (
              <Button variant="sun" onClick={() => setPhase("consent")}>
                <PlayIcon size={18} weight="fill" /> Start voice room
              </Button>
            )}
            {phase === "consent" && (
              <Button variant="sun" disabled={consent[ME]} onClick={() => setConsent((c) => ({ ...c, [ME]: true }))}>
                <ShieldCheckIcon size={18} weight="bold" /> {consent[ME] ? "You agreed" : "I agree to transcription"}
              </Button>
            )}
            {phase === "consent" && allConsented && (
              <Button variant="purple" onClick={() => { elapsedRef.current = 0; setElapsed(0); setPhase("live"); }}>
                Everyone agreed — begin
              </Button>
            )}
            {phase === "live" && (
              <>
                {micState === "on" ? (
                  <Button variant="secondary" onClick={() => { setMuted((m) => !m); }}>
                    {muted ? <MicrophoneSlashIcon size={18} weight="bold" /> : <MicrophoneIcon size={18} weight="bold" />} {muted ? "Unmute" : "Mute"}
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={enableMic} loading={micState === "asking"} disabled={micState === "denied"}>
                    <MicrophoneIcon size={18} weight="bold" /> {micState === "denied" ? "Mic unavailable" : "Use my mic (level only)"}
                  </Button>
                )}
                <Button variant="danger" onClick={endCall}>
                  <PhoneDisconnectIcon size={18} weight="bold" /> End call
                </Button>
              </>
            )}
          </div>
          {phase === "consent" && <p className="mt-3 text-xs font-medium text-white/60">Transcription starts only after every member agrees. Audio would be deleted right after it is converted to text.</p>}
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="mb-3 text-base font-bold">Transcript</h3>
          {lines.length === 0 ? (
            <p className="rounded-2xl bg-canvas p-5 text-center text-sm font-medium text-muted">{phase === "summary" ? "Call ended." : "The transcript appears here while you talk."}</p>
          ) : (
            <ol ref={transcriptRef} className="max-h-80 space-y-3 overflow-y-auto pr-1" aria-live="polite">
              <AnimatePresence initial={false}>
                {lines.map((l) => (
                  <motion.li key={l.at} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                    <Avatar person={people[l.speaker]} size={28} />
                    <div className="max-w-[85%] rounded-[20px] rounded-tl-sm border-2 border-ink bg-white px-3.5 py-2.5 text-sm font-medium shadow-pop">
                      <p className="text-[11px] font-bold text-muted">
                        {people[l.speaker]?.name} · 0:{String(l.at).padStart(2, "0")}
                      </p>
                      {l.text}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[28px] bg-white p-5 shadow-clay">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <SparkleIcon size={18} weight="fill" className="text-purple" /> Detected plan updates
          </h3>
          {detections.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-muted">Ideas, votes, times and budget mentions show up here.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {detections.map((d) => (
                <motion.li key={d.text} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-2xl bg-canvas p-2.5 text-sm font-semibold">
                  <Badge kind={d.type === "idea" ? "lavender" : d.type === "vote" ? "pink" : d.type === "time" ? "sky" : "sun"}>{d.type}</Badge>
                  {d.text}
                </motion.li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[11px] font-medium text-muted">Keyword detection on a scripted transcript — no speech-to-text or AI service is connected.</p>
        </div>

        {phase === "summary" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border-2 border-ink bg-sun-soft p-5 shadow-pop-lg">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sun-deep">Call summary</p>
            <p className="mt-2 font-display text-lg font-bold">Decided: Bowling, Saturday 6 pm, about ₹600 per person.</p>
            <p className="mt-1 text-sm font-medium text-ink-soft">Confirm this decision?</p>
            {plan.voice?.applied ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-success">
                <CheckCircleIcon size={18} weight="fill" /> Added to the plan
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <Button variant="purple" onClick={confirmDecision}>
                  Confirm & add to plan
                </Button>
                <Button variant="secondary" onClick={() => { setPhase("lobby"); elapsedRef.current = 0; setElapsed(0); setConsent({}); }}>
                  Discard
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </aside>
    </div>
  );
}
