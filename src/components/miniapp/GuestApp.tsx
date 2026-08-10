import { useState } from "react";
import { Gauge, ListChecks, Trophy, Users, User, Lock } from "lucide-react";

import { GlassCard, Stat } from "@/components/miniapp/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/format";

const BOT_URL = "https://t.me/Adsrewartsbot";

const TABS = [
  { id: "earn", label: "Earn", icon: Gauge },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "refer", label: "Refer", icon: Users },
  { id: "top", label: "Top", icon: Trophy },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof TABS)[number]["id"];

function LockedNote({ children }: { children: React.ReactNode }) {
  return (
    <GlassCard className="space-y-3 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl glass-soft">
        <Lock className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground">{children}</p>
      <Button
        asChild
        className="w-full rounded-2xl gradient-primary text-primary-foreground"
      >
        <a href={BOT_URL} target="_blank" rel="noreferrer">
          Open in Telegram
        </a>
      </Button>
    </GlassCard>
  );
}

/** Read-only preview of the mini app for anyone opening it in a normal browser. */
export function GuestApp() {
  const [tab, setTab] = useState<TabId>("earn");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-28 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Ads <span className="text-gradient">Rewards</span>
          </h1>
          <p className="text-[11px] text-muted-foreground">Play &amp; earn on Telegram</p>
        </div>
        <span className="glass rounded-full px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          Guest
        </span>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stat label="Balance" value={usd(0)} accent />
        <Stat label="All-time earnings" value={usd(0, 3)} />
      </div>

      {tab === "earn" && (
        <div className="space-y-3">
          <GlassCard className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">Watch an ad, get up to</p>
            <p className="text-3xl font-bold text-gradient">$0.01</p>
          </GlassCard>
          <LockedNote>Sign in through Telegram to watch ads and start earning.</LockedNote>
        </div>
      )}

      {tab === "tasks" && (
        <LockedNote>Tasks are available for Telegram players only.</LockedNote>
      )}

      {tab === "refer" && (
        <div className="space-y-3">
          <GlassCard className="space-y-1 text-center">
            <p className="text-xs text-muted-foreground">Per verified referral, up to</p>
            <p className="text-3xl font-bold text-gradient">$0.025</p>
            <p className="text-[11px] text-muted-foreground">plus 35% commission for life</p>
          </GlassCard>
          <LockedNote>Open the bot to get your personal referral link.</LockedNote>
        </div>
      )}

      {tab === "top" && (
        <div className="space-y-3">
          <GlassCard className="space-y-2 text-xs text-muted-foreground">
            <p className="text-sm font-semibold text-foreground">Monthly prizes</p>
            <p>1st — $3 · 2nd — $2 · 3rd — $1</p>
          </GlassCard>
          <LockedNote>Join from Telegram to appear on the weekly and monthly boards.</LockedNote>
        </div>
      )}

      {tab === "profile" && (
        <LockedNote>
          Guest accounts can browse only. Open the app inside Telegram to earn and withdraw.
        </LockedNote>
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
