/** Minimal Telegram WebApp + Adsgram client helpers. */

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { start_param?: string; user?: { id: number; username?: string } };
  ready: () => void;
  expand: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (s: string) => void;
    notificationOccurred?: (s: string) => void;
    selectionChanged?: () => void;
  };
  setHeaderColor?: (c: string) => void;
};

type AdController = { show: () => Promise<unknown> };

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
    Adsgram?: { init: (opts: { blockId: string }) => AdController };
  }
}

/** Interstitial block shown once when the app opens. */
export const AD_BLOCK_OPEN = "int-25929";
/** Rewarded block used for optional bonuses (double reward, extra tries, refill). */
export const AD_BLOCK_REWARD = "25930";
export const BOT_USERNAME = "Adsrewartsbot";


export function tg(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

/** Telegram also passes the launch params in the URL hash (or query) on some clients. */
function initDataFromUrl(): string {
  if (typeof window === "undefined") return "";
  const sources = [window.location.hash.replace(/^#/, ""), window.location.search.replace(/^\?/, "")];
  for (const src of sources) {
    if (!src) continue;
    const value = new URLSearchParams(src).get("tgWebAppData");
    if (value) return value;
  }
  try {
    const stored = sessionStorage.getItem("tg_init_data");
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  return "";
}

export function getInitData(): string {
  const fromSdk = tg()?.initData ?? "";
  const raw = fromSdk || initDataFromUrl();
  if (raw && typeof window !== "undefined") {
    try {
      sessionStorage.setItem("tg_init_data", raw);
    } catch {
      /* ignore */
    }
  }
  return raw;
}

/** Wait for the Telegram WebApp SDK script to attach initData (it can lag first paint). */
export async function waitForTelegram(timeoutMs = 5000): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getInitData()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return Boolean(getInitData());
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
/** Optional rewarded ad. Resolves true only when the ad was actually watched. */
export async function showRewardedAd(): Promise<boolean> {
  try {
    await showAd(AD_BLOCK_REWARD);
    return true;
  } catch {
    return false;
  }
}

/** Fire-and-forget interstitial; never blocks the UI. */
export function showInterstitial() {
  void showAd(AD_BLOCK_OPEN).catch(() => undefined);
}
