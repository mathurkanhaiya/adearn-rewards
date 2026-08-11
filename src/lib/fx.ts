/** Lightweight sound effects + Telegram haptic feedback. */
import { tg } from "./telegram-client";

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") localStorage.setItem("ar_muted", value ? "1" : "0");
}

export function isMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("ar_muted") === "1" || muted;
}

function tone(freq: number, duration = 0.09, type: OscillatorType = "sine", gain = 0.05) {
  if (isMuted()) return;
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ac.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function haptic(style: "light" | "medium" | "heavy" | "success" | "error" = "light") {
  const h = tg()?.HapticFeedback;
  if (!h) return;
  if (style === "success" || style === "error") h.notificationOccurred?.(style);
  else h.impactOccurred(style);
}

export const fx = {
  tap() {
    tone(520, 0.05, "triangle", 0.035);
    haptic("light");
  },
  click() {
    tone(380, 0.06, "square", 0.03);
    haptic("light");
  },
  win(big = false) {
    tone(660, 0.1, "sine", 0.05);
    setTimeout(() => tone(880, 0.12, "sine", 0.05), 90);
    if (big) setTimeout(() => tone(1180, 0.18, "sine", 0.05), 200);
    haptic("success");
  },
  error() {
    tone(180, 0.18, "sawtooth", 0.04);
    haptic("error");
  },
  spin() {
    if (isMuted()) return;
    for (let i = 0; i < 8; i++) setTimeout(() => tone(300 + i * 45, 0.05, "triangle", 0.025), i * 110);
    haptic("medium");
  },
};
