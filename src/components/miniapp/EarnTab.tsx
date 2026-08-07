import { useState } from "react";
import { Play, Zap, Flame } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Stat } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fnWatchAd } from "@/lib/api.functions";
import { getInitData, showAd, AD_BLOCK_REWARD } from "@/lib/telegram-client";
import { usd } from "@/lib/format";
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
      toast.success(`+${usd(res.reward)} added to your balance`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ad not completed");
    } finally {
      setBusy(false);
    }
  };

  const dailyGoal = settings.req_daily_ads;
  const pct = Math.min(100, (player.ads_watched_today / dailyGoal) * 100);

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden text-center">
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your balance</p>
        <p className="mt-2 text-4xl font-bold text-gradient">{usd(player.balance)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          All-time earned {usd(player.total_earned)}
        </p>
      </GlassCard>

      <GlassCard className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-primary glow">
          <Play className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Watch ad, get up to $0.01</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Instant reward credited after each completed ad
        </p>
        <Button
          onClick={watch}
          disabled={busy}
          size="lg"
          className="mt-4 h-12 w-full rounded-2xl gradient-primary text-primary-foreground font-semibold hover:opacity-90"
        >
          <Zap className="mr-2 h-4 w-4" />
          {busy ? "Loading ad…" : "Watch & earn"}
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
    </div>
  );
}
