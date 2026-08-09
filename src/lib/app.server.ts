import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { verifyInitData, isAdmin, ADMIN_TG_ID } from "./telegram.server";

const today = () => new Date().toISOString().slice(0, 10);
const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100000) / 100000;

export type Settings = {
  ad_reward_min: number;
  ad_reward_max: number;
  ref_reward_min: number;
  ref_reward_max: number;
  commission_rate: number;
  min_withdraw: number;
  withdraw_fee: number;
  req_referrals: number;
  req_tasks: number;
  req_daily_ads: number;
};

export type Player = {
  id: string;
  tg_id: number;
  username: string | null;
  first_name: string | null;
  balance: number;
  total_earned: number;
  referral_earned: number;
  ads_watched_total: number;
  ads_watched_today: number;
  tasks_completed: number;
  referrals_count: number;
  is_banned: boolean;
  created_at: string;
};

export type WithdrawalRow = {
  id: string;
  player_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  method: string;
  address: string;
  status: string;
  reason: string | null;
  created_at: string;
  processed_at: string | null;
  user_tg_id: number | null;
  user_name: string | null;
};

export type TxRow = {
  id: string;
  kind: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export type AdminTaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  link: string;
  chat_username: string | null;
  reward: number;
  user_limit: number;
  completed_count: number;
  is_live: boolean;
  created_at: string;
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

function str(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}

function mapWithdrawal(row: Record<string, unknown>): WithdrawalRow {
  const p = (row["players"] ?? null) as Record<string, unknown> | null;
  return {
    id: String(row["id"]),
    player_id: String(row["player_id"]),
    amount: num(row["amount"]),
    fee: num(row["fee"]),
    net_amount: num(row["net_amount"]),
    method: String(row["method"]),
    address: String(row["address"]),
    status: String(row["status"]),
    reason: str(row["reason"]),
    created_at: String(row["created_at"]),
    processed_at: str(row["processed_at"]),
    user_tg_id: p ? num(p["tg_id"]) : null,
    user_name: p ? ((p["username"] as string) ?? (p["first_name"] as string) ?? null) : null,
  };
}

function mapTx(row: Record<string, unknown>): TxRow {
  return {
    id: String(row["id"]),
    kind: String(row["kind"]),
    amount: num(row["amount"]),
    note: str(row["note"]),
    created_at: String(row["created_at"]),
  };
}

function mapAdminTask(row: Record<string, unknown>): AdminTaskRow {
  return {
    id: String(row["id"]),
    title: String(row["title"]),
    description: str(row["description"]),
    task_type: String(row["task_type"]),
    link: String(row["link"]),
    chat_username: str(row["chat_username"]),
    reward: num(row["reward"]),
    user_limit: num(row["user_limit"]),
    completed_count: num(row["completed_count"]),
    is_live: Boolean(row["is_live"]),
    created_at: String(row["created_at"]),
  };
}

function mapPlayer(row: Record<string, unknown>): Player {
  return {
    id: String(row["id"]),
    tg_id: num(row["tg_id"]),
    username: (row["username"] as string) ?? null,
    first_name: (row["first_name"] as string) ?? null,
    balance: num(row["balance"]),
    total_earned: num(row["total_earned"]),
    referral_earned: num(row["referral_earned"]),
    ads_watched_total: num(row["ads_watched_total"]),
    ads_watched_today: num(row["ads_watched_today"]),
    tasks_completed: num(row["tasks_completed"]),
    referrals_count: num(row["referrals_count"]),
    is_banned: Boolean(row["is_banned"]),
    created_at: String(row["created_at"]),
  };
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseAdmin.from("app_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(error.message);
  const r = data as unknown as Record<string, unknown>;
  return {
    ad_reward_min: num(r["ad_reward_min"]),
    ad_reward_max: num(r["ad_reward_max"]),
    ref_reward_min: num(r["ref_reward_min"]),
    ref_reward_max: num(r["ref_reward_max"]),
    commission_rate: num(r["commission_rate"]),
    min_withdraw: num(r["min_withdraw"]),
    withdraw_fee: num(r["withdraw_fee"]),
    req_referrals: num(r["req_referrals"]),
    req_tasks: num(r["req_tasks"]),
    req_daily_ads: num(r["req_daily_ads"]),
  };
}

/** Resolve (and lazily create) the player for a verified Telegram session. */
export async function resolvePlayer(initData: string, startParam?: string | undefined) {
  const session = await verifyInitData(initData);
  const tgId = session.user.id;
  const ref = startParam ?? session.startParam;

  const existing = await supabaseAdmin.from("players").select("*").eq("tg_id", tgId).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  let row = existing.data as Record<string, unknown> | null;

  if (!row) {
    const referrerTgId = ref && /^\d+$/.test(ref) && Number(ref) !== tgId ? Number(ref) : null;
    const insert = await supabaseAdmin
      .from("players")
      .insert({
        tg_id: tgId,
        username: session.user.username ?? null,
        first_name: session.user.first_name ?? null,
        photo_url: session.user.photo_url ?? null,
        referred_by: referrerTgId,
      })
      .select("*")
      .single();
    if (insert.error) throw new Error(insert.error.message);
    row = insert.data as unknown as Record<string, unknown>;

    if (referrerTgId) {
      const referrer = await supabaseAdmin
        .from("players")
        .select("id")
        .eq("tg_id", referrerTgId)
        .maybeSingle();
      if (referrer.data) {
        await supabaseAdmin.from("referrals").insert({
          referrer_id: String((referrer.data as Record<string, unknown>)["id"]),
          referred_id: String(row["id"]),
          bonus: 0,
          verified: false,
        });
      }
    }
  }

  // Daily ad counter reset
  if (String(row["ads_day"]).slice(0, 10) !== today()) {
    const upd = await supabaseAdmin
      .from("players")
      .update({ ads_watched_today: 0, ads_day: today() })
      .eq("id", String(row["id"]))
      .select("*")
      .single();
    if (!upd.error) row = upd.data as unknown as Record<string, unknown>;
  }

  const player = mapPlayer(row);
  if (player.is_banned) throw new Error("Your account has been suspended.");
  return { player, tgId, admin: isAdmin(tgId) };
}

async function credit(playerId: string, amount: number, kind: string, note: string) {
  const { data } = await supabaseAdmin
    .from("players")
    .select("balance,total_earned")
    .eq("id", playerId)
    .single();
  const r = (data ?? {}) as Record<string, unknown>;
  await supabaseAdmin
    .from("players")
    .update({
      balance: num(r["balance"]) + amount,
      total_earned: num(r["total_earned"]) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playerId);
  await supabaseAdmin.from("transactions").insert({ player_id: playerId, kind, amount, note });
}

/** Pay the 35% lifetime commission to the referrer of a player. */
async function payCommission(playerId: string, earned: number, settings: Settings) {
  const { data } = await supabaseAdmin
    .from("referrals")
    .select("referrer_id")
    .eq("referred_id", playerId)
    .maybeSingle();
  if (!data) return;
  const referrerId = String((data as Record<string, unknown>)["referrer_id"]);
  const commission = Math.round(earned * settings.commission_rate * 100000) / 100000;
  if (commission <= 0) return;
  const { data: refRow } = await supabaseAdmin
    .from("players")
    .select("referral_earned")
    .eq("id", referrerId)
    .single();
  await supabaseAdmin
    .from("players")
    .update({ referral_earned: num((refRow as Record<string, unknown>)?.["referral_earned"]) + commission })
    .eq("id", referrerId);
  await credit(referrerId, commission, "commission", "35% referral commission");
}

/** Mark a referral verified once the invitee is active, and pay the referrer. */
async function maybeVerifyReferral(player: Player, settings: Settings) {
  if (player.ads_watched_total + 1 < 5) return;
  const { data } = await supabaseAdmin
    .from("referrals")
    .select("id,referrer_id,verified")
    .eq("referred_id", player.id)
    .maybeSingle();
  if (!data) return;
  const r = data as Record<string, unknown>;
  if (r["verified"]) return;
  const bonus = rnd(settings.ref_reward_min, settings.ref_reward_max);
  const referrerId = String(r["referrer_id"]);
  await supabaseAdmin.from("referrals").update({ verified: true, bonus }).eq("id", String(r["id"]));
  const { data: refRow } = await supabaseAdmin
    .from("players")
    .select("referrals_count,referral_earned")
    .eq("id", referrerId)
    .single();
  const rr = (refRow ?? {}) as Record<string, unknown>;
  await supabaseAdmin
    .from("players")
    .update({
      referrals_count: num(rr["referrals_count"]) + 1,
      referral_earned: num(rr["referral_earned"]) + bonus,
    })
    .eq("id", referrerId);
  await credit(referrerId, bonus, "referral", "Verified referral bonus");
}

export async function loadState(initData: string, startParam?: string | undefined) {
  const { player, admin } = await resolvePlayer(initData, startParam);
  const settings = await getSettings();
  const pending = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("player_id", player.id)
    .eq("status", "pending")
    .maybeSingle();
  return {
    player,
    settings,
    admin,
    pendingWithdrawal: pending.data
      ? mapWithdrawal(pending.data as unknown as Record<string, unknown>)
      : null,
  };
}

export async function watchAd(initData: string) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();
  const reward = rnd(settings.ad_reward_min, settings.ad_reward_max);

  const last = await supabaseAdmin
    .from("ad_views")
    .select("created_at")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(1);
  const lastAt = (last.data?.[0] as Record<string, unknown> | undefined)?.["created_at"];
  if (lastAt && Date.now() - new Date(String(lastAt)).getTime() < 5000) {
    throw new Error("Please wait a few seconds before the next ad.");
  }

  await supabaseAdmin.from("ad_views").insert({ player_id: player.id, reward });
  await supabaseAdmin
    .from("players")
    .update({
      ads_watched_today: player.ads_watched_today + 1,
      ads_watched_total: player.ads_watched_total + 1,
      ads_day: today(),
    })
    .eq("id", player.id);
  await credit(player.id, reward, "ad", "Ad reward");
  await payCommission(player.id, reward, settings);
  await maybeVerifyReferral(player, settings);
  return { reward };
}

export async function listTasks(initData: string) {
  const { player } = await resolvePlayer(initData);
  const tasks = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("is_live", true)
    .order("created_at", { ascending: false });
  const done = await supabaseAdmin.from("task_completions").select("task_id").eq("player_id", player.id);
  const doneIds = new Set((done.data ?? []).map((d) => String((d as Record<string, unknown>)["task_id"])));
  return (tasks.data ?? [])
    .map((t) => t as unknown as Record<string, unknown>)
    .filter((t) => num(t["user_limit"]) === 0 || num(t["completed_count"]) < num(t["user_limit"]))
    .map((t) => ({
      id: String(t["id"]),
      title: String(t["title"]),
      description: (t["description"] as string) ?? "",
      task_type: String(t["task_type"]),
      link: String(t["link"]),
      reward: num(t["reward"]),
      completed: doneIds.has(String(t["id"])),
    }));
}

export async function completeTask(initData: string, taskId: string) {
  const { player, tgId } = await resolvePlayer(initData);
  const settings = await getSettings();
  const { data, error } = await supabaseAdmin.from("tasks").select("*").eq("id", taskId).single();
  if (error) throw new Error("Task not found.");
  const task = data as unknown as Record<string, unknown>;
  if (!task["is_live"]) throw new Error("This task is no longer live.");
  if (num(task["user_limit"]) > 0 && num(task["completed_count"]) >= num(task["user_limit"])) {
    throw new Error("This task reached its limit.");
  }

  const already = await supabaseAdmin
    .from("task_completions")
    .select("id")
    .eq("task_id", taskId)
    .eq("player_id", player.id)
    .maybeSingle();
  if (already.data) throw new Error("You already completed this task.");

  const reward = num(task["reward"]);
  const ins = await supabaseAdmin
    .from("task_completions")
    .insert({ task_id: taskId, player_id: player.id, reward });
  if (ins.error) throw new Error("You already completed this task.");

  await supabaseAdmin
    .from("tasks")
    .update({ completed_count: num(task["completed_count"]) + 1 })
    .eq("id", taskId);
  await supabaseAdmin
    .from("players")
    .update({ tasks_completed: player.tasks_completed + 1 })
    .eq("id", player.id);
  await credit(player.id, reward, "task", `Task: ${String(task["title"])}`);
  await payCommission(player.id, reward, settings);
  return { reward };
}

export async function leaderboard(initData: string, period: "weekly" | "monthly") {
  await resolvePlayer(initData);
  const since = new Date();
  if (period === "weekly") since.setDate(since.getDate() - 7);
  else since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const { data } = await supabaseAdmin
    .from("referrals")
    .select("referrer_id")
    .eq("verified", true)
    .gte("created_at", since.toISOString());

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String((row as Record<string, unknown>)["referrer_id"]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  if (top.length === 0) return [];
  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id,username,first_name")
    .in("id", top.map(([id]) => id));
  const byId = new Map(
    (players ?? []).map((p) => [String((p as Record<string, unknown>)["id"]), p as Record<string, unknown>]),
  );
  return top.map(([id, count], i) => {
    const p = byId.get(id);
    return {
      rank: i + 1,
      name: (p?.["username"] as string) ?? (p?.["first_name"] as string) ?? "Player",
      referrals: count,
    };
  });
}

export async function withdrawalHistory(initData: string): Promise<WithdrawalRow[]> {
  const { player } = await resolvePlayer(initData);
  const { data } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((w) => mapWithdrawal(w as unknown as Record<string, unknown>));
}

export async function requestWithdrawal(
  initData: string,
  input: { amount: number; method: string; address: string },
) {
  const { player } = await resolvePlayer(initData);
  const settings = await getSettings();

  const pending = await supabaseAdmin
    .from("withdrawals")
    .select("id")
    .eq("player_id", player.id)
    .eq("status", "pending")
    .maybeSingle();
  if (pending.data) throw new Error("You already have a withdrawal under review.");

  if (input.amount < settings.min_withdraw) {
    throw new Error(`Minimum withdrawal is $${settings.min_withdraw}.`);
  }
  if (input.amount > player.balance) throw new Error("Insufficient balance.");
  if (player.referrals_count < settings.req_referrals) {
    throw new Error(`Invite ${settings.req_referrals} people to unlock withdrawals.`);
  }
  if (player.tasks_completed < settings.req_tasks) {
    throw new Error(`Complete ${settings.req_tasks} tasks to unlock withdrawals.`);
  }
  if (player.ads_watched_today < settings.req_daily_ads) {
    throw new Error(`Watch ${settings.req_daily_ads} ads today to unlock withdrawals.`);
  }
  if (!input.address.trim()) throw new Error("Enter your payout address.");

  const net = Math.round((input.amount - settings.withdraw_fee) * 100000) / 100000;
  if (net <= 0) throw new Error("Amount too small after the fee.");

  await supabaseAdmin.from("withdrawals").insert({
    player_id: player.id,
    amount: input.amount,
    fee: settings.withdraw_fee,
    net_amount: net,
    method: input.method,
    address: input.address.trim(),
  });
  await supabaseAdmin
    .from("players")
    .update({ balance: player.balance - input.amount })
    .eq("id", player.id);
  await supabaseAdmin.from("transactions").insert({
    player_id: player.id,
    kind: "withdrawal",
    amount: -input.amount,
    note: `${input.method} payout requested`,
  });
  return { ok: true, net };
}

export async function transactions(initData: string): Promise<TxRow[]> {
  const { player } = await resolvePlayer(initData);
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((t) => mapTx(t as unknown as Record<string, unknown>));
}

/* ------------------------------- admin ------------------------------- */

async function requireAdmin(initData: string) {
  const { admin, tgId } = await resolvePlayer(initData);
  if (!admin || tgId !== ADMIN_TG_ID) throw new Error("Admin access only.");
}

export async function adminOverview(initData: string) {
  await requireAdmin(initData);
  const players = await supabaseAdmin.from("players").select("balance,total_earned,tasks_completed,ads_watched_total");
  const rows = (players.data ?? []).map((p) => p as unknown as Record<string, unknown>);
  const pendingWithdrawals = await supabaseAdmin
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return {
    totalUsers: rows.length,
    totalEarned: rows.reduce((s, r) => s + num(r["total_earned"]), 0),
    totalBalance: rows.reduce((s, r) => s + num(r["balance"]), 0),
    totalTasks: rows.reduce((s, r) => s + num(r["tasks_completed"]), 0),
    totalAds: rows.reduce((s, r) => s + num(r["ads_watched_total"]), 0),
    pendingWithdrawals: pendingWithdrawals.count ?? 0,
  };
}

export async function adminUsers(initData: string, search: string) {
  await requireAdmin(initData);
  let q = supabaseAdmin.from("players").select("*").order("total_earned", { ascending: false }).limit(100);
  if (search.trim()) q = q.ilike("username", `%${search.trim()}%`);
  const { data } = await q;
  return (data ?? []).map((p) => mapPlayer(p as unknown as Record<string, unknown>));
}

export async function adminUserTransactions(initData: string, playerId: string): Promise<TxRow[]> {
  await requireAdmin(initData);
  const { data } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((t) => mapTx(t as unknown as Record<string, unknown>));
}

export async function adminWithdrawals(initData: string, status: string): Promise<WithdrawalRow[]> {
  await requireAdmin(initData);
  const { data } = await supabaseAdmin
    .from("withdrawals")
    .select("*, players(tg_id,username,first_name)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((w) => mapWithdrawal(w as unknown as Record<string, unknown>));
}

export async function adminResolveWithdrawal(
  initData: string,
  input: { id: string; action: "paid" | "rejected"; reason?: string | undefined },
) {
  await requireAdmin(initData);
  const { data, error } = await supabaseAdmin.from("withdrawals").select("*").eq("id", input.id).single();
  if (error) throw new Error("Withdrawal not found.");
  const w = data as unknown as Record<string, unknown>;
  if (String(w["status"]) !== "pending") throw new Error("Already processed.");

  await supabaseAdmin
    .from("withdrawals")
    .update({
      status: input.action,
      reason: input.reason ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (input.action === "rejected") {
    const playerId = String(w["player_id"]);
    const { data: p } = await supabaseAdmin.from("players").select("balance").eq("id", playerId).single();
    await supabaseAdmin
      .from("players")
      .update({ balance: num((p as Record<string, unknown>)?.["balance"]) + num(w["amount"]) })
      .eq("id", playerId);
    await supabaseAdmin.from("transactions").insert({
      player_id: playerId,
      kind: "refund",
      amount: num(w["amount"]),
      note: `Withdrawal rejected: ${input.reason ?? "no reason"}`,
    });
  }
  return { ok: true };
}

export async function adminTasks(initData: string): Promise<AdminTaskRow[]> {
  await requireAdmin(initData);
  const { data } = await supabaseAdmin.from("tasks").select("*").order("created_at", { ascending: false });
  return (data ?? []).map((t) => mapAdminTask(t as unknown as Record<string, unknown>));
}

export async function adminCreateTask(
  initData: string,
  input: {
    title: string;
    description?: string | undefined;
    task_type: string;
    link: string;
    chat_username?: string | undefined;
    reward: number;
    user_limit: number;
    is_live: boolean;
  },
) {
  await requireAdmin(initData);
  const { error } = await supabaseAdmin.from("tasks").insert({
    title: input.title,
    description: input.description ?? null,
    task_type: input.task_type,
    link: input.link,
    chat_username: input.chat_username?.replace("@", "") || null,
    reward: input.reward,
    user_limit: input.user_limit,
    is_live: input.is_live,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminUpdateTask(
  initData: string,
  input: { id: string; is_live?: boolean | undefined; remove?: boolean | undefined },
) {
  await requireAdmin(initData);
  if (input.remove) {
    await supabaseAdmin.from("tasks").delete().eq("id", input.id);
    return { ok: true };
  }
  await supabaseAdmin.from("tasks").update({ is_live: input.is_live ?? true }).eq("id", input.id);
  return { ok: true };
}
