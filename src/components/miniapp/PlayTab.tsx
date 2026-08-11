import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Gift, Sparkles, Ticket, Zap } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fnClaimDaily,
  fnClaimPromo,
  fnExtraAttempt,
  fnPlayGame,
  fnRefillEnergy,
  fnTap,
} from "@/lib/api.functions";
import { getInitData, showRewardedAd } from "@/lib/telegram-client";
import { fx } from "@/lib/fx";
import { cn } from "@/lib/utils";
import type { Player, Settings } from "@/lib/app.server";

const adr = (n: number) => `${Math.round(n * 100) / 100} ADR`;

function SectionTitle({ icon: Icon, title, sub }: { icon: typeof Zap; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="glass-soft flex h-8 w-8 items-center justify-center rounded-2xl">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {sub ? <p className="text-[11px] text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------ daily reward ------------------------------ */

function DailyCard({
  player,
  claimed,
  onDone,
}: {
  player: Player;
  claimed: boolean;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const claim = async (doubled: boolean) => {
    setBusy(true);
    try {
      if (doubled) {
        const watched = await showRewardedAd();
        if (!watched) {
          toast.error("Ad not completed — claiming the normal reward instead.");
          doubled = false;
        }
      }
      const res = await fnClaimDaily({ data: { initData: getInitData(), doubled } });
      fx.win(doubled);
      toast.success(`+${adr(res.reward)} · day ${res.streak} streak`);
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Could not claim");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="space-y-3">
      <SectionTitle icon={CalendarCheck} title="Daily login" sub={`Streak · day ${player.login_streak || 0}`} />
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < (player.login_streak || 0) % 8 ? "gradient-primary" : "glass-soft",
            )}
          />
        ))}
      </div>
      {claimed ? (
        <p className="text-xs text-muted-foreground">Claimed today — come back tomorrow.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={busy}
            onClick={() => claim(false)}
            className="h-10 rounded-2xl gradient-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            Claim
          </Button>
          <Button
            disabled={busy}
            onClick={() => claim(true)}
            variant="ghost"
            className="h-10 rounded-2xl glass-soft text-xs font-semibold"
          >
            Watch ad · 2×
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

/* --------------------------------- spin ---------------------------------- */

function SpinCard({
  player,
  settings,
  onDone,
}: {
  player: Player;
  settings: Settings;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [angle, setAngle] = useState(0);
  const left = settings.free_spins + player.spin_extra - player.spins_used;
  const extraLeft = settings.max_extra_spins - player.spin_extra;

  const spin = async (doubled: boolean) => {
    setBusy(true);
    try {
      if (doubled) {
        const watched = await showRewardedAd();
        if (!watched) {
          toast.error("Ad not completed — spinning for the normal reward.");
          doubled = false;
        }
      }
      fx.spin();
      setAngle((a) => a + 1440 + Math.floor(Math.random() * 360));
      const res = await fnPlayGame({ data: { initData: getInitData(), game: "spin", doubled } });
      await new Promise((r) => setTimeout(r, 1800));
      fx.win(doubled);
      toast.success(`You won ${adr(res.reward)}`);
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Spin failed");
    } finally {
      setBusy(false);
    }
  };

  const extra = async () => {
    setBusy(true);
    try {
      const watched = await showRewardedAd();
      if (!watched) throw new Error("Ad not completed.");
      await fnExtraAttempt({ data: { initData: getInitData(), game: "spin" } });
      fx.click();
      toast.success("Extra spin unlocked");
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "No extra spin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="space-y-3">
      <SectionTitle icon={Sparkles} title="Spin wheel" sub={`${Math.max(0, left)} spin(s) left today`} />
      <div className="relative mx-auto h-40 w-40">
        <div
          className="h-full w-full rounded-full border border-white/15 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.6)]"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: "transform 1.8s cubic-bezier(0.2, 0.8, 0.1, 1)",
            background:
              "conic-gradient(var(--primary) 0deg 45deg, transparent 45deg 90deg, var(--gold, var(--primary)) 90deg 135deg, transparent 135deg 180deg, var(--primary) 180deg 225deg, transparent 225deg 270deg, var(--gold, var(--primary)) 270deg 315deg, transparent 315deg 360deg)",
            opacity: 0.85,
          }}
        />
        <div className="glass absolute inset-8 flex items-center justify-center rounded-full text-xs font-semibold">
          {settings.game_min}–{settings.game_max} ADR
        </div>
        <div className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-primary" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={busy || left <= 0}
          onClick={() => spin(false)}
          className="h-10 rounded-2xl gradient-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          {left > 0 ? "Spin free" : "No spins"}
        </Button>
        {left > 0 ? (
          <Button
            disabled={busy}
            onClick={() => spin(true)}
            variant="ghost"
            className="h-10 rounded-2xl glass-soft text-xs font-semibold"
          >
            Watch ad · 2×
          </Button>
        ) : (
          <Button
            disabled={busy || extraLeft <= 0}
            onClick={extra}
            variant="ghost"
            className="h-10 rounded-2xl glass-soft text-xs font-semibold"
          >
            {extraLeft > 0 ? `Ad → +1 (${extraLeft})` : "Limit reached"}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}

/* ------------------------------ scratch card ------------------------------ */

function ScratchCard({
  player,
  settings,
  onDone,
}: {
  player: Player;
  settings: Settings;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<number | null>(null);
  const left = settings.free_scratch + player.scratch_extra - player.scratch_used;
  const extraLeft = settings.max_extra_scratch - player.scratch_extra;

  const play = async (doubled: boolean) => {
    setBusy(true);
    setRevealed(null);
    try {
      if (doubled) {
        const watched = await showRewardedAd();
        if (!watched) {
          toast.error("Ad not completed — scratching for the normal reward.");
          doubled = false;
        }
      }
      const res = await fnPlayGame({ data: { initData: getInitData(), game: "scratch", doubled } });
      setRevealed(res.reward);
      fx.win(doubled);
      toast.success(`You scratched ${adr(res.reward)}`);
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Scratch failed");
    } finally {
      setBusy(false);
    }
  };

  const extra = async () => {
    setBusy(true);
    try {
      const watched = await showRewardedAd();
      if (!watched) throw new Error("Ad not completed.");
      await fnExtraAttempt({ data: { initData: getInitData(), game: "scratch" } });
      fx.click();
      toast.success("Extra card unlocked");
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "No extra card");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="space-y-3">
      <SectionTitle icon={Ticket} title="Scratch card" sub={`${Math.max(0, left)} card(s) left today`} />
      <div
        className={cn(
          "flex h-24 items-center justify-center rounded-2xl border border-white/10 text-xl font-bold transition-all duration-500",
          revealed === null ? "glass-soft text-muted-foreground" : "gradient-primary text-primary-foreground animate-scale-in",
        )}
      >
        {revealed === null ? "? ? ?" : adr(revealed)}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          disabled={busy || left <= 0}
          onClick={() => play(false)}
          className="h-10 rounded-2xl gradient-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          {left > 0 ? "Scratch" : "No cards"}
        </Button>
        {left > 0 ? (
          <Button
            disabled={busy}
            onClick={() => play(true)}
            variant="ghost"
            className="h-10 rounded-2xl glass-soft text-xs font-semibold"
          >
            Watch ad · 2×
          </Button>
        ) : (
          <Button
            disabled={busy || extraLeft <= 0}
            onClick={extra}
            variant="ghost"
            className="h-10 rounded-2xl glass-soft text-xs font-semibold"
          >
            {extraLeft > 0 ? `Ad → +1 (${extraLeft})` : "Limit reached"}
          </Button>
        )}
      </div>
    </GlassCard>
  );
}

/* ------------------------------- tap & earn ------------------------------- */

function TapCard({
  player,
  settings,
  onDone,
}: {
  player: Player;
  settings: Settings;
  onDone: () => void;
}) {
  const [energy, setEnergy] = useState(player.energy);
  const [earned, setEarned] = useState(0);
  const [pop, setPop] = useState(0);
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setEnergy(player.energy), [player.energy]);
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const flush = async () => {
    const taps = pending.current;
    pending.current = 0;
    if (taps <= 0) return;
    try {
      const res = await fnTap({ data: { initData: getInitData(), taps } });
      setEnergy(res.energy);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Tap failed");
    }
  };

  const onTap = () => {
    if (energy <= 0) {
      fx.error();
      toast.error("Out of energy — watch an ad for an instant refill.");
      return;
    }
    fx.tap();
    setEnergy((e) => Math.max(0, e - 1));
    setEarned((e) => Math.round((e + settings.tap_reward) * 100) / 100);
    setPop((p) => p + 1);
    pending.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  };

  const refill = async () => {
    const watched = await showRewardedAd();
    if (!watched) {
      toast.error("Ad not completed.");
      return;
    }
    const res = await fnRefillEnergy({ data: { initData: getInitData() } });
    setEnergy(res.energy);
    fx.win();
    toast.success("Energy refilled");
    onDone();
  };

  const pct = Math.round((energy / Math.max(1, settings.energy_max)) * 100);

  return (
    <GlassCard className="space-y-3">
      <SectionTitle icon={Zap} title="Tap & earn" sub={`${settings.tap_reward} ADR per tap`} />
      <button
        onClick={onTap}
        className="mx-auto flex h-36 w-36 select-none items-center justify-center rounded-full gradient-primary text-2xl font-bold text-primary-foreground shadow-[0_0_50px_-12px_hsl(var(--primary))] transition-transform active:scale-95"
      >
        <span key={pop} className="animate-scale-in">
          TAP
        </span>
      </button>
      <div className="space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full glass-soft">
          <div className="h-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>
            ⚡ {Math.floor(energy)}/{settings.energy_max}
          </span>
          <span>Session +{adr(earned)}</span>
        </div>
      </div>
      <Button
        onClick={refill}
        variant="ghost"
        className="h-10 w-full rounded-2xl glass-soft text-xs font-semibold"
      >
        Watch ad · instant refill
      </Button>
    </GlassCard>
  );
}

/* --------------------------------- promo --------------------------------- */

function PromoCard({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    setBusy(true);
    try {
      const res = await fnClaimPromo({ data: { initData: getInitData(), code } });
      fx.win();
      toast.success(
        res.kind === "adr" ? `+${adr(res.amount)} added` : `+${res.amount} extra ${res.kind}`,
      );
      setCode("");
      onDone();
    } catch (e) {
      fx.error();
      toast.error(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  return (
    <GlassCard className="space-y-3">
      <SectionTitle icon={Gift} title="Promo code" sub="Redeem ADR, spins or scratch cards" />
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          className="rounded-2xl glass-soft border-white/10 uppercase"
        />
        <Button
          disabled={busy || !code.trim()}
          onClick={claim}
          className="h-10 rounded-2xl gradient-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          Claim
        </Button>
      </div>
    </GlassCard>
  );
}

/* --------------------------------- tab ----------------------------------- */

export function PlayTab({
  player,
  settings,
  dailyClaimed,
  onDone,
}: {
  player: Player;
  settings: Settings;
  dailyClaimed: boolean;
  onDone: () => void;
}) {
  const on = (k: string) => settings.features?.[k] !== false;
  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ADR balance</p>
          <p className="text-2xl font-bold text-gradient">{adr(player.adr_balance)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rate</p>
          <p className="text-xs font-semibold">
            {settings.min_swap_adr} ADR = ${Math.round(settings.min_swap_adr * settings.adr_rate * 100) / 100}
          </p>
        </div>
      </GlassCard>

      {on("daily") && <DailyCard player={player} claimed={dailyClaimed} onDone={onDone} />}
      {on("spin") && <SpinCard player={player} settings={settings} onDone={onDone} />}
      {on("scratch") && <ScratchCard player={player} settings={settings} onDone={onDone} />}
      {on("tap") && <TapCard player={player} settings={settings} onDone={onDone} />}
      {on("promo") && <PromoCard onDone={onDone} />}
    </div>
  );
}
