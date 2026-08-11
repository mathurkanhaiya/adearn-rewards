import { createServerFn } from "@tanstack/react-start";

import * as api from "./app.server";
import * as games from "./games.server";

export const fnLoadState = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; startParam?: string | undefined }) => d)
  .handler(async ({ data }) => api.loadState(data.initData, data.startParam));

export const fnWatchAd = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.watchAd(data.initData));

export const fnListTasks = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.listTasks(data.initData));

export const fnCompleteTask = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; taskId: string }) => d)
  .handler(async ({ data }) => api.completeTask(data.initData, data.taskId));

export const fnLeaderboard = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; period: "weekly" | "monthly" }) => d)
  .handler(async ({ data }) => api.leaderboard(data.initData, data.period));

export const fnWithdrawals = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.withdrawalHistory(data.initData));

export const fnRequestWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; amount: number; method: string; address: string }) => d)
  .handler(async ({ data }) =>
    api.requestWithdrawal(data.initData, {
      amount: data.amount,
      method: data.method,
      address: data.address,
    }),
  );

export const fnTransactions = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.transactions(data.initData));

export const fnAdminRequestOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.adminRequestOtp(data.initData));

export const fnAdminVerifyOtp = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; code: string }) => d)
  .handler(async ({ data }) => api.adminVerifyOtp(data.initData, data.code));

export const fnAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => api.adminOverview(data.initData, data.adminToken));

export const fnAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string; search: string }) => d)
  .handler(async ({ data }) => api.adminUsers(data.initData, data.adminToken, data.search));

export const fnAdminUserTransactions = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string; playerId: string }) => d)
  .handler(async ({ data }) =>
    api.adminUserTransactions(data.initData, data.adminToken, data.playerId),
  );

export const fnAdminWithdrawals = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string; status: string }) => d)
  .handler(async ({ data }) => api.adminWithdrawals(data.initData, data.adminToken, data.status));

export const fnAdminResolveWithdrawal = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      id: string;
      action: "paid" | "rejected";
      reason?: string | undefined;
    }) => d,
  )
  .handler(async ({ data }) =>
    api.adminResolveWithdrawal(data.initData, data.adminToken, {
      id: data.id,
      action: data.action,
      reason: data.reason,
    }),
  );

export const fnAdminTasks = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => api.adminTasks(data.initData, data.adminToken));

export const fnAdminCreateTask = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      title: string;
      description?: string | undefined;
      task_type: string;
      link: string;
      chat_username?: string | undefined;
      reward: number;
      user_limit: number;
      is_live: boolean;
    }) => d,
  )
  .handler(async ({ data }) => api.adminCreateTask(data.initData, data.adminToken, data));

export const fnAdminUpdateTask = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      id: string;
      is_live?: boolean | undefined;
      remove?: boolean | undefined;
    }) => d,
  )
  .handler(async ({ data }) => api.adminUpdateTask(data.initData, data.adminToken, data));

/* --------------------------- games & new features -------------------------- */

export const fnPlayGame = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; game: "spin" | "scratch"; doubled: boolean }) => d)
  .handler(async ({ data }) => games.playGame(data.initData, data.game, data.doubled));

export const fnExtraAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; game: "spin" | "scratch" }) => d)
  .handler(async ({ data }) => games.grantExtraAttempt(data.initData, data.game));

export const fnTap = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; taps: number }) => d)
  .handler(async ({ data }) => games.tap(data.initData, data.taps));

export const fnRefillEnergy = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => games.refillEnergy(data.initData));

export const fnSwapAdr = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; amount: number }) => d)
  .handler(async ({ data }) => games.swapAdr(data.initData, data.amount));

export const fnClaimDaily = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; doubled: boolean }) => d)
  .handler(async ({ data }) => games.claimDaily(data.initData, data.doubled));

export const fnClaimPromo = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; code: string }) => d)
  .handler(async ({ data }) => games.claimPromo(data.initData, data.code));

export const fnContests = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => games.listContests(data.initData));

export const fnBoardTop = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; board: "invites" | "usdt" | "adr" }) => d)
  .handler(async ({ data }) => games.boardTop(data.initData, data.board));

/* --------------------------------- admin --------------------------------- */

export const fnAdminGetSettings = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => games.adminGetSettings(data.initData, data.adminToken));

export const fnAdminUpdateSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      patch: Record<string, number | boolean | Record<string, boolean>>;
    }) => d,
  )
  .handler(async ({ data }) => games.adminUpdateSettings(data.initData, data.adminToken, data.patch));

export const fnAdminAdjust = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      playerId: string;
      currency: "usd" | "adr";
      amount: number;
      note: string;
    }) => d,
  )
  .handler(async ({ data }) => games.adminAdjust(data.initData, data.adminToken, data));

export const fnAdminSetBan = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string; playerId: string; banned: boolean }) => d)
  .handler(async ({ data }) => games.adminSetBan(data.initData, data.adminToken, data));

export const fnAdminPromos = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => games.adminPromos(data.initData, data.adminToken));

export const fnAdminCreatePromo = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      code: string;
      kind: string;
      amount: number;
      max_uses: number;
      days: number;
    }) => d,
  )
  .handler(async ({ data }) => games.adminCreatePromo(data.initData, data.adminToken, data));

export const fnAdminUpdatePromo = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      id: string;
      is_active?: boolean | undefined;
      remove?: boolean | undefined;
    }) => d,
  )
  .handler(async ({ data }) => games.adminUpdatePromo(data.initData, data.adminToken, data));

export const fnAdminContests = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => games.adminContests(data.initData, data.adminToken));

export const fnAdminCreateContest = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      title: string;
      description?: string | undefined;
      metric: string;
      reward_type: string;
      reward_amount: number;
      days: number;
    }) => d,
  )
  .handler(async ({ data }) => games.adminCreateContest(data.initData, data.adminToken, data));

export const fnAdminUpdateContest = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      adminToken: string;
      id: string;
      is_active?: boolean | undefined;
      remove?: boolean | undefined;
    }) => d,
  )
  .handler(async ({ data }) => games.adminUpdateContest(data.initData, data.adminToken, data));

export const fnAdminActivity = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; adminToken: string }) => d)
  .handler(async ({ data }) => games.adminActivity(data.initData, data.adminToken));
