import { Copy, Share2, Users } from "lucide-react";
import { toast } from "sonner";

import { GlassCard, Stat } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { referralLink, openLink } from "@/lib/telegram-client";
import { adr } from "@/lib/format";
import type { Player } from "@/lib/app.server";

export function ReferTab({ player }: { player: Player }) {
  const link = referralLink(player.tg_id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied");
    } catch {
      toast.error("Copy failed — long-press the link instead");
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="relative overflow-hidden text-center">
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full gradient-gold">
          <Users className="h-6 w-6 text-background" />
        </div>
        <h2 className="mt-3 text-lg font-semibold">Invite & earn up to 250 ADR</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Plus 35% lifetime commission on everything your friends earn
        </p>
      </GlassCard>

      <GlassCard className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Your link</p>
        <p className="break-all rounded-2xl glass-soft p-3 text-xs">{link}</p>
        <div className="flex gap-2">
          <Button className="flex-1 rounded-2xl gradient-primary text-primary-foreground hover:opacity-90" onClick={copy}>
            <Copy className="mr-1.5 h-4 w-4" /> Copy
          </Button>
          <Button
            variant="secondary"
            className="flex-1 rounded-2xl glass-soft"
            onClick={() =>
              openLink(
                `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
                  "Join Ads Rewards — play, earn $ADR and swap to USDT!",
                )}`,
              )
            }
          >
            <Share2 className="mr-1.5 h-4 w-4" /> Share
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Verified referrals" value={String(player.referrals_count)} />
        <Stat label="Referral earnings" value={adr(player.referral_earned)} accent />
      </div>

      <GlassCard className="text-xs text-muted-foreground">
        A referral counts as verified once your friend watches 5 ads. Bonuses are random per verified
        referral, and commissions are paid automatically for life.
      </GlassCard>
    </div>
  );
}
