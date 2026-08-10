import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Stat } from "@/components/miniapp/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  fnAdminOverview,
  fnAdminUsers,
  fnAdminWithdrawals,
  fnAdminResolveWithdrawal,
  fnAdminTasks,
  fnAdminCreateTask,
  fnAdminUpdateTask,
  fnAdminUserTransactions,
} from "@/lib/api.functions";
import { getInitData } from "@/lib/telegram-client";
import { getAdminToken, setAdminToken, clearAdminToken } from "@/lib/admin-token";
import { LoadingScreen, OpenInTelegram } from "@/components/miniapp/Splash";
import { useAppState, useTelegramEnv } from "@/lib/useAppState";
import { usd } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Ads Rewards" },
      {
        name: "description",
        content:
          "Manage Ads Rewards users, tasks and withdrawal payouts: review requests, add Telegram tasks and track total earnings.",
      },
      { property: "og:title", content: "Admin Panel — Ads Rewards" },
      {
        property: "og:description",
        content: "Review withdrawals, manage tasks and monitor users of the Ads Rewards mini app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const SECTIONS = ["Overview", "Users", "Withdrawals", "Tasks"] as const;
type Section = (typeof SECTIONS)[number];

function AdminPage() {
  const [section, setSection] = useState<Section>("Overview");
  const [verified, setVerified] = useState(() => !!getAdminToken());
  const env = useTelegramEnv();
  const state = useAppState(env === "telegram");

  if (env === "checking" || state.isLoading || (env === "telegram" && !state.data)) {
    return <LoadingScreen message="Loading admin panel…" />;
  }
  if (env === "browser") {
    return <OpenInTelegram />;
  }

  if (!state.data?.admin) {
    return <Centered>Admin access only.</Centered>;
  }

  if (!verified) return <OtpGate onVerified={() => setVerified(true)} />;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-10 pt-6">
      <header className="mb-4 flex items-center gap-3">
        <Link to="/" className="glass flex h-9 w-9 items-center justify-center rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-lg font-bold">
          Admin <span className="text-gradient">Panel</span>
        </h1>
        <button
          onClick={() => {
            clearAdminToken();
            setVerified(false);
          }}
          className="glass-soft rounded-full px-3 py-1.5 text-[11px] text-muted-foreground"
        >
          Lock
        </button>
      </header>


      <div className="glass-soft mb-4 grid grid-cols-4 gap-1 rounded-2xl p-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "rounded-xl py-2 text-[11px] font-medium transition-colors",
              section === s ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {section === "Overview" && <Overview />}
      {section === "Users" && <Users />}
      {section === "Withdrawals" && <Withdrawals />}
      {section === "Tasks" && <Tasks />}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass rounded-3xl px-8 py-10 text-center text-sm text-muted-foreground">
        {children}
      </div>
    </main>
  );
}

function OtpGate({ onVerified }: { onVerified: () => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setBusy(true);
    try {
      await fnAdminRequestOtp({ data: { initData: getInitData() } });
      setSent(true);
      toast.success("Code sent to your Telegram chat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      const res = await fnAdminVerifyOtp({ data: { initData: getInitData(), code } });
      setAdminToken(res.token, res.expiresAt);
      onVerified();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm rounded-[2rem] px-8 py-10 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
          <Lock className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold">
          Admin <span className="text-gradient">Verification</span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {sent
            ? "Enter the 6-digit code we sent to your Telegram chat."
            : "We'll send a one-time code to your Telegram account before opening the panel."}
        </p>

        {sent ? (
          <div className="mt-6 space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="••••••"
              className="rounded-2xl glass-soft border-white/10 text-center text-lg tracking-[0.4em]"
            />
            <Button
              disabled={busy || code.length !== 6}
              onClick={verify}
              className="w-full rounded-2xl gradient-primary text-primary-foreground"
            >
              Unlock panel
            </Button>
            <button
              onClick={request}
              disabled={busy}
              className="text-[11px] text-muted-foreground underline"
            >
              Resend code
            </button>
          </div>
        ) : (
          <Button
            disabled={busy}
            onClick={request}
            className="mt-6 w-full rounded-2xl gradient-primary text-primary-foreground"
          >
            Send code on Telegram
          </Button>
        )}

        <Link to="/" className="mt-4 block text-[11px] text-muted-foreground">
          Back to app
        </Link>
      </div>
    </main>
  );
}


function Overview() {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fnAdminOverview({ data: { initData: getInitData(), adminToken: getAdminToken() } }),
  });
  const d = q.data;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Total users" value={String(d?.totalUsers ?? 0)} accent />
      <Stat label="Earned by users" value={usd(d?.totalEarned, 3)} />
      <Stat label="Current balances" value={usd(d?.totalBalance, 3)} />
      <Stat label="Tasks completed" value={String(d?.totalTasks ?? 0)} />
      <Stat label="Ads watched" value={String(d?.totalAds ?? 0)} />
      <Stat label="Pending payouts" value={String(d?.pendingWithdrawals ?? 0)} />
    </div>
  );
}

function Users() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => fnAdminUsers({ data: { initData: getInitData(), adminToken: getAdminToken(), search } }),
  });
  const txs = useQuery({
    queryKey: ["admin", "txs", open],
    enabled: !!open,
    queryFn: () => fnAdminUserTransactions({ data: { initData: getInitData(), adminToken: getAdminToken(), playerId: open! } }),
  });

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by username"
        className="rounded-2xl glass-soft border-white/10"
      />
      {(q.data ?? []).map((u) => (
        <GlassCard key={u.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {u.username ? `@${u.username}` : (u.first_name ?? "Player")}
              </p>
              <p className="text-[11px] text-muted-foreground">ID {u.tg_id}</p>
            </div>
            <p className="text-sm font-semibold text-gradient">{usd(u.balance)}</p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-muted-foreground">
            <div>
              <p className="text-xs text-foreground">{u.tasks_completed}</p>tasks
            </div>
            <div>
              <p className="text-xs text-foreground">{u.referrals_count}</p>refs
            </div>
            <div>
              <p className="text-xs text-foreground">{u.ads_watched_total}</p>ads
            </div>
            <div>
              <p className="text-xs text-foreground">{usd(u.total_earned, 3)}</p>earned
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full rounded-2xl glass-soft text-xs"
            onClick={() => setOpen(open === u.id ? null : u.id)}
          >
            {open === u.id ? "Hide" : "Transactions"}
          </Button>
          {open === u.id ? (
            <div className="space-y-1 rounded-2xl glass-soft p-3 text-[11px]">
              {(txs.data ?? []).length === 0 ? (
                <p className="text-muted-foreground">No transactions.</p>
              ) : (
                (txs.data ?? []).map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span className="text-muted-foreground">{t.note ?? t.kind}</span>
                    <span className={t.amount >= 0 ? "text-primary" : "text-destructive"}>
                      {usd(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </GlassCard>
      ))}
    </div>
  );
}

function Withdrawals() {
  const [status, setStatus] = useState("pending");
  const [reason, setReason] = useState<Record<string, string>>({});
  const q = useQuery({
    queryKey: ["admin", "withdrawals", status],
    queryFn: () => fnAdminWithdrawals({ data: { initData: getInitData(), adminToken: getAdminToken(), status } }),
  });

  const resolve = async (id: string, action: "paid" | "rejected") => {
    try {
      await fnAdminResolveWithdrawal({
        data: { initData: getInitData(), adminToken: getAdminToken(), id, action, reason: reason[id] },
      });
      toast.success(action === "paid" ? "Marked as paid" : "Rejected & refunded");
      await q.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="glass-soft grid grid-cols-3 gap-1 rounded-2xl p-1">
        {["pending", "paid", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-xl py-2 text-[11px] font-medium capitalize",
              status === s ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {(q.data ?? []).length === 0 ? (
        <GlassCard className="py-8 text-center text-xs text-muted-foreground">
          Nothing here.
        </GlassCard>
      ) : (
        (q.data ?? []).map((w) => (
          <GlassCard key={w.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{usd(w.amount)}</p>
                <p className="text-[11px] text-muted-foreground">
                  net {usd(w.net_amount)} · fee {usd(w.fee, 2)}
                </p>
              </div>
              <span className="rounded-full glass-soft px-2 py-0.5 text-[10px] uppercase">
                {w.method === "upi" ? "UPI" : "USDT"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {w.user_name ? `@${w.user_name}` : ""} · ID {w.user_tg_id}
            </p>
            <div className="flex items-center gap-2 rounded-2xl glass-soft px-3 py-2">
              <p className="flex-1 break-all text-[11px]">{w.address}</p>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(w.address);
                  toast.success("Address copied");
                }}
                className="shrink-0 rounded-xl gradient-primary p-2 text-primary-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {w.status === "pending" ? (
              <>
                <Input
                  value={reason[w.id] ?? ""}
                  onChange={(e) => setReason((r) => ({ ...r, [w.id]: e.target.value }))}
                  placeholder="Reason (for reject)"
                  className="rounded-2xl glass-soft border-white/10 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-2xl gradient-primary text-primary-foreground"
                    onClick={() => resolve(w.id, "paid")}
                  >
                    Paid
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-2xl"
                    onClick={() => resolve(w.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </>
            ) : w.reason ? (
              <p className="text-[11px] text-destructive">Reason: {w.reason}</p>
            ) : null}
          </GlassCard>
        ))
      )}
    </div>
  );
}

const TASK_TYPES = [
  { id: "channel", label: "Channel (verify)" },
  { id: "group", label: "Group (verify)" },
  { id: "bot", label: "Bot / mini app" },
  { id: "other", label: "Other" },
];

function Tasks() {
  const q = useQuery({
    queryKey: ["admin", "tasks"],
    queryFn: () => fnAdminTasks({ data: { initData: getInitData(), adminToken: getAdminToken() } }),
  });
  const [form, setForm] = useState({
    title: "",
    description: "",
    task_type: "channel",
    link: "",
    chat_username: "",
    reward: "0.005",
    user_limit: "1000",
    is_live: true,
  });

  const create = async () => {
    try {
      await fnAdminCreateTask({
        data: {
          initData: getInitData(), adminToken: getAdminToken(),
          title: form.title,
          description: form.description,
          task_type: form.task_type,
          link: form.link,
          chat_username: form.chat_username,
          reward: Number(form.reward),
          user_limit: Number(form.user_limit),
          is_live: form.is_live,
        },
      });
      toast.success("Task created");
      setForm({ ...form, title: "", description: "", link: "", chat_username: "" });
      await q.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create task");
    }
  };

  const update = async (id: string, patch: { is_live?: boolean; remove?: boolean }) => {
    await fnAdminUpdateTask({ data: { initData: getInitData(), adminToken: getAdminToken(), id, ...patch } });
    await q.refetch();
  };

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Add task</h3>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title"
          className="rounded-2xl glass-soft border-white/10"
        />
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description (optional)"
          className="rounded-2xl glass-soft border-white/10"
        />
        <div className="grid grid-cols-2 gap-2">
          {TASK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setForm({ ...form, task_type: t.id })}
              className={cn(
                "rounded-2xl py-2 text-[11px]",
                form.task_type === t.id
                  ? "gradient-primary text-primary-foreground"
                  : "glass-soft text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="https://t.me/…"
          className="rounded-2xl glass-soft border-white/10"
        />
        {form.task_type === "channel" || form.task_type === "group" ? (
          <Input
            value={form.chat_username}
            onChange={(e) => setForm({ ...form, chat_username: e.target.value })}
            placeholder="@channelusername (for verification)"
            className="rounded-2xl glass-soft border-white/10"
          />
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={form.reward}
            onChange={(e) => setForm({ ...form, reward: e.target.value })}
            placeholder="Reward $"
            className="rounded-2xl glass-soft border-white/10"
          />
          <Input
            value={form.user_limit}
            onChange={(e) => setForm({ ...form, user_limit: e.target.value })}
            placeholder="User limit"
            className="rounded-2xl glass-soft border-white/10"
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl glass-soft px-3 py-2 text-xs">
          <span>Live</span>
          <Switch
            checked={form.is_live}
            onCheckedChange={(v) => setForm({ ...form, is_live: v })}
          />
        </div>
        <Button
          onClick={create}
          className="w-full rounded-2xl gradient-primary text-primary-foreground"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create task
        </Button>
      </GlassCard>

      {(q.data ?? []).map((t) => (
        <GlassCard key={t.id} className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {t.task_type} · {usd(t.reward, 3)} · {t.completed_count}/{t.user_limit}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={t.is_live} onCheckedChange={(v) => update(t.id, { is_live: v })} />
              <button
                onClick={() => update(t.id, { remove: true })}
                className="rounded-xl glass-soft p-2 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
