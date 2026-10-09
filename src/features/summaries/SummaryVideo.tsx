"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadSimpleIcon, FilmSlateIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/feedback";

export interface Scene {
  kicker: string;
  title: string;
  sub: string;
  bg: string;
}

const W = 360;
const H = 640;
const SCENE_MS = 1800;

function draw(ctx: CanvasRenderingContext2D, scenes: Scene[], t: number) {
  const idx = Math.min(scenes.length - 1, Math.floor(t / SCENE_MS));
  const local = (t % SCENE_MS) / SCENE_MS;
  const s = scenes[idx];
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, W, H);
  // dotted canvas
  ctx.fillStyle = "rgba(28,27,43,0.09)";
  for (let x = 11; x < W; x += 22) for (let y = 11; y < H; y += 22) ctx.fillRect(x, y, 2, 2);
  const ease = 1 - Math.pow(1 - Math.min(1, local * 2.2), 3);
  const y = 260 + (1 - ease) * 40;
  ctx.globalAlpha = ease;
  // sticker card
  ctx.fillStyle = "#1c1b2b";
  roundRect(ctx, 33, y - 95, W - 56, 230, 26);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 28, y - 100, W - 56, 230, 26);
  ctx.fill();
  ctx.strokeStyle = "#1c1b2b";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#5a3dd4";
  ctx.font = "700 13px Poppins, sans-serif";
  ctx.fillText(s.kicker.toUpperCase(), 50, y - 62);
  ctx.fillStyle = "#1c1b2b";
  ctx.font = "800 30px Unbounded, Poppins, sans-serif";
  wrap(ctx, s.title, 50, y - 20, W - 100, 36);
  ctx.fillStyle = "#625f78";
  ctx.font = "500 15px Poppins, sans-serif";
  wrap(ctx, s.sub, 50, y + 75, W - 100, 21);
  ctx.globalAlpha = 1;
  // progress pips
  scenes.forEach((_, i) => {
    ctx.fillStyle = i <= idx ? "#1c1b2b" : "rgba(28,27,43,0.2)";
    roundRect(ctx, 28 + i * ((W - 56) / scenes.length), 30, (W - 56) / scenes.length - 6, 5, 3);
    ctx.fill();
  });
  ctx.fillStyle = "#1c1b2b";
  ctx.font = "800 14px Unbounded, Poppins, sans-serif";
  ctx.fillText("Group Event Planner", 28, H - 34);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lh;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

/** Builds the recap entirely in the browser: canvas animation + MediaRecorder (§13.9). */
export function SummaryVideo({ scenes, filename }: { scenes: Scene[]; filename: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const total = scenes.length * SCENE_MS;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) draw(ctx, scenes, SCENE_MS * 0.9);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [scenes]);

  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const play = (onDone?: () => void) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const start = performance.now();
    setPlaying(true);
    const frame = (now: number) => {
      const t = now - start;
      draw(ctx, scenes, Math.min(t, total - 1));
      if (t < total) raf.current = requestAnimationFrame(frame);
      else {
        setPlaying(false);
        onDone?.();
      }
    };
    raf.current = requestAnimationFrame(frame);
  };

  const record = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      toast("warning", "Recording isn't supported in this browser", "You can still play the preview.");
      return play();
    }
    const stream = canvas.captureStream(30);
    const type = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    } catch {
      toast("warning", "Recording isn't available", "Playing the preview instead.");
      return play();
    }
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: type ?? "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setRecording(false);
      toast("success", "Summary video ready", "Made in your browser — nothing was uploaded.");
    };
    setRecording(true);
    rec.start();
    play(() => setTimeout(() => rec.stop(), 150));
  };

  return (
    <div className="grid items-start gap-5 sm:grid-cols-[auto_1fr]">
      <div className="mx-auto w-[220px] overflow-hidden rounded-[28px] border-2 border-ink shadow-pop-lg">
        {videoUrl && !playing ? <video src={videoUrl} controls className="block aspect-[9/16] w-full bg-canvas" aria-label="Event summary video" /> : <canvas ref={canvasRef} width={W} height={H} className="block aspect-[9/16] w-full" aria-label="Event summary preview" />}
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-ink-soft">A short vertical recap: ideas, the winning vote, confirmation, photos and the cost split. It is drawn on a canvas and recorded with your browser&apos;s MediaRecorder — no server involved.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setVideoUrl(null); setTimeout(() => play(), 0); }} disabled={playing}>
            <PlayIcon size={18} weight="fill" /> Play preview
          </Button>
          <Button variant="purple" onClick={() => { setVideoUrl(null); setTimeout(record, 0); }} loading={recording} disabled={playing && !recording}>
            <FilmSlateIcon size={18} weight="bold" /> {recording ? "Recording…" : "Create video"}
          </Button>
          {videoUrl && (
            <a href={videoUrl} download={filename} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold shadow-clay-sm transition hover:-translate-y-0.5">
              <DownloadSimpleIcon size={18} weight="bold" /> Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
