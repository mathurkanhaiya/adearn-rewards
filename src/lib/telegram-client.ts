/** Minimal Telegram WebApp + Adsgram client helpers. */

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { start_param?: string; user?: { id: number; username?: string } };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: { impactOccurred: (s: string) => void };
  setHeaderColor?: (c: string) => void;
};

type AdController = { show: () => Promise<unknown> };

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
    Adsgram?: { init: (opts: { blockId: string }) => AdController };
  }
}

export const AD_BLOCK_OPEN = "int-23322";
export const AD_BLOCK_REWARD = "23390";
export const BOT_USERNAME = "Adsrewartsbot";

export function tg(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function getInitData(): string {
  return tg()?.initData ?? "";
}

export function getStartParam(): string | undefined {
  const fromTg = tg()?.initDataUnsafe?.start_param;
  if (fromTg) return fromTg;
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("startapp") ?? undefined;
}

export function referralLink(tgId: number | string): string {
  return `https://t.me/${BOT_USERNAME}/app?startapp=${tgId}`;
}

export function openLink(url: string) {
  const app = tg();
  if (url.includes("t.me") && app?.openTelegramLink) app.openTelegramLink(url);
  else if (app?.openLink) app.openLink(url);
  else window.open(url, "_blank", "noopener");
}

let scriptPromise: Promise<void> | null = null;
function loadAdsgram(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Adsgram) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://sad.adsgram.ai/js/sad.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Ad service unavailable"));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

const controllers = new Map<string, AdController>();

export async function showAd(blockId: string): Promise<void> {
  await loadAdsgram();
  if (!window.Adsgram) throw new Error("Ad service unavailable");
  let controller = controllers.get(blockId);
  if (!controller) {
    controller = window.Adsgram.init({ blockId });
    controllers.set(blockId, controller);
  }
  await controller.show();
}