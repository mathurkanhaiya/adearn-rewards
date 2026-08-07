import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

import { GlassCard } from "./GlassCard";
import { fnLeaderboard } from "@/lib/api.functions";
import { getInitData } from "@/lib/telegram-client";
import { cn } from "@/lib/utils";

const PRIZES = ["$3", "$2", "$1"];

export function LeaderboardTab() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const board = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => fnLeaderboard({ data: { initData: getInitData(), period } }),
  });

  return (
    <div className="space-y-4">
      <GlassCard className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full gradient-gold">
          <Trophy className="h-6 w-6 text-background" />
        </div>
        <h2 className="mt-3 text-lg font-semibold">Referral leaderboard</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Monthly top 3 win $3 · $2 · $1 — resets every month
        </p>
      </GlassCard>

      <div className="glass-soft grid grid-cols-2 gap-1 rounded-2xl p-1">
        {(["weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-xl py-2 text-sm font-medium capitalize transition-colors",
              period === p ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      {board.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (board.data ?? []).length === 0 ? (
        <GlassCard className="py-10 text-center text-sm text-muted-foreground">
          No verified referrals yet this {period === "weekly" ? "week" : "month"}. Be the first.
        </GlassCard>
      ) : (
        <GlassCard className="divide-y divide-white/10 p-0">
          {(board.data ?? []).map((row) => (
            <div key={row.rank} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                  row.rank === 1 && "gradient-gold text-background",
                  row.rank === 2 && "bg-silver/80 text-background",
                  row.rank === 3 && "bg-bronze/80 text-background",
                  row.rank > 3 && "glass-soft text-muted-foreground",
                )}
              >
                {row.rank}
              </span>
              <p className="flex-1 truncate text-sm font-medium">@{row.name}</p>
              {period === "monthly" && row.rank <= 3 ? (
                <span className="rounded-full glass-soft px-2 py-0.5 text-[10px] text-gold">
                  {PRIZES[row.rank - 1]}
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">{row.referrals}</span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}
