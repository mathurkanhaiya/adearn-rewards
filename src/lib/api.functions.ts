import { createServerFn } from "@tanstack/react-start";

import * as api from "./app.server";

export const fnLoadState = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; startParam?: string }) => d)
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

export const fnAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.adminOverview(data.initData));

export const fnAdminUsers = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; search: string }) => d)
  .handler(async ({ data }) => api.adminUsers(data.initData, data.search));

export const fnAdminUserTransactions = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; playerId: string }) => d)
  .handler(async ({ data }) => api.adminUserTransactions(data.initData, data.playerId));

export const fnAdminWithdrawals = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; status: string }) => d)
  .handler(async ({ data }) => api.adminWithdrawals(data.initData, data.status));

export const fnAdminResolveWithdrawal = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; id: string; action: "paid" | "rejected"; reason?: string }) => d)
  .handler(async ({ data }) =>
    api.adminResolveWithdrawal(data.initData, {
      id: data.id,
      action: data.action,
      reason: data.reason,
    }),
  );

export const fnAdminTasks = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string }) => d)
  .handler(async ({ data }) => api.adminTasks(data.initData));

export const fnAdminCreateTask = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      initData: string;
      title: string;
      description?: string;
      task_type: string;
      link: string;
      chat_username?: string;
      reward: number;
      user_limit: number;
      is_live: boolean;
    }) => d,
  )
  .handler(async ({ data }) => api.adminCreateTask(data.initData, data));

export const fnAdminUpdateTask = createServerFn({ method: "POST" })
  .inputValidator((d: { initData: string; id: string; is_live?: boolean; remove?: boolean }) => d)
  .handler(async ({ data }) => api.adminUpdateTask(data.initData, data));
