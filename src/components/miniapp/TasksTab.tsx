import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";

import { GlassCard } from "./GlassCard";
import { Button } from "@/components/ui/button";
import { fnListTasks, fnCompleteTask } from "@/lib/api.functions";
import { getInitData, openLink } from "@/lib/telegram-client";
import { usd } from "@/lib/format";

export function TasksTab({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState<string | null>(null);
  const tasks = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fnListTasks({ data: { initData: getInitData() } }),
  });

  const verify = async (id: string) => {
    setPending(id);
    try {
      const res = await fnCompleteTask({ data: { initData: getInitData(), taskId: id } });
      toast.success(`Task done · +${usd(res.reward)}`);
      await tasks.refetch();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not verify task");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl gradient-primary">
          <ListChecks className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Tasks</h2>
          <p className="text-xs text-muted-foreground">Join, subscribe and earn instantly</p>
        </div>
      </GlassCard>

      {tasks.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading tasks…</p>
      ) : (tasks.data ?? []).length === 0 ? (
        <GlassCard className="py-10 text-center text-sm text-muted-foreground">
          No live tasks right now. Check back soon.
        </GlassCard>
      ) : (
        (tasks.data ?? []).map((t) => (
          <GlassCard key={t.id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                ) : null}
                <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.task_type}
                </span>
              </div>
              <span className="shrink-0 rounded-full gradient-gold px-3 py-1 text-xs font-semibold text-background">
                {usd(t.reward, 3)}
              </span>
            </div>
            {t.completed ? (
              <div className="flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl glass-soft"
                  onClick={() => openLink(t.link)}
                >
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Open
                </Button>
                <Button
                  className="flex-1 rounded-2xl gradient-primary text-primary-foreground hover:opacity-90"
                  disabled={pending === t.id}
                  onClick={() => verify(t.id)}
                >
                  {pending === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            )}
          </GlassCard>
        ))
      )}
    </div>
  );
}
