import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  fnAdminGetSettings,
  fnAdminUpdateSettings,
  fnAdminPromos,
  fnAdminCreatePromo,
  fnAdminUpdatePromo,
  fnAdminContests,
  fnAdminCreateContest,
  fnAdminUpdateContest,
  fnAdminActivity,
} from "@/lib/api.functions";
import { getInitData } from "@/lib/telegram-client";
import { getAdminToken } from "@/lib/admin-token";
import { adr } from "@/lib/format";
import { cn } from "@/lib/utils";

const auth = () => ({ initData: getInitData(), adminToken: getAdminToken() });

const NUMBER_FIELDS: { key: string; label: string }[] = [
  { key: "ad_reward_adr_min", label: "Ad reward min (ADR)" },
  { key: "ad_reward_adr_max", label: "Ad reward max (ADR)" },
  { key: "ref_reward_adr_min", label: "Referral min (ADR)" },
  { key: "ref_reward_adr_max", label: "Referral max (ADR)" },
  { key: "commission_rate", label: "Commission rate (0-1)" },
  { key: "adr_rate", label: "ADR → USDT rate" },
  { key: "min_swap_adr", label: "Min swap (ADR)" },
  { key: "min_withdraw", label: "Min withdraw ($)" },
  { key: "withdraw_fee", label: "Withdraw fee ($)" },
  { key: "req_referrals", label: "Required referrals" },
  { key: "req_tasks", label: "Required tasks" },
  { key: "req_daily_ads", label: "Required daily ads" },
  { key: "tap_reward", label: "Tap reward (ADR)" },
  { key: "energy_max", label: "Energy max" },
  { key: "energy_regen_sec", label: "Energy regen (sec)" },
  { key: "game_min", label: "Game reward min (ADR)" },
  { key: "game_max", label: "Game reward max (ADR)" },
  { key: "free_spins", label: "Free spins/day" },
  { key: "free_scratch", label: "Free scratch/day" },
  { key: "max_extra_spins", label: "Max extra spins" },
  { key: "max_extra_scratch", label: "Max extra scratch" },
  { key: "login_reward", label: "Daily login (ADR)" },
];

const FEATURE_KEYS = ["ads", "tap", "spin", "scratch", "daily", "promo", "tasks", "contest"];

export function AdminSettings() {
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fnAdminGetSettings({ data: auth() }),
  });
  const [form, setForm] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    const s = q.data as unknown as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const f of NUMBER_FIELDS) next[f.key] = String(s[f.key] ?? 0);
    setForm(next);
    const feat = (s["features"] as Record<string, boolean>) ?? {};
    setFeatures(Object.fromEntries(FEATURE_KEYS.map((k) => [k, feat[k] !== false])));
  }, [q.data]);

  const save = async () => {
    setBusy(true);
    try {
      const patch: Record<string, number | boolean | Record<string, boolean>> = { features };
      for (const f of NUMBER_FIELDS) {
        const v = Number(form[f.key]);
        if (Number.isFinite(v)) patch[f.key] = v;
      }
      await fnAdminUpdateSettings({ data: { ...auth(), patch } });
      toast.success("Settings saved");
      await q.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setBusy(false);
    }
  };

  if (q.isLoading) return <p className="py-10 text-center text-xs text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Feature toggles</h3>
        <div className="grid grid-cols-2 gap-2">
          {FEATURE_KEYS.map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-2xl glass-soft px-3 py-2 text-xs capitalize"
            >
              <span>{k}</span>
              <Switch
                checked={features[k] ?? true}
                onCheckedChange={(v) => setFeatures((f) => ({ ...f, [k]: v }))}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Rewards & limits</h3>
        <div className="grid grid-cols-2 gap-2">
          {NUMBER_FIELDS.map((f) => (
            <label key={f.key} className="space-y-1">
              <span className="text-[10px] text-muted-foreground">{f.label}</span>
              <Input
                value={form[f.key] ?? ""}
                inputMode="decimal"
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                className="rounded-2xl glass-soft border-white/10 text-xs"
              />
            </label>
          ))}
        </div>
        <Button
          onClick={save}
          disabled={busy}
          className="w-full rounded-2xl gradient-primary text-primary-foreground"
        >
          <Save className="mr-1.5 h-4 w-4" /> Save settings
        </Button>
      </GlassCard>
    </div>
  );
}

const PROMO_KINDS = [
  { id: "adr", label: "ADR bonus" },
  { id: "spin", label: "Extra spins" },
  { id: "scratch", label: "Extra scratch" },
];

export function AdminPromos() {
  const q = useQuery({ queryKey: ["admin", "promos"], queryFn: () => fnAdminPromos({ data: auth() }) });
  const [form, setForm] = useState({ code: "", kind: "adr", amount: "100", max_uses: "100", days: "7" });

  const create = async () => {
    try {
      await fnAdminCreatePromo({
        data: {
          ...auth(),
          code: form.code,
          kind: form.kind,
          amount: Number(form.amount),
          max_uses: Number(form.max_uses),
          days: Number(form.days),
        },
      });
      toast.success("Promo code created");
      setForm({ ...form, code: "" });
      await q.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create promo");
    }
  };

  const update = async (id: string, patch: { is_active?: boolean; remove?: boolean }) => {
    await fnAdminUpdatePromo({ data: { ...auth(), id, ...patch } });
    await q.refetch();
  };

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Create promo code</h3>
        <Input
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="CODE2026"
          className="rounded-2xl glass-soft border-white/10"
        />
        <div className="grid grid-cols-3 gap-2">
          {PROMO_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setForm({ ...form, kind: k.id })}
              className={cn(
                "rounded-2xl py-2 text-[11px]",
                form.kind === k.id ? "gradient-primary text-primary-foreground" : "glass-soft text-muted-foreground",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="Amount"
            className="rounded-2xl glass-soft border-white/10 text-xs"
          />
          <Input
            value={form.max_uses}
            onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            placeholder="Max uses"
            className="rounded-2xl glass-soft border-white/10 text-xs"
          />
          <Input
            value={form.days}
            onChange={(e) => setForm({ ...form, days: e.target.value })}
            placeholder="Days"
            className="rounded-2xl glass-soft border-white/10 text-xs"
          />
        </div>
        <Button onClick={create} className="w-full rounded-2xl gradient-primary text-primary-foreground">
          <Plus className="mr-1.5 h-4 w-4" /> Create code
        </Button>
      </GlassCard>

      {(q.data ?? []).map((p) => (
        <GlassCard key={p.id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{p.code}</p>
            <p className="text-[11px] text-muted-foreground">
              {p.kind} · {p.kind === "adr" ? adr(p.amount) : `${p.amount}x`} · {p.used_count}/
              {p.max_uses || "∞"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={p.is_active} onCheckedChange={(v) => update(p.id, { is_active: v })} />
            <button
              onClick={() => update(p.id, { remove: true })}
              className="rounded-xl glass-soft p-2 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

const METRICS = [
  { id: "invites", label: "Invites" },
  { id: "adr", label: "ADR earned" },
  { id: "ads", label: "Ad watch race" },
];

export function AdminContests() {
  const q = useQuery({ queryKey: ["admin", "contests"], queryFn: () => fnAdminContests({ data: auth() }) });
  const [form, setForm] = useState({
    title: "",
    description: "",
    metric: "invites",
    reward_type: "adr",
    reward_amount: "1000",
    days: "7",
  });

  const create = async () => {
    try {
      await fnAdminCreateContest({
        data: {
          ...auth(),
          title: form.title,
          description: form.description,
          metric: form.metric,
          reward_type: form.reward_type,
          reward_amount: Number(form.reward_amount),
          days: Number(form.days),
        },
      });
      toast.success("Contest created");
      setForm({ ...form, title: "", description: "" });
      await q.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create contest");
    }
  };

  const update = async (id: string, patch: { is_active?: boolean; remove?: boolean }) => {
    await fnAdminUpdateContest({ data: { ...auth(), id, ...patch } });
    await q.refetch();
  };

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Create contest</h3>
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
        <div className="grid grid-cols-3 gap-2">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setForm({ ...form, metric: m.id })}
              className={cn(
                "rounded-2xl py-2 text-[11px]",
                form.metric === m.id ? "gradient-primary text-primary-foreground" : "glass-soft text-muted-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["adr", "usdt"].map((t) => (
            <button
              key={t}
              onClick={() => setForm({ ...form, reward_type: t })}
              className={cn(
                "rounded-2xl py-2 text-[11px] uppercase",
                form.reward_type === t ? "gradient-gold text-background" : "glass-soft text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={form.reward_amount}
            onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
            placeholder="Reward"
            className="rounded-2xl glass-soft border-white/10 text-xs"
          />
          <Input
            value={form.days}
            onChange={(e) => setForm({ ...form, days: e.target.value })}
            placeholder="Days"
            className="rounded-2xl glass-soft border-white/10 text-xs"
          />
        </div>
        <Button onClick={create} className="w-full rounded-2xl gradient-primary text-primary-foreground">
          <Plus className="mr-1.5 h-4 w-4" /> Create contest
        </Button>
      </GlassCard>

      {(q.data ?? []).map((c) => (
        <GlassCard key={c.id} className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{c.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {c.metric} · {c.reward_type === "adr" ? adr(c.reward_amount) : `$${c.reward_amount}`} · ends{" "}
              {new Date(c.ends_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={c.is_active} onCheckedChange={(v) => update(c.id, { is_active: v })} />
            <button
              onClick={() => update(c.id, { remove: true })}
              className="rounded-xl glass-soft p-2 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function AdminActivity() {
  const q = useQuery({ queryKey: ["admin", "activity"], queryFn: () => fnAdminActivity({ data: auth() }) });
  return (
    <div className="space-y-2">
      {(q.data ?? []).length === 0 ? (
        <GlassCard className="py-8 text-center text-xs text-muted-foreground">No activity yet.</GlassCard>
      ) : (
        (q.data ?? []).map((a) => (
          <GlassCard key={a.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-xs font-medium">
                {a.name} · {a.game}
                {a.doubled ? " ×2" : ""}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(a.created_at).toLocaleString()}
              </p>
            </div>
            <span className="text-xs font-semibold text-gradient">{adr(a.reward)}</span>
          </GlassCard>
        ))
      )}
    </div>
  );
}
