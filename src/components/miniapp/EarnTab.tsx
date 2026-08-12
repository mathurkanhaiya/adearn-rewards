import { useState } from "react";
import { Play, Zap, Flame, Coins, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Stat } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fnWatchAd } from "@/lib/api.functions";
import { getInitData, showAd, AD_BLOCK_REWARD } from "@/lib/telegram-client";
import { fx } from "@/lib/fx";
import { adr, usd } from "@/lib/format";
import type { Player, Settings } from "@/lib/app.server";

export function EarnTab({
  player,
  settings,
  onDone,
}: {
  player: Player;
  settings: Settings;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const watch = async () => {
    setBusy(true);
    try {
      await showAd(AD_BLOCK_REWARD);
      const res = await fnWatchAd({ data: { initData: getInitData() } });
      fx.win();
      toast.success(`+${adr(res.reward)} added to your ADR balance`);
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Ad not completed");
    } finally {
      setBusy(false);
    }
  };

  const dailyGoal = settings.req_daily_ads;
  const pct = Math.min(100, (player.ads_watched_today / dailyGoal) * 100);
  const swapValue = player.adr_balance * settings.adr_rate;

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden text-center">
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your $ADR balance</p>
        <p className="mt-2 text-4xl font-bold text-gradient">{adr(player.adr_balance)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          ≈ {usd(swapValue)} after swap · all-time {adr(player.adr_earned)}
        </p>
      </GlassCard>

      <GlassCard className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-gold">
          <ArrowLeftRight className="h-5 w-5 text-background" />
        </div>
        <p className="text-xs text-muted-foreground">
          You earn only in <span className="text-foreground font-medium">$ADR</span>. Swap ADR to USDT
          in Profile ({settings.min_swap_adr} ADR minimum) and withdraw from your USDT wallet.
        </p>
      </GlassCard>

      <GlassCard className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary glow">
          <Play className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          Watch ad, get up to {settings.ad_reward_adr_max} ADR
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Bonus ADR credited instantly after each completed ad
        </p>
        <Button
          onClick={watch}
          disabled={busy}
          size="lg"
          className="mt-4 h-12 w-full rounded-2xl gradient-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Zap className="mr-2 h-4 w-4" />
          {busy ? "Loading ad…" : "Watch & earn ADR"}
        </Button>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Flame className="h-4 w-4 text-primary" /> Daily goal
          </span>
          <span className="text-muted-foreground">
            {player.ads_watched_today}/{dailyGoal} ads
          </span>
        </div>
        <Progress value={pct} className="mt-3 h-2 bg-white/10" />
        <p className="mt-2 text-xs text-muted-foreground">
          Watch {dailyGoal} ads today to keep withdrawals unlocked. Resets every day.
        </p>
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Ads total" value={String(player.ads_watched_total)} />
        <Stat label="Tasks" value={String(player.tasks_completed)} />
        <Stat label="Referrals" value={String(player.referrals_count)} accent />
      </div>

      <GlassCard className="flex items-center gap-3">
        <Coins className="h-4 w-4 text-primary" />
        <p className="text-[11px] text-muted-foreground">
          USDT balance {usd(player.balance)} — created only by swapping ADR, used for withdrawals.
        </p>
      </GlassCard>
    </div>
  );
}
