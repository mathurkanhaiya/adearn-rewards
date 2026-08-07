import { createHmac } from "node:crypto";

export const ADMIN_TG_ID = 2139807311;

export type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
};

export type TgSession = {
  user: TgUser;
  startParam?: string;
};

function botToken(): string {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return token;
}

/** Verify Telegram WebApp initData signature and return the embedded user. */
export function verifyInitData(initData: string): TgSession {
  if (!initData) {
    if (process.env["NODE_ENV"] !== "production") {
      return {
        user: { id: ADMIN_TG_ID, username: "dev_preview", first_name: "Preview" },
      };
    }
    throw new Error("Open this app inside Telegram.");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  params.delete("hash");
  params.delete("signature");

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken()).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (computed !== hash) throw new Error("Invalid Telegram session.");

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

/** Check whether a Telegram user is a member of a public channel/group. */
export async function isChatMember(chatUsername: string, tgId: number): Promise<boolean> {
  const chatId = chatUsername.startsWith("@") ? chatUsername : `@${chatUsername}`;
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/getChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, user_id: tgId }),
  });
  const body = (await res.json()) as {
    ok: boolean;
    result?: { status?: string };
    description?: string;
  };
  if (!body.ok) {
    throw new Error(body.description ?? "Could not verify membership. Make sure the bot is admin.");
  }
  const status = body.result?.status ?? "left";
  return ["member", "administrator", "creator", "restricted"].includes(status);
}
