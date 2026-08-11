import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, CircleDollarSign, Clock, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Stat } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fnRequestWithdrawal, fnWithdrawals, fnTransactions, fnSwapAdr } from "@/lib/api.functions";
import { fx } from "@/lib/fx";
import { getInitData } from "@/lib/telegram-client";
import { usd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Player, Settings, WithdrawalRow } from "@/lib/app.server";

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full",
          ok ? "gradient-primary text-primary-foreground" : "glass-soft text-muted-foreground",
        )}
      >
        {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      </span>
      <span className={ok ? "" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}

export function ProfileTab({
  player,
  settings,
  pending,
  onDone,
}: {
  player: Player;
  settings: Settings;
  pending: WithdrawalRow | null;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(String(settings.min_withdraw));
  const [method, setMethod] = useState<"upi" | "usdt_polygon">("upi");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [swapAmount, setSwapAmount] = useState(String(settings.min_swap_adr));
  const [swapping, setSwapping] = useState(false);

  const doSwap = async () => {
    setSwapping(true);
    try {
      const res = await fnSwapAdr({ data: { initData: getInitData(), amount: Number(swapAmount) } });
      fx.win();
      toast.success(`Swapped ${res.adr} ADR for ${usd(res.usd)}`);
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setSwapping(false);
    }
  };

  const history = useQuery({
    queryKey: ["withdrawals"],
    queryFn: () => fnWithdrawals({ data: { initData: getInitData() } }),
  });
  const txs = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fnTransactions({ data: { initData: getInitData() } }),
  });

  const okRefs = player.referrals_count >= settings.req_referrals;
  const okTasks = player.tasks_completed >= settings.req_tasks;
  const okAds = player.ads_watched_today >= settings.req_daily_ads;
  const eligible = okRefs && okTasks && okAds && !pending;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fnRequestWithdrawal({
        data: { initData: getInitData(), amount: Number(amount), method, address },
      });
      toast.success(`Request sent for review · you receive ${usd(res.net)}`);
      setAddress("");
      await history.refetch();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
          {(player.first_name ?? "U").slice(0, 1).toUpperCase()}
        </div>
        <p className="mt-3 font-semibold">{player.first_name ?? "Player"}</p>
        <p className="text-xs text-muted-foreground">
          {player.username ? `@${player.username}` : `ID ${player.tg_id}`}
        </p>
        <p className="mt-4 text-3xl font-bold text-gradient">{usd(player.balance)}</p>
        <p className="text-[11px] text-muted-foreground">Available balance</p>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="All-time earned" value={usd(player.total_earned)} />
        <Stat label="Referral earnings" value={usd(player.referral_earned)} />
        <Stat label="Tasks completed" value={String(player.tasks_completed)} />
        <Stat label="Ads watched" value={String(player.ads_watched_total)} />
        <Stat label="ADR balance" value={`${player.adr_balance} ADR`} accent />
        <Stat label="ADR earned" value={`${player.adr_earned} ADR`} />
      </div>

      <GlassCard className="space-y-3">
        <h3 className="text-sm font-semibold">Swap ADR → $</h3>
        <p className="text-xs text-muted-foreground">
          Minimum {settings.min_swap_adr} ADR · rate {settings.min_swap_adr} ADR ={" "}
          {usd(settings.min_swap_adr * settings.adr_rate, 2)}
        </p>
        <div className="flex gap-2">
          <Input
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            inputMode="numeric"
            className="rounded-2xl glass-soft border-white/10"
          />
          <Button
            disabled={swapping}
            onClick={doSwap}
            className="h-10 rounded-2xl gradient-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Swap
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Withdraw</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum {usd(settings.min_withdraw, 2)} · fee {usd(settings.withdraw_fee, 2)} · one request
          at a time
        </p>

        <div className="space-y-2 rounded-2xl glass-soft p-3">
          <Req ok={okRefs} label={`Invite ${settings.req_referrals} people (${player.referrals_count}/${settings.req_referrals})`} />
          <Req ok={okTasks} label={`Complete ${settings.req_tasks} tasks (${player.tasks_completed}/${settings.req_tasks})`} />
          <Req ok={okAds} label={`Watch ${settings.req_daily_ads} ads today (${player.ads_watched_today}/${settings.req_daily_ads})`} />
        </div>

        {pending ? (
          <div className="flex items-center gap-2 rounded-2xl glass-soft p-3 text-xs">
            <Clock className="h-4 w-4 text-gold" />
            Request of {usd(pending.amount)} is under admin review.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["upi", "usdt_polygon"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-2xl py-2 text-xs font-medium transition-colors",
                    method === m ? "gradient-primary text-primary-foreground" : "glass-soft text-muted-foreground",
                  )}
                >
                  {m === "upi" ? "UPI" : "USDT (Polygon)"}
                </button>
              ))}
            </div>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Amount in $"
              className="rounded-2xl glass-soft border-white/10"
            />
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={method === "upi" ? "your@upi" : "0x… Polygon address"}
              className="rounded-2xl glass-soft border-white/10"
            />
            <Button
              disabled={!eligible || busy}
              onClick={submit}
              className="h-11 w-full rounded-2xl gradient-primary font-semibold text-primary-foreground hover:opacity-90"
            >
              <CircleDollarSign className="mr-1.5 h-4 w-4" />
              {busy ? "Sending…" : "Request withdrawal"}
            </Button>
          </>
        )}
      </GlassCard>

      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Withdrawal history</h3>
        {(history.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No withdrawals yet.</p>
        ) : (
          (history.data ?? []).map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-2xl glass-soft px-3 py-2 text-xs">
              <div>
                <p className="font-medium">{usd(w.amount)}</p>
                <p className="text-muted-foreground">{w.method === "upi" ? "UPI" : "USDT Polygon"}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] capitalize",
                  w.status === "paid" && "bg-primary/20 text-primary",
                  w.status === "pending" && "bg-gold/20 text-gold",
                  w.status === "rejected" && "bg-destructive/20 text-destructive",
                )}
              >
                {w.status}
              </span>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard className="space-y-2">
        <h3 className="text-sm font-semibold">Recent activity</h3>
        {(txs.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here yet.</p>
        ) : (
          (txs.data ?? []).slice(0, 15).map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t.note ?? t.kind}</span>
              <span className={t.amount >= 0 ? "text-primary" : "text-destructive"}>
                {t.amount >= 0 ? "+" : ""}
                {usd(t.amount)}
              </span>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
