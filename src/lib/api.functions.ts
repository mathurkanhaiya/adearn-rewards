import { createServerFn } from "@tanstack/react-start";

import * as api from "./app.server";

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
