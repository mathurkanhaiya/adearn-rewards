import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, ListChecks, Trophy, Users, User, Shield } from "lucide-react";

import { EarnTab } from "@/components/miniapp/EarnTab";
import { TasksTab } from "@/components/miniapp/TasksTab";
import { ReferTab } from "@/components/miniapp/ReferTab";
import { LeaderboardTab } from "@/components/miniapp/LeaderboardTab";
import { ProfileTab } from "@/components/miniapp/ProfileTab";
import { useAppState, useRefreshState } from "@/lib/useAppState";
import { showAd, AD_BLOCK_OPEN } from "@/lib/telegram-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ads Rewards — Play, Watch Ads & Earn on Telegram" },
      {
        name: "description",
        content:
          "Watch ads, finish Telegram tasks and invite friends to earn real rewards. Withdraw in UPI or USDT on Polygon from the Ads Rewards mini app.",
      },
      { property: "og:title", content: "Ads Rewards — Watch Ads & Earn" },
      {
        property: "og:description",
        content:
          "Earn up to $0.01 per ad, up to $0.025 per referral plus 35% lifetime commission. Withdraw in UPI or USDT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MiniApp,
});

const TABS = [
  { id: "earn", label: "Earn", icon: Gauge },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "refer", label: "Refer", icon: Users },
  { id: "top", label: "Top", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof TABS)[number]["id"];

function MiniApp() {
  const [tab, setTab] = useState<TabId>("earn");
  const env = useTelegramEnv();
  const state = useAppState(env === "telegram");
  const refresh = useRefreshState();

  useEffect(() => {
    if (env !== "telegram") return;
    void showAd(AD_BLOCK_OPEN).catch(() => undefined);
  }, [env]);

  if (env === "checking") return <LoadingScreen message="Connecting to Telegram…" />;
  if (env === "browser") return <OpenInTelegram />;
  if (state.isError)
    return (
      <OpenInTelegram
        note={(state.error as Error)?.message || "We couldn't verify your Telegram session."}
      />
    );
  if (state.isLoading || !state.data) return <LoadingScreen />;


  const { player, settings, admin, pendingWithdrawal } = state.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Ads <span className="text-gradient">Rewards</span>
          </h1>
          <p className="text-[11px] text-muted-foreground">Play & earn on Telegram</p>
        </div>
        {admin ? (
          <Link
            to="/admin"
            className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          >
            <Shield className="h-3.5 w-3.5 text-primary" /> Admin
          </Link>
        ) : null}
      </header>

      {tab === "earn" && <EarnTab player={player} settings={settings} onDone={refresh} />}
      {tab === "tasks" && <TasksTab onDone={refresh} />}
      {tab === "refer" && <ReferTab player={player} />}
      {tab === "top" && <LeaderboardTab />}
      {tab === "profile" && (
        <ProfileTab
          player={player}
          settings={settings}
          pending={pendingWithdrawal}
          onDone={refresh}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-4 pb-4">
        <div className="glass grid grid-cols-5 gap-1 rounded-3xl p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition-colors",
                tab === id ? "gradient-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
