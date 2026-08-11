import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Flame, Trophy } from "lucide-react";

import { GlassCard } from "./GlassCard";
import { fnBoardTop, fnContests, fnLeaderboard } from "@/lib/api.functions";
import { getInitData } from "@/lib/telegram-client";
import { fx } from "@/lib/fx";
import { usd } from "@/lib/format";
import { cn } from "@/lib/utils";

const BOARDS = [
  { id: "invites", label: "Invites" },
  { id: "adr", label: "ADR" },
  { id: "usdt", label: "Withdrawn" },
] as const;

type BoardId = (typeof BOARDS)[number]["id"];

export function LeaderboardTab() {
  const [board, setBoard] = useState<BoardId>("invites");
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const top = useQuery({
    queryKey: ["board", board],
    queryFn: () => fnBoardTop({ data: { initData: getInitData(), board } }),
  });
  const refs = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fnLeaderboard({ data: { initData: getInitData(), period } }),
  });
  const contests = useQuery({
    queryKey: ["contests"],
    queryFn: () => fnContests({ data: { initData: getInitData() } }),
  });

  const rows =
    board === "invites"
      ? (refs.data ?? []).map((r) => ({ rank: r.rank, name: r.name, value: r.referrals }))
      : (top.data ?? []);

  const fmt = (v: number) =>
    board === "usdt" ? usd(v, 2) : board === "adr" ? `${v} ADR` : `${v} invites`;

  return (
    <div className="space-y-4">
      <GlassCard className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold">Leaderboard</h3>
        </div>

        <div className="glass-soft grid grid-cols-3 gap-1 rounded-2xl p-1">
          {BOARDS.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                fx.click();
                setBoard(b.id);
              }}
              className={cn(
                "rounded-xl py-2 text-[11px] font-medium transition-colors",
                board === b.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {b.label}
            </button>
          ))}
        </div>

        {board === "invites" ? (
          <div className="glass-soft grid grid-cols-2 gap-1 rounded-2xl p-1">
            {(["weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  fx.click();
                  setPeriod(p);
                }}
                className={cn(
                  "rounded-xl py-1.5 text-[11px] font-medium capitalize transition-colors",
                  period === p ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}

        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rankings yet — be the first.</p>
        ) : (
          rows.map((r) => (
            <div
              key={`${r.rank}-${r.name}`}
              className="flex items-center gap-3 rounded-2xl glass-soft px-3 py-2 text-xs"
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                  r.rank <= 3 ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {r.rank}
              </span>
              <span className="flex-1 truncate">{r.name}</span>
              <span className="font-semibold">{fmt(r.value)}</span>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard className="space-y-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-semibold">Monthly referral prizes</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["1st", "$3"],
            ["2nd", "$2"],
            ["3rd", "$1"],
          ].map(([p, v]) => (
            <div key={p} className="rounded-2xl glass-soft py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p}</p>
              <p className="mt-1 font-semibold text-gradient">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Resets at the start of every month.</p>
      </GlassCard>

      <GlassCard className="space-y-2">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Active contests</h3>
        </div>
        {(contests.data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No contests running right now.</p>
        ) : (
          (contests.data ?? []).map((c) => (
            <div key={c.id} className="rounded-2xl glass-soft p-3 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{c.title}</p>
                <span className="text-gradient font-semibold">
                  {c.reward_type === "usd" ? usd(c.reward_amount, 2) : `${c.reward_amount} ADR`}
                </span>
              </div>
              {c.description ? <p className="mt-1 text-muted-foreground">{c.description}</p> : null}
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                {c.metric} · ends {new Date(c.ends_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
