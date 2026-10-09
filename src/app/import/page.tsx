"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, CheckIcon, ClockIcon, DownloadSimpleIcon, FileTextIcon, LockKeyIcon, QuestionIcon, UploadSimpleIcon, UserCheckIcon } from "@phosphor-icons/react";
import { cn, formatINR } from "@/lib/format";
import { useDemo, ME } from "@/lib/store/demo-store";
import { analyseChat, SAMPLE_CHAT, validateChatFile, type ChatInsights } from "@/lib/chat-parser";
import { downloadText } from "@/lib/share";
import { AppShell, PageHead } from "@/components/layout/AppShell";
import { ArtTile } from "@/components/ui/Art";
import { Badge, DemoTag, Kicker } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/primitives";
import { ErrorState, toast } from "@/components/ui/feedback";

const STEPS = ["Reading the file", "Removing noise (media, “ok”, system lines)", "Finding ideas, supporters and times", "Done"];

function ImportFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const plans = useDemo((s) => s.plans);
  const order = useDemo((s) => s.planOrder);
  const myName = useDemo((s) => s.people[ME]?.name);
  const addIdeas = useDemo((s) => s.addIdeas);
  const openPlans = order.map((id) => plans[id]).filter((p) => p && p.status === "voting" && p.members.some((m) => m.userId === ME));
  const [chosenTarget, setTarget] = useState(params.get("plan") ?? "");
  const target = chosenTarget || openPlans[0]?.id || "";
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<ChatInsights | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (text: string, name: string) => {
    setError(null);
    setResult(null);
    setFileName(name);
    setStep(0);
    // The parse itself is instant; the staged steps just make progress visible.
    let insights: ChatInsights;
    try {
      insights = analyseChat(text);
    } catch {
      setStep(-1);
      return setError("We couldn't read this file. Make sure it is a WhatsApp export (.txt).");
    }
    [1, 2, 3].forEach((s, i) => setTimeout(() => setStep(s), 500 * (i + 1)));
    setTimeout(() => {
      if (insights.messages === 0) {
        setStep(-1);
        setError("No WhatsApp messages found. Lines should look like “12/10/26, 9:41 pm - Rohan: …”.");
        return;
      }
      setResult(insights);
      setPicked(new Set(insights.ideas.map((i) => i.key)));
    }, 1700);
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    const err = validateChatFile(file);
    if (err) return setError(err);
    try {
      run(await file.text(), file.name);
    } catch {
      setError("The file could not be opened.");
    }
  };

  const add = () => {
    if (!result || !target) return;
    const chosen = result.ideas.filter((i) => picked.has(i.key));
    if (!chosen.length) return toast("warning", "Pick at least one idea");
    addIdeas(
      target,
      chosen.map((i) => ({
        title: i.place ? `${i.title} at ${i.place}` : i.title,
        place: i.place || plans[target]?.area || "To be decided",
        costPerPerson: i.costPerPerson,
        timeNote: "From chat",
        icon: i.icon,
        tone: i.tone,
        source: "chat",
        proposedBy: Object.values(useDemo.getState().people).find((p) => p.name.toLowerCase() === i.proposedBy.toLowerCase())?.id ?? ME,
        supporters: i.likedBy,
        note: `“${i.firstQuote}” — ${i.proposedBy}`,
      })),
    );
    toast("success", `${chosen.length} idea${chosen.length === 1 ? "" : "s"} added`, "The chat text itself was not saved.");
    router.push(`/p/${target}`);
  };

  const myHints = result?.budgetHints.filter((h) => h.by.toLowerCase() === myName?.toLowerCase()) ?? [];
  const otherHints = (result?.budgetHints.length ?? 0) - myHints.length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-7 sm:px-6 sm:py-10">
      <PageHead kicker={<Kicker tone="mint">WhatsApp chat import</Kicker>} title="Turn the group chat into idea cards" subtitle="Export the chat (Group → More → Export chat → Without media) and drop the .txt file here." />

      {!result && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFile(e.dataTransfer.files[0]);
            }}
            className={cn("rounded-[28px] border-2 border-dashed bg-white p-8 text-center transition sm:p-12", dragOver ? "border-purple bg-lavender-soft" : "border-ink/25")}
          >
            {step >= 0 ? (
              <div role="status" className="mx-auto max-w-sm text-left">
                <p className="mb-4 flex items-center gap-2 text-sm font-bold">
                  <FileTextIcon size={20} weight="duotone" /> {fileName}
                </p>
                <ol className="space-y-3">
                  {STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 text-sm font-semibold">
                      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border-2", i < step || step === 3 ? "border-ink bg-mint" : i === step ? "border-ink bg-sun" : "border-ink/15 bg-white text-faint")}>
                        {i < step || step === 3 ? <CheckIcon size={14} weight="bold" /> : i === step ? <span className="h-2.5 w-2.5 animate-ping rounded-full bg-ink" /> : i + 1}
                      </span>
                      <span className={i > step ? "text-faint" : ""}>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <>
                <UploadSimpleIcon size={48} weight="duotone" className="mx-auto text-purple" />
                <p className="mt-3 font-display text-lg font-bold">Drop your WhatsApp export here</p>
                <p className="mt-1 text-sm font-medium text-muted">.txt only · up to 5 MB · Android and iPhone formats</p>
                <input ref={inputRef} type="file" accept=".txt,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Choose a WhatsApp chat export" />
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button variant="purple" onClick={() => inputRef.current?.click()}>
                    Choose file
                  </Button>
                  <Button variant="outline" onClick={() => run(SAMPLE_CHAT, "sample-weekend-chat.txt")}>
                    Use sample chat
                  </Button>
                </div>
                <button onClick={() => downloadText("sample-weekend-chat.txt", SAMPLE_CHAT)} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-deep hover:underline">
                  <DownloadSimpleIcon size={14} weight="bold" /> Download the sample file to try uploading it
                </button>
              </>
            )}
            {error && (
              <div className="mt-6 text-left">
                <ErrorState title="That file didn't work" body={error} onRetry={() => { setError(null); setStep(-1); inputRef.current?.click(); }} />
              </div>
            )}
          </div>
          <aside className="space-y-3">
            <div className="rounded-[24px] bg-mint-soft p-5">
              <LockKeyIcon size={26} weight="duotone" className="text-mint-deep" />
              <p className="mt-2 text-sm font-bold">Private by design</p>
              <ul className="mt-2 space-y-1.5 text-xs font-medium text-ink-soft">
                <li>• The file is read in your browser and never uploaded.</li>
                <li>• Only the idea cards you choose are saved.</li>
                <li>• Budgets mentioned in the chat are shown only to the person who said them.</li>
              </ul>
            </div>
            <DemoTag>Keyword parser · AI extraction not connected</DemoTag>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted">
                <Badge kind="neutral">{result.messages} messages</Badge>
                <Badge kind="neutral">{result.removed} removed as noise</Badge>
                <Badge kind="neutral">{result.participants.length} people</Badge>
                <Badge kind="neutral">{result.format} format</Badge>
              </div>
              <h2 className="text-xl font-bold">
                {result.ideas.length} idea{result.ideas.length === 1 ? "" : "s"} found
              </h2>
              {result.ideas.length === 0 ? (
                <ErrorState title="No event ideas found" body="We couldn't spot activity words like bowling, movie, turf or trip. Try a different chat or add ideas manually." action={<Button variant="outline" onClick={() => { setResult(null); setStep(-1); }}>Try another file</Button>} />
              ) : (
                <ul className="space-y-3">
                  {result.ideas.map((i) => {
                    const on = picked.has(i.key);
                    return (
                      <li key={i.key}>
                        <label className={cn("flex cursor-pointer items-start gap-3 rounded-[24px] border-2 bg-white p-4 transition", on ? "border-ink shadow-pop" : "border-transparent shadow-clay-sm")}>
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setPicked((s) => { const n = new Set(s); if (n.has(i.key)) n.delete(i.key); else n.add(i.key); return n; })}
                            className="mt-1 h-5 w-5 accent-purple"
                          />
                          <ArtTile icon={i.icon} tone={i.tone} size={44} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-[15px] font-bold">
                                {i.title}
                                {i.place && ` at ${i.place}`}
                              </span>
                              <span className="tabular font-display text-sm font-extrabold">{formatINR(i.costPerPerson)}</span>
                            </span>
                            <span className="mt-0.5 block text-xs font-medium text-muted">
                              Suggested by <b className="text-ink">{i.proposedBy}</b>
                              {i.likedBy.length > 0 && ` · supported by ${i.likedBy.length} (${i.likedBy.join(", ")})`}
                              {i.dislikedBy.length > 0 && ` · not keen: ${i.dislikedBy.join(", ")}`}
                            </span>
                            <span className="mt-2 block rounded-xl bg-canvas px-3 py-2 text-xs font-medium text-ink-soft">“{i.firstQuote}”</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <aside className="space-y-4">
              <div className="rounded-[28px] bg-white p-5 shadow-clay">
                <h3 className="text-base font-bold">What the chat says</h3>
                {result.undecided && (
                  <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sun-soft p-3 text-sm font-semibold text-sun-deep">
                    <QuestionIcon size={18} weight="fill" className="shrink-0" /> {result.undecided}
                  </p>
                )}
                {result.alreadyJoining.length > 0 && (
                  <p className="mt-3 flex items-start gap-2 text-sm font-medium">
                    <UserCheckIcon size={18} weight="duotone" className="shrink-0 text-success" /> Already said they&apos;re in: {result.alreadyJoining.join(", ")}
                  </p>
                )}
                {result.timesMentioned.length > 0 && (
                  <div className="mt-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                      <ClockIcon size={14} /> Times mentioned
                    </p>
                    <ul className="mt-1.5 space-y-1 text-xs font-medium text-ink-soft">
                      {result.timesMentioned.map((t, idx) => (
                        <li key={idx}>
                          <b>{t.by}:</b> {t.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(myHints.length > 0 || otherHints > 0) && (
                  <p className="mt-3 rounded-2xl bg-pink-soft p-3 text-xs font-semibold text-pink-deep">
                    <LockKeyIcon size={14} className="mr-1 inline" />
                    {myHints.length > 0 ? `You mentioned a budget of ${formatINR(myHints[0].max)} — use it as your private budget? ` : ""}
                    {otherHints > 0 && `${otherHints} budget mention${otherHints === 1 ? "" : "s"} hidden — shown only to the person who wrote it.`}
                  </p>
                )}
              </div>
              <div className="rounded-[24px] border-2 border-ink bg-white p-5 shadow-pop-lg">
                <label className="text-sm font-bold">
                  Add to plan
                  <Select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2">
                    {openPlans.length === 0 && <option value="">No plan is open for ideas</option>}
                    {openPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button variant="purple" className="mt-3 w-full" onClick={add} disabled={!target || picked.size === 0}>
                  Add {picked.size} idea{picked.size === 1 ? "" : "s"} <ArrowRightIcon size={18} weight="bold" />
                </Button>
                {openPlans.length === 0 && (
                  <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => router.push("/create")}>
                    Create a plan first
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="mt-1 w-full" onClick={() => { setResult(null); setStep(-1); }}>
                  Import a different chat
                </Button>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ImportPage() {
  return (
    <AppShell>
      <Suspense>
        <ImportFlow />
      </Suspense>
    </AppShell>
  );
}
