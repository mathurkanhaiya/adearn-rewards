import { db as supabaseAdmin } from "./db.server";
import {
  credit,
  creditAdr,
  getSettings,
  num,
  requireAdmin,
  resolvePlayer,
  syncEnergy,
  today,
  type Features,
  type Player,
  type Settings,
} from "./app.server";
import { sendTelegramMessage } from "./telegram.server";

const round = (n: number, d = 5) => Math.round(n * 10 ** d) / 10 ** d;
const rndInt = (min: number, max: number) =>
  Math.round((min + Math.random() * (max - min)) * 10) / 10;

function featureOn(settings: Settings, key: string) {
  const f: Features = settings.features ?? {};
  return f[key] !== false;
}

/* ------------------------------ spin & scratch ----------------------------- */

type GameKind = "spin" | "scratch";

function attemptsFor(game: GameKind, player: Player, settings: Settings) {
  const used = game === "spin" ? player.spins_used : player.scratch_used;
  const extra = game === "spin" ? player.spin_extra : player.scratch_extra;
  const free = game === "spin" ? settings.free_spins : settings.free_scratch;
  const maxExtra = game === "spin" ? settings.max_extra_spins : settings.max_extra_scratch;
  return { used, extra, free, maxExtra, left: free + extra - used };
}

export async function playGame(initData: string, game: GameKind, doubled: boolean) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  if (!featureOn(settings, game)) throw new Error("This game is currently disabled.");

  const a = attemptsFor(game, player, settings);
  if (a.left <= 0) throw new Error("No attempts left. Watch an ad for an extra try.");

  const base = rndInt(settings.game_min, settings.game_max);
  const reward = doubled ? round(base * 2, 2) : base;

  await supabaseAdmin
    .from("players")
    .update(game === "spin" ? { spins_used: a.used + 1 } : { scratch_used: a.used + 1 })
    .eq("id", player.id);
  await supabaseAdmin
    .from("game_plays")
    .insert({ player_id: player.id, game, reward, doubled });
  await creditAdr(player.id, reward, game, game === "spin" ? "Spin wheel" : "Scratch card");

  const left = a.left - 1;
  return { reward, base, left, extraLeft: a.maxExtra - a.extra };
}

/** Grant one extra spin/scratch attempt after a rewarded ad. */
export async function grantExtraAttempt(initData: string, game: GameKind) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  const a = attemptsFor(game, player, settings);
  if (a.extra >= a.maxExtra) throw new Error("Daily extra attempts reached. Come back tomorrow.");
  await supabaseAdmin
    .from("players")
    .update(game === "spin" ? { spin_extra: a.extra + 1 } : { scratch_extra: a.extra + 1 })
    .eq("id", player.id);
  return { extra: a.extra + 1, left: a.left + 1 };
}

/* --------------------------------- tap ---------------------------------- */

export async function tap(initData: string, taps: number) {
  const { player: base } = await resolvePlayer(initData);
  const settings = await getSettings();
  if (!featureOn(settings, "tap")) throw new Error("Tap & Earn is currently disabled.");
  const player = await syncEnergy(base, settings);

  const count = Math.max(1, Math.min(Math.floor(taps), 50));
  const spend = Math.min(count, Math.floor(player.energy));
  if (spend <= 0) throw new Error("Out of energy. Watch an ad for an instant refill.");

  const reward = round(spend * settings.tap_reward, 2);
  await supabaseAdmin
    .from("players")
    .update({
      energy: player.energy - spend,
      energy_at: new Date().toISOString(),
      taps_today: player.taps_today + spend,
    })
    .eq("id", player.id);
  await creditAdr(player.id, reward, "tap", "Tap & Earn");
  return { reward, energy: player.energy - spend, max: settings.energy_max };
}

/** Instant energy refill after a rewarded ad. */
export async function refillEnergy(initData: string) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  await supabaseAdmin
    .from("players")
    .update({ energy: settings.energy_max, energy_at: new Date().toISOString() })
    .eq("id", player.id);
  return { energy: settings.energy_max };
}

/* --------------------------------- swap ---------------------------------- */

export async function swapAdr(initData: string, amount: number) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  const adr = Math.floor(amount);
  if (!Number.isFinite(adr) || adr <= 0) throw new Error("Enter a valid ADR amount.");
  if (adr < settings.min_swap_adr) {
    throw new Error(`Minimum swap is ${settings.min_swap_adr} ADR.`);
  }
  if (adr > player.adr_balance) throw new Error("Not enough ADR.");

  const usd = round(adr * settings.adr_rate);
  if (usd <= 0) throw new Error("Amount too small to swap.");

  await supabaseAdmin
    .from("players")
    .update({ adr_balance: round(player.adr_balance - adr, 2) })
    .eq("id", player.id);
  await credit(player.id, usd, "swap", `Swapped ${adr} ADR`);
  return { usd, adr };
}

/* ------------------------------ daily login ------------------------------ */

export async function claimDaily(initData: string, doubled: boolean) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  if (!featureOn(settings, "daily")) throw new Error("Daily reward is currently disabled.");
  const day = today();
  if (String(player.last_login ?? "").slice(0, 10) === day) {
    throw new Error("Already claimed today. Come back tomorrow.");
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const streak = String(player.last_login ?? "").slice(0, 10) === yesterday ? player.login_streak + 1 : 1;
  const base = round(settings.login_reward * Math.min(streak, 7), 2);
  const reward = doubled ? round(base * 2, 2) : base;

  await supabaseAdmin
    .from("players")
    .update({ last_login: day, login_streak: streak })
    .eq("id", player.id);
  await supabaseAdmin
    .from("daily_logins")
    .upsert({ player_id: player.id, day, streak, reward }, { onConflict: "player_id,day" });
  await creditAdr(player.id, reward, "daily", `Daily login · day ${streak}`);
  return { reward, streak };
}

/* -------------------------------- promo ---------------------------------- */

export async function claimPromo(initData: string, code: string) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  if (!featureOn(settings, "promo")) throw new Error("Promo codes are currently disabled.");
  const clean = code.trim().toUpperCase();
  if (!clean) throw new Error("Enter a promo code.");

  const { data } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .eq("code", clean)
    .maybeSingle();
  const p = data as Record<string, unknown> | null;
  if (!p || !p["is_active"]) throw new Error("Invalid promo code.");
  if (p["expires_at"] && new Date(String(p["expires_at"])).getTime() < Date.now()) {
    throw new Error("This promo code has expired.");
  }
  if (num(p["max_uses"]) > 0 && num(p["used_count"]) >= num(p["max_uses"])) {
    throw new Error("This promo code is fully claimed.");
  }

  const promoId = String(p["id"]);
  const ins = await supabaseAdmin
    .from("promo_redemptions")
    .insert({ promo_id: promoId, player_id: player.id });
  if (ins.error) throw new Error("You already used this code.");

  await supabaseAdmin
    .from("promo_codes")
    .update({ used_count: num(p["used_count"]) + 1 })
    .eq("id", promoId);

  const kind = String(p["kind"]);
  const amount = num(p["amount"]);
  if (kind === "spin" || kind === "scratch") {
    const a = attemptsFor(kind as GameKind, player, settings);
    await supabaseAdmin
      .from("players")
      .update(
        kind === "spin"
          ? { spin_extra: a.extra + Math.max(1, Math.round(amount)) }
          : { scratch_extra: a.extra + Math.max(1, Math.round(amount)) },
      )
      .eq("id", player.id);
    return { kind, amount: Math.max(1, Math.round(amount)) };
  }

  await creditAdr(player.id, amount, "promo", `Promo code ${clean}`);
  return { kind: "adr", amount };
}

/* ------------------------------- contests -------------------------------- */

export type ContestRow = {
  id: string;
  title: string;
  description: string | null;
  metric: string;
  reward_type: string;
  reward_amount: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

function mapContest(r: Record<string, unknown>): ContestRow {
  return {
    id: String(r["id"]),
    title: String(r["title"]),
    description: (r["description"] as string) ?? null,
    metric: String(r["metric"]),
    reward_type: String(r["reward_type"]),
    reward_amount: num(r["reward_amount"]),
    starts_at: String(r["starts_at"]),
    ends_at: String(r["ends_at"]),
    is_active: Boolean(r["is_active"]),
  };
}

export async function listContests(initData: string): Promise<ContestRow[]> {
  await resolvePlayer(initData);
  const now = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("contests")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("ends_at", { ascending: true });
  return (data ?? []).map((c) => mapContest(c as unknown as Record<string, unknown>));
}

/* ------------------------------ leaderboards ----------------------------- */

export type BoardKind = "invites" | "usdt" | "adr";

export async function boardTop(initData: string, board: BoardKind) {
  await resolvePlayer(initData);
  const column = board === "usdt" ? "usdt_withdrawn" : board === "adr" ? "adr_earned" : "referrals_count";
  const { data } = await supabaseAdmin
    .from("players")
    .select("tg_id,username,first_name,referrals_count,usdt_withdrawn,adr_earned")
    .order(column, { ascending: false })
    .limit(20);
  return (data ?? [])
    .map((p) => p as unknown as Record<string, unknown>)
    .map((p, i) => ({
      rank: i + 1,
      name: (p["username"] as string) ?? (p["first_name"] as string) ?? "Player",
      value: num(p[column]),
    }))
    .filter((r) => r.value > 0);
}

/* --------------------------------- admin --------------------------------- */

export async function adminGetSettings(initData: string, adminToken: string) {
  await requireAdmin(initData, adminToken);
  return getSettings();
}

export async function adminUpdateSettings(
  initData: string,
  adminToken: string,
  patch: Record<string, number | boolean | Features>,
) {
  await requireAdmin(initData, adminToken);
  const allowed = [
    "ad_reward_min",
    "ad_reward_max",
    "ref_reward_min",
    "ref_reward_max",
    "commission_rate",
    "min_withdraw",
    "withdraw_fee",
    "req_referrals",
    "req_tasks",
    "req_daily_ads",
    "adr_rate",
    "min_swap_adr",
    "tap_reward",
    "energy_max",
    "energy_regen_sec",
    "game_min",
    "game_max",
    "free_spins",
    "free_scratch",
    "max_extra_spins",
    "max_extra_scratch",
    "login_reward",
    "features",
  ];
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) if (allowed.includes(k)) update[k] = v;
  if (Object.keys(update).length === 0) return { ok: true };
  const { error } = await supabaseAdmin
    .from("app_settings")
    .update(update as never)
    .eq("id", 1);

  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminAdjust(
  initData: string,
  adminToken: string,
  input: { playerId: string; currency: "usd" | "adr"; amount: number; note: string },
) {
  await requireAdmin(initData, adminToken);
  if (!Number.isFinite(input.amount) || input.amount === 0) throw new Error("Enter an amount.");
  if (input.currency === "adr") {
    await creditAdr(input.playerId, input.amount, "admin", input.note || "Admin adjustment");
  } else {
    await credit(input.playerId, input.amount, "admin", input.note || "Admin adjustment");
  }
  return { ok: true };
}

export async function adminSetBan(
  initData: string,
  adminToken: string,
  input: { playerId: string; banned: boolean },
) {
  await requireAdmin(initData, adminToken);
  const { error } = await supabaseAdmin
    .from("players")
    .update({ is_banned: input.banned })
    .eq("id", input.playerId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export type PromoRow = {
  id: string;
  code: string;
  kind: string;
  amount: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
};

export async function adminPromos(initData: string, adminToken: string): Promise<PromoRow[]> {
  await requireAdmin(initData, adminToken);
  const { data } = await supabaseAdmin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? [])
    .map((p) => p as unknown as Record<string, unknown>)
    .map((p) => ({
      id: String(p["id"]),
      code: String(p["code"]),
      kind: String(p["kind"]),
      amount: num(p["amount"]),
      max_uses: num(p["max_uses"]),
      used_count: num(p["used_count"]),
      is_active: Boolean(p["is_active"]),
      expires_at: p["expires_at"] ? String(p["expires_at"]) : null,
    }));
}

export async function adminCreatePromo(
  initData: string,
  adminToken: string,
  input: { code: string; kind: string; amount: number; max_uses: number; days: number },
) {
  await requireAdmin(initData, adminToken);
  const code = input.code.trim().toUpperCase();
  if (!code) throw new Error("Enter a code.");
  const { error } = await supabaseAdmin.from("promo_codes").insert({
    code,
    kind: input.kind,
    amount: input.amount,
    max_uses: input.max_uses,
    expires_at:
      input.days > 0 ? new Date(Date.now() + input.days * 86_400_000).toISOString() : null,
  });
  if (error) throw new Error(error.message.includes("duplicate") ? "That code exists." : error.message);
  return { ok: true };
}

export async function adminUpdatePromo(
  initData: string,
  adminToken: string,
  input: { id: string; is_active?: boolean | undefined; remove?: boolean | undefined },
) {
  await requireAdmin(initData, adminToken);
  if (input.remove) {
    await supabaseAdmin.from("promo_codes").delete().eq("id", input.id);
    return { ok: true };
  }
  await supabaseAdmin
    .from("promo_codes")
    .update({ is_active: input.is_active ?? true })
    .eq("id", input.id);
  return { ok: true };
}

export async function adminContests(initData: string, adminToken: string): Promise<ContestRow[]> {
  await requireAdmin(initData, adminToken);
  const { data } = await supabaseAdmin
    .from("contests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((c) => mapContest(c as unknown as Record<string, unknown>));
}

export async function adminCreateContest(
  initData: string,
  adminToken: string,
  input: {
    title: string;
    description?: string | undefined;
    metric: string;
    reward_type: string;
    reward_amount: number;
    days: number;
  },
) {
  await requireAdmin(initData, adminToken);
  if (!input.title.trim()) throw new Error("Enter a title.");
  const { error } = await supabaseAdmin.from("contests").insert({
    title: input.title.trim(),
    description: input.description ?? null,
    metric: input.metric,
    reward_type: input.reward_type,
    reward_amount: input.reward_amount,
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + Math.max(1, input.days) * 86_400_000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminUpdateContest(
  initData: string,
  adminToken: string,
  input: { id: string; is_active?: boolean | undefined; remove?: boolean | undefined },
) {
  await requireAdmin(initData, adminToken);
  if (input.remove) {
    await supabaseAdmin.from("contests").delete().eq("id", input.id);
    return { ok: true };
  }
  await supabaseAdmin
    .from("contests")
    .update({ is_active: input.is_active ?? true })
    .eq("id", input.id);
  return { ok: true };
}

export async function adminActivity(initData: string, adminToken: string) {
  await requireAdmin(initData, adminToken);
  const { data } = await supabaseAdmin
    .from("game_plays")
    .select("*, players(username,first_name)")
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? [])
    .map((g) => g as unknown as Record<string, unknown>)
    .map((g) => {
      const p = (g["players"] ?? null) as Record<string, unknown> | null;
      return {
        id: String(g["id"]),
        game: String(g["game"]),
        reward: num(g["reward"]),
        doubled: Boolean(g["doubled"]),
        created_at: String(g["created_at"]),
        name: p ? ((p["username"] as string) ?? (p["first_name"] as string) ?? "Player") : "Player",
      };
    });
}

/* ------------------------------ daily report ----------------------------- */

const REPORT_CHANNEL = "@adsrewards";

export async function sendDailyReport() {
  const since = new Date(Date.now() - 86_400_000).toISOString();

  const [plays, refs, withdrawals, players] = await Promise.all([
    supabaseAdmin.from("game_plays").select("game,reward,player_id").gte("created_at", since),
    supabaseAdmin.from("referrals").select("referrer_id").eq("verified", true).gte("created_at", since),
    supabaseAdmin.from("withdrawals").select("net_amount,player_id").eq("status", "paid").gte("processed_at", since),
    supabaseAdmin.from("players").select("id,username,first_name,adr_earned").order("adr_earned", { ascending: false }).limit(5),
  ]);

  const playRows = (plays.data ?? []).map((p) => p as unknown as Record<string, unknown>);
  const spins = playRows.filter((p) => String(p["game"]) === "spin").length;
  const scratches = playRows.filter((p) => String(p["game"]) === "scratch").length;
  const adr = round(playRows.reduce((s, p) => s + num(p["reward"]), 0), 2);
  const invites = (refs.data ?? []).length;
  const paid = round(
    (withdrawals.data ?? []).reduce((s, w) => s + num((w as Record<string, unknown>)["net_amount"]), 0),
  );

  const top = (players.data ?? [])
    .map((p) => p as unknown as Record<string, unknown>)
    .map((p, i) => `${i + 1}. ${(p["username"] as string) ?? (p["first_name"] as string) ?? "Player"} — ${num(p["adr_earned"])} ADR`)
    .join("\n");

  const text =
    `📊 <b>Ads Rewards — Daily Report</b>\n\n` +
    `🎡 Spins: <b>${spins}</b>\n` +
    `🎫 Scratch cards: <b>${scratches}</b>\n` +
    `👥 Verified invites: <b>${invites}</b>\n` +
    `🪙 ADR earned: <b>${adr}</b>\n` +
    `💸 Withdrawals paid: <b>$${paid}</b>\n\n` +
    (top ? `🏆 <b>Top earners</b>\n${top}` : "");

  await sendTelegramMessage(REPORT_CHANNEL, text, {
    inline_keyboard: [[{ text: "🚀 Open Mini App", url: "https://t.me/Adsrewartsbot/app" }]],
  });
  return { ok: true, spins, scratches, invites, adr, paid };
}
