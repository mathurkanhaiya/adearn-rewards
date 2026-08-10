export const ADMIN_TG_ID = 2139807311;

/**
 * Telegram's public Ed25519 key for third-party validation of WebApp initData.
 * This lets us verify a launch WITHOUT ever storing the bot token on the server.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
const TELEGRAM_PUBLIC_KEY_PROD = "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";
const TELEGRAM_PUBLIC_KEY_TEST = "40055058a4ee38156a06562e52eec92a771bcd8346a8c4615cb7376eddf72ec9";

export type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
};

export type TgSession = {
  user: TgUser;
  startParam?: string | undefined;
};

/** Numeric bot id (public, NOT the secret token). Set TELEGRAM_BOT_ID in the host env. */
function botId(): string {
  const env = process.env as Record<string, string | undefined>;
  const id = env["TELEGRAM_BOT_ID"] || env["VITE_TELEGRAM_BOT_ID"];
  if (!id) {
    throw new Error(
      "Server is missing TELEGRAM_BOT_ID. Add your bot's numeric id (the digits before ':' in the bot token) as an environment variable.",
    );
  }
  return id.trim();
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function ed25519Verify(publicKeyHex: string, message: string, signature: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(publicKeyHex) as unknown as ArrayBuffer,
    { name: "Ed25519" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "Ed25519",
    key,
    signature as unknown as ArrayBuffer,
    new TextEncoder().encode(message) as unknown as ArrayBuffer,
  );
}

/**
 * Verify Telegram WebApp initData using Telegram's public key (no bot token needed)
 * and return the embedded user.
 */
export async function verifyInitData(initData: string): Promise<TgSession> {
  if (!initData) {
    if (process.env["NODE_ENV"] !== "production") {
      return { user: { id: ADMIN_TG_ID, username: "dev_preview", first_name: "Preview" } };
    }
    throw new Error("Open this app inside Telegram.");
  }

  const params = new URLSearchParams(initData);
  const signature = params.get("signature");
  if (!signature) throw new Error("Outdated Telegram client. Please update Telegram and reopen.");

  params.delete("hash");
  params.delete("signature");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const message = `${botId()}:WebAppData\n${dataCheckString}`;
  const sig = base64UrlToBytes(signature);

  const ok =
    (await ed25519Verify(TELEGRAM_PUBLIC_KEY_PROD, message, sig)) ||
    (await ed25519Verify(TELEGRAM_PUBLIC_KEY_TEST, message, sig));
  if (!ok) throw new Error("Invalid Telegram session.");

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 60 * 60 * 24) {
    throw new Error("Telegram session expired. Please reopen the app.");
  }

  const rawUser = params.get("user");
  if (!rawUser) throw new Error("Telegram session has no user.");
  const user = JSON.parse(rawUser) as TgUser;
  if (!user?.id) throw new Error("Telegram session has no user id.");

  return { user, startParam: params.get("start_param") ?? undefined };
}

export function isAdmin(tgId: number): boolean {
  return Number(tgId) === ADMIN_TG_ID;
}

/** Bot token, server-only. Used just to DM the admin their login code. */
function botToken(): string {
  const env = process.env as Record<string, string | undefined>;
  const t = env["TELEGRAM_BOT_TOKEN"] || env["BOT_TOKEN"];
  if (!t) {
    throw new Error(
      "Server is missing TELEGRAM_BOT_TOKEN. Add it to your hosting environment variables to receive admin login codes.",
    );
  }
  return t.trim();
}

/** Send a Telegram DM to a chat id via the Bot API. */
export async function sendTelegramMessage(chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  const body = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok || !body.ok) {
    throw new Error(`Could not send the code on Telegram: ${body.description ?? res.status}`);
  }
}
